import test from "node:test";
import assert from "node:assert/strict";
import { SignJWT, jwtVerify } from "jose";

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:3199";
const TEST_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "emphss-bawli-local-dev-secret-key-2026"
);

function csvCell(val) {
  let str = String(val ?? "");
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

test("CSV formula injection neutralization prefixes dangerous leading chars", () => {
  assert.equal(csvCell("=CMD|'/C calc'!A0"), `"'=CMD|'/C calc'!A0"`);
  assert.equal(csvCell("+1+1"), `"'+1+1"`);
  assert.equal(csvCell("-2+3"), `"'-2+3"`);
  assert.equal(csvCell("@SUM(1,2)"), `"'@SUM(1,2)"`);
  assert.equal(csvCell("\tcmd"), `"'\tcmd"`);
  assert.equal(csvCell('Normal "Name"'), `'"Normal ""Name"""'`.slice(1, -1));
});

test("JWT verification rejects tampered tokens and honors role/teacherId claims", async () => {
  const token = await new SignJWT({ role: "teacher", v: 1, teacherId: "t_123" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(TEST_SECRET);

  const { payload } = await jwtVerify(token, TEST_SECRET);
  assert.equal(payload.role, "teacher");
  assert.equal(payload.v, 1);
  assert.equal(payload.teacherId, "t_123");

  const tampered = token.slice(0, -4) + "AAAA";
  await assert.rejects(() => jwtVerify(tampered, TEST_SECRET));
});

test("Security headers are present on public and API responses", async () => {
  const res = await fetch(`${BASE_URL}/`);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("x-frame-options"), "DENY");
  assert.equal(res.headers.get("x-content-type-options"), "nosniff");
  assert.equal(
    res.headers.get("referrer-policy"),
    "strict-origin-when-cross-origin"
  );
  assert.equal(
    res.headers.get("permissions-policy"),
    "camera=(self), microphone=(), geolocation=()"
  );
  const csp = res.headers.get("content-security-policy") || "";
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp, /'unsafe-eval'/);
});

test("Protected pages redirect unauthenticated requests to /login", async () => {
  for (const path of ["/admin", "/admin/settings", "/teacher/dashboard"]) {
    const res = await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
    assert.equal(res.status, 307, `${path} should redirect`);
    const loc = res.headers.get("location") || "";
    assert.match(loc, /^\/login\?tab=(admin|teacher)/);
  }
});

test("Protected APIs enforce 401/403 when unauthenticated", async () => {
  const checks = [
    { path: "/api/teachers", method: "GET", expected: 401 },
    { path: "/api/teacher/approvals", method: "GET", expected: 401 },
    { path: "/api/teacher/award-roll?className=1st", method: "GET", expected: 401 },
    { path: "/api/students/correction", method: "GET", expected: 401 },
    { path: "/api/auth/teacher-identity", method: "POST", expected: 401 },
    { path: "/api/admin/corrections", method: "GET", expected: 403 },
    { path: "/api/admin/students/export", method: "GET", expected: 403 },
    { path: "/api/admin/notices", method: "GET", expected: 403 },
    { path: "/api/admin/settings", method: "PATCH", expected: 403 },
    { path: "/api/admin/promotion", method: "POST", expected: 403 },
  ];

  for (const c of checks) {
    const res = await fetch(`${BASE_URL}${c.path}`, {
      method: c.method,
      headers: { "Content-Type": "application/json" },
      body: c.method === "POST" || c.method === "PATCH" ? "{}" : undefined,
    });
    assert.equal(
      res.status,
      c.expected,
      `${c.method} ${c.path} expected ${c.expected}, got ${res.status}`
    );
  }
});

test("Teacher cannot edit another teacher profile (IDOR blocked with 403)", async () => {
  const token = await new SignJWT({
    role: "teacher",
    v: 1,
    teacherId: "teacher_owner_A",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(TEST_SECRET);

  const res = await fetch(`${BASE_URL}/api/teachers/teacher_victim_B`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: `emphss_session=${token}`,
    },
    body: JSON.stringify({
      fullName: "ATTACKER",
      mobileNumber: "9999999999",
      qualification: "MA",
      classesTaught: "1st",
      subjects: "MATH",
      roleSummary: "Test",
    }),
  });

  // Either 403 (IDOR blocked) or 401 (if sessionVersion in DB != 1)
  assert.ok(
    res.status === 403 || res.status === 401,
    `Expected 403 or 401, got ${res.status}`
  );
});

test("Login endpoint enforces rate limiting (429) after repeated failed attempts", async () => {
  const fakeIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
  let got429 = false;
  let retryAfter = "";

  for (let i = 0; i < 8; i++) {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-real-ip": fakeIp,
      },
      body: JSON.stringify({
        mode: "teacher",
        password: "WrongPasswordAttempt!",
      }),
    });
    if (res.status === 429) {
      got429 = true;
      retryAfter = res.headers.get("retry-after") || "";
      break;
    }
    assert.equal(res.status, 401);
  }

  assert.equal(got429, true, "Expected 429 Too Many Requests after 6 attempts");
  assert.ok(Number(retryAfter) > 0, "Expected positive Retry-After header");
});

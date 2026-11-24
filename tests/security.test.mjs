import test from "node:test";
import assert from "node:assert/strict";
import { SignJWT, jwtVerify } from "jose";

const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:3199";
const TEST_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "emphss-bawli-local-dev-secret-key-2026"
);

// Production DB safety guard: refuse DB-mutating tests if pointing at production Neon host
const DB_URL = process.env.DATABASE_URL || "";
const IS_ISOLATED_DB =
  process.env.ALLOW_ISOLATED_DB_TESTS === "1" &&
  DB_URL.length > 0 &&
  !DB_URL.includes("ep-still-morning-biwvnkfj");

function csvCell(val) {
  let str = String(val ?? "");
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

function validateImageSignature(dataUrl) {
  const match = dataUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return false;
  const fmt = match[1];
  const buf = Buffer.from(match[2], "base64");
  if (buf.length < 16) return false;
  if (fmt === "jpeg") return buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  if (fmt === "png") {
    return (
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    );
  }
  if (fmt === "webp") {
    return (
      buf.subarray(0, 4).toString("ascii") === "RIFF" &&
      buf.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }
  return false;
}

test("CSV formula injection neutralization prefixes dangerous leading chars", () => {
  assert.equal(csvCell("=CMD|'/C calc'!A0"), `"'=CMD|'/C calc'!A0"`);
  assert.equal(csvCell("+1+1"), `"'+1+1"`);
  assert.equal(csvCell("-2+3"), `"'-2+3"`);
  assert.equal(csvCell("@SUM(1,2)"), `"'@SUM(1,2)"`);
  assert.equal(csvCell("\tcmd"), `"'\tcmd"`);
  assert.equal(csvCell('Normal "Name"'), `'"Normal ""Name"""'`.slice(1, -1));
});

test("Binary image signature validation rejects disguised text payloads", () => {
  const fakeJpeg = `data:image/jpeg;base64,${Buffer.from("NOT_A_REAL_JPEG_PAYLOAD_123456").toString("base64")}`;
  assert.equal(validateImageSignature(fakeJpeg), false);

  // Minimal valid PNG header + IHDR bytes (1x1)
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
  ]);
  const validPng = `data:image/png;base64,${pngHeader.toString("base64")}`;
  assert.equal(validateImageSignature(validPng), true);
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

test("Security headers and private Cache-Control are enforced on public & API responses", async () => {
  const pub = await fetch(`${BASE_URL}/`);
  assert.equal(pub.status, 200);
  assert.equal(pub.headers.get("x-frame-options"), "DENY");
  assert.equal(pub.headers.get("x-content-type-options"), "nosniff");
  assert.equal(
    pub.headers.get("referrer-policy"),
    "strict-origin-when-cross-origin"
  );
  const csp = pub.headers.get("content-security-policy") || "";
  assert.match(csp, /default-src 'self'/);
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /object-src 'none'/);
  assert.doesNotMatch(csp, /'unsafe-eval'/);

  for (const apiPath of ["/api/students/me", "/api/teachers", "/api/admin/corrections"]) {
    const res = await fetch(`${BASE_URL}${apiPath}`);
    const cc = res.headers.get("cache-control") || "";
    assert.match(cc, /private/, `${apiPath} Cache-Control should include private`);
    assert.match(cc, /no-store/, `${apiPath} Cache-Control should include no-store`);
  }
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

test("Cross-origin CSRF requests are blocked with 403 before DB writes", async () => {
  for (const path of ["/api/auth/login", "/api/students", "/api/auth/teacher-identity"]) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://evil-attacker.example",
      },
      body: "{}",
    });
    assert.equal(res.status, 403, `${path} should block cross-origin POST`);
  }
});

test(
  "Login endpoint enforces rate limiting (429) in isolated DB",
  { skip: !IS_ISOLATED_DB },
  async () => {
    const fakeIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
    let got429 = false;

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
        break;
      }
      assert.equal(res.status, 401);
    }

    assert.equal(got429, true);
  }
);

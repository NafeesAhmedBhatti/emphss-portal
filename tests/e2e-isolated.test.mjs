import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const TEST_DB = process.env.TEST_DATABASE_URL || "";
const ALLOW_DB = process.env.ALLOW_ISOLATED_DB_TESTS === "1";
const BASE_URL = process.env.TEST_BASE_URL || "http://127.0.0.1:3199";

// Fail-closed guard: refuse to run unless explicitly pointed at the isolated test-e2e Neon branch
if (
  !ALLOW_DB ||
  !TEST_DB.includes("ep-still-forest-bibnipex") ||
  TEST_DB.includes("ep-still-morning-biwvnkfj") ||
  process.env.DATABASE_URL !== TEST_DB
) {
  throw new Error(
    "FAIL-CLOSED: Refusing to run E2E tests without isolated TEST_DATABASE_URL (ep-still-forest-bibnipex)."
  );
}

const prisma = new PrismaClient({
  datasources: { db: { url: TEST_DB } },
});

// Valid 1x1 PNG (68 bytes)
const VALID_PNG_DATA_URL =
  "data:image/png;base64," +
  Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
    0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
    0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
    0x42, 0x60, 0x82,
  ]).toString("base64");

function extractCookies(res) {
  const raw = res.headers.getSetCookie?.() || [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

test("Full Isolated DB E2E Security & Functional Suite (20 Scenarios)", async () => {
  // Clean & seed synthetic data only in isolated test-e2e DB
  await prisma.rateLimit.deleteMany({});
  await prisma.correctionRequest.deleteMany({});
  await prisma.awardRoll.deleteMany({});
  await prisma.promotionLog.deleteMany({});
  await prisma.notice.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.teacher.deleteMany({});

  const adminHash = await bcrypt.hash("TestAdmin@2026", 10);
  const teacherPassHash = await bcrypt.hash("TestStaff@2026", 10);

  await prisma.schoolSettings.upsert({
    where: { id: "main" },
    update: {
      currentSession: "2026-27",
      adminEmail: "admin@test.local",
      adminPasswordHash: adminHash,
      teacherAccessHash: teacherPassHash,
      teacherPasscodeRaw: "[REDACTED]",
      sessionVersion: 1,
      registrationOpen: true,
    },
    create: {
      id: "main",
      currentSession: "2026-27",
      adminEmail: "admin@test.local",
      adminPasswordHash: adminHash,
      teacherAccessHash: teacherPassHash,
      teacherPasscodeRaw: "[REDACTED]",
      sessionVersion: 1,
      registrationOpen: true,
    },
  });

  // 1. Admin login
  const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "10.10.1.1" },
    body: JSON.stringify({
      mode: "admin",
      email: "admin@test.local",
      password: "TestAdmin@2026",
    }),
  });
  assert.equal(adminLoginRes.status, 200);
  const adminCookie = extractCookies(adminLoginRes);
  assert.ok(adminCookie.includes("emphss_session="));

  // 2. Admin creates Teacher A (with PIN) and Teacher B (legacy null PIN -> gets 24h enrollmentCode)
  const createTARes = await fetch(`${BASE_URL}/api/teachers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      fullName: "SYNTHETIC TEACHER A",
      fatherName: "FATHER A",
      motherName: "MOTHER A",
      address: "TEST VILLAGE A",
      mobileNumber: "9000000001",
      qualification: "M.SC",
      classesTaught: "1st",
      formTeacherClass: "1st",
      subjects: "MATH",
      roleSummary: "Class 1st Form Teacher",
      pin: "1234",
    }),
  });
  assert.equal(createTARes.status, 201);
  const { teacher: teacherA } = await createTARes.json();

  const createTBRes = await fetch(`${BASE_URL}/api/teachers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({
      fullName: "SYNTHETIC TEACHER B",
      fatherName: "FATHER B",
      motherName: "MOTHER B",
      address: "TEST VILLAGE B",
      mobileNumber: "9000000002",
      qualification: "B.ED",
      classesTaught: "2nd",
      formTeacherClass: "2nd",
      subjects: "ENGLISH",
      roleSummary: "Class 2nd Form Teacher",
    }),
  });
  assert.equal(createTBRes.status, 201);
  const { teacher: teacherB, enrollmentCode: enrollCodeB } =
    await createTBRes.json();
  assert.ok(enrollCodeB && enrollCodeB.length >= 6);

  // 3. Shared-passcode teacher login (unbound session)
  const staffLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "10.10.1.2" },
    body: JSON.stringify({ mode: "teacher", password: "TestStaff@2026" }),
  });
  assert.equal(staffLoginRes.status, 200);
  const unboundCookie = extractCookies(staffLoginRes);

  // Unbound session cannot see teacher PII or access approvals
  const dirRes = await fetch(`${BASE_URL}/api/teachers`, {
    headers: { Cookie: unboundCookie },
  });
  assert.equal(dirRes.status, 200);
  const dirData = await dirRes.json();
  assert.equal(dirData.teachers[0].mobileNumber, undefined);

  const unboundApprovals = await fetch(`${BASE_URL}/api/teacher/approvals`, {
    headers: { Cookie: unboundCookie },
  });
  assert.equal(unboundApprovals.status, 403);

  // 4. Teacher A cannot take over Teacher B's un-enrolled profile without enrollmentCode
  const takeoverRes = await fetch(`${BASE_URL}/api/auth/teacher-identity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: unboundCookie,
      "x-real-ip": "10.10.1.3",
    },
    body: JSON.stringify({ teacherId: teacherB.id, newPin: "9999" }),
  });
  assert.equal(takeoverRes.status, 400);

  // Teacher A binds their own profile with their PIN
  const bindARes = await fetch(`${BASE_URL}/api/auth/teacher-identity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: unboundCookie,
      "x-real-ip": "10.10.1.3",
    },
    body: JSON.stringify({ teacherId: teacherA.id, pin: "1234" }),
  });
  assert.equal(bindARes.status, 200);
  const teacherACookie = extractCookies(bindARes);

  // 5. Teacher A cannot create a new teacher profile (403) or escalate their own classes/subjects
  const unauthCreateTeacher = await fetch(`${BASE_URL}/api/teachers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherACookie },
    body: JSON.stringify({ fullName: "ROGUE TEACHER" }),
  });
  assert.equal(unauthCreateTeacher.status, 403);

  const editSelfRes = await fetch(`${BASE_URL}/api/teachers/${teacherA.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: teacherACookie },
    body: JSON.stringify({
      fullName: "SYNTHETIC TEACHER A",
      fatherName: "FATHER A",
      motherName: "MOTHER A",
      address: "TEST VILLAGE A",
      mobileNumber: "9000000001",
      qualification: "M.SC",
      classesTaught: "1st, 2nd, 12th",
      formTeacherClass: "12th",
      subjects: "PHYSICS",
      roleSummary: "Updated Bio",
    }),
  });
  assert.equal(editSelfRes.status, 200);
  const { teacher: updatedA } = await editSelfRes.json();
  assert.equal(updatedA.classesTaught, "1st");
  assert.equal(updatedA.formTeacherClass, "1st");
  assert.equal(updatedA.subjects, "MATH");

  // Teacher A cannot edit Teacher B's profile (403)
  const editBRes = await fetch(`${BASE_URL}/api/teachers/${teacherB.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: teacherACookie },
    body: JSON.stringify({
      fullName: "HACKED B",
      mobileNumber: "9000000002",
      qualification: "B.ED",
      roleSummary: "Hacked",
    }),
  });
  assert.equal(editBRes.status, 403);

  // Teacher B enrolls legitimately with Admin's single-use enrollmentCode
  const enrollBRes = await fetch(`${BASE_URL}/api/auth/teacher-identity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: unboundCookie,
      "x-real-ip": "10.10.1.4",
    },
    body: JSON.stringify({
      teacherId: teacherB.id,
      enrollmentCode: enrollCodeB,
      newPin: "5678",
    }),
  });
  assert.equal(enrollBRes.status, 200);

  // 6. Parent consent & fake photo enforcement on student registration
  const baseStudentPayload = {
    studentName: "TEST STUDENT ONE",
    fatherName: "TEST FATHER",
    motherName: "TEST MOTHER",
    gender: "Male",
    dateOfBirth: "2015-05-10",
    mobileNumber: "9876543210",
    currentClass: "1st",
    address: "TEST ADDRESS",
    transportMode: "Local",
    subjects: "English, Math",
    photoData: VALID_PNG_DATA_URL,
  };

  const noConsentRes = await fetch(`${BASE_URL}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "10.10.2.1" },
    body: JSON.stringify({ ...baseStudentPayload, parentConsent: false }),
  });
  assert.equal(noConsentRes.status, 400);

  const fakePhotoRes = await fetch(`${BASE_URL}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "10.10.2.2" },
    body: JSON.stringify({
      ...baseStudentPayload,
      parentConsent: true,
      photoData:
        "data:image/jpeg;base64," +
        Buffer.from("FAKE_TEXT_PAYLOAD_NOT_JPEG_DATA_12345").toString("base64"),
    }),
  });
  assert.equal(fakePhotoRes.status, 400);

  // 7. Valid registration + Pending ID card photoData withheld
  const reg1Res = await fetch(`${BASE_URL}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "10.10.2.3" },
    body: JSON.stringify({ ...baseStudentPayload, parentConsent: true }),
  });
  assert.equal(reg1Res.status, 201);
  const { student: stu1 } = await reg1Res.json();
  assert.equal(stu1.status, "Pending");
  assert.equal(stu1.photoData, undefined);
  const stu1Cookie = extractCookies(reg1Res);

  const mePendingRes = await fetch(`${BASE_URL}/api/students/me`, {
    headers: { Cookie: stu1Cookie },
  });
  assert.equal(mePendingRes.status, 200);
  const mePendingData = await mePendingRes.json();
  assert.equal(mePendingData.student.photoData, null);

  // 8. Duplicate registration rejected (409) without leaking referenceId
  const dupRes = await fetch(`${BASE_URL}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "10.10.2.4" },
    body: JSON.stringify({ ...baseStudentPayload, parentConsent: true }),
  });
  assert.equal(dupRes.status, 409);
  const dupJson = await dupRes.json();
  assert.equal(dupJson.existingReferenceId, undefined);
  assert.doesNotMatch(dupJson.error, /EMPHSS-\d+/);

  // 9. Concurrent registrations (2 siblings) + 5-student sibling limit
  const [sib2Res, sib3Res] = await Promise.all([
    fetch(`${BASE_URL}/api/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-real-ip": "10.10.2.5" },
      body: JSON.stringify({
        ...baseStudentPayload,
        studentName: "TEST STUDENT TWO",
        parentConsent: true,
      }),
    }),
    fetch(`${BASE_URL}/api/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-real-ip": "10.10.2.6" },
      body: JSON.stringify({
        ...baseStudentPayload,
        studentName: "TEST STUDENT THREE",
        parentConsent: true,
      }),
    }),
  ]);
  assert.equal(sib2Res.status, 201);
  assert.equal(sib3Res.status, 201);
  const { student: stu2 } = await sib2Res.json();
  const { student: stu3 } = await sib3Res.json();
  assert.notEqual(stu2.referenceId, stu3.referenceId);

  // Siblings 4 & 5 succeed; Sibling 6 blocked by 5-student mobile cap
  const sib4Res = await fetch(`${BASE_URL}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "10.10.2.7" },
    body: JSON.stringify({
      ...baseStudentPayload,
      studentName: "TEST STUDENT FOUR",
      currentClass: "2nd",
      parentConsent: true,
    }),
  });
  assert.equal(sib4Res.status, 201);
  const { student: stu4 } = await sib4Res.json();

  const sib5Res = await fetch(`${BASE_URL}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "10.10.2.8" },
    body: JSON.stringify({
      ...baseStudentPayload,
      studentName: "TEST STUDENT FIVE",
      parentConsent: true,
    }),
  });
  assert.equal(sib5Res.status, 201);

  const sib6Res = await fetch(`${BASE_URL}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "10.10.2.9" },
    body: JSON.stringify({
      ...baseStudentPayload,
      studentName: "TEST STUDENT SIX",
      parentConsent: true,
    }),
  });
  assert.equal(sib6Res.status, 400);

  // 10. Teacher A (Form Teacher of 1st) cannot approve stu4 (Class 2nd -> 403), CAN approve stu1 (Class 1st -> 200)
  const crossApproveRes = await fetch(`${BASE_URL}/api/teacher/approvals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherACookie },
    body: JSON.stringify({ action: "approve", studentId: stu4.id }),
  });
  assert.equal(crossApproveRes.status, 403);

  const approve1Res = await fetch(`${BASE_URL}/api/teacher/approvals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherACookie },
    body: JSON.stringify({ action: "approve", studentId: stu1.id }),
  });
  assert.equal(approve1Res.status, 200);

  // Active student cannot be deleted via reject (404)
  const rejectActiveRes = await fetch(`${BASE_URL}/api/teacher/approvals`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherACookie },
    body: JSON.stringify({ action: "reject", studentId: stu1.id }),
  });
  assert.equal(rejectActiveRes.status, 404);

  // 11. Active student 4-factor login unlocks ID card photoData
  const lookupRes = await fetch(`${BASE_URL}/api/students/lookup`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "10.10.3.1" },
    body: JSON.stringify({
      referenceId: stu1.referenceId,
      dateOfBirth: "2015-05-10",
      mobileNumber: "9876543210",
      motherName: "test mother",
    }),
  });
  assert.equal(lookupRes.status, 200);
  const lookupData = await lookupRes.json();
  assert.equal(lookupData.student.status, "Active");
  assert.equal(lookupData.student.photoData, VALID_PNG_DATA_URL);

  // 12. Student correction request & Admin approval
  const corrCreateRes = await fetch(`${BASE_URL}/api/students/correction`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: stu1Cookie },
    body: JSON.stringify({
      fieldToCorrect: "address",
      requestedValue: "NEW TEST VILLAGE",
      reason: "Typo",
    }),
  });
  assert.equal(corrCreateRes.status, 201);
  const { request: corrReq } = await corrCreateRes.json();

  const corrApproveRes = await fetch(`${BASE_URL}/api/admin/corrections`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ id: corrReq.id, action: "Approve" }),
  });
  assert.equal(corrApproveRes.status, 200);

  // 13. Award Roll class & subject authorization
  const arUnauthClass = await fetch(`${BASE_URL}/api/teacher/award-roll`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherACookie },
    body: JSON.stringify({
      className: "2nd",
      examName: "T1",
      subjects: ["English"],
      marks: {},
    }),
  });
  assert.equal(arUnauthClass.status, 403);

  const arAuthClass = await fetch(`${BASE_URL}/api/teacher/award-roll`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherACookie },
    body: JSON.stringify({
      className: "1st",
      examName: "T1",
      subjects: ["Math", "English"],
      marks: { [stu1.id]: { Math: "45", English: "42" } },
    }),
  });
  assert.equal(arAuthClass.status, 200);

  // Subject-only teacher (Teacher B assigned ENGLISH, classesTaught includes 1st via Admin update) cannot edit Math marks in 1st (403)
  await prisma.teacher.update({
    where: { id: teacherB.id },
    data: { classesTaught: "1st, 2nd", formTeacherClass: "2nd", subjects: "ENGLISH" },
  });
  const bindBRes = await fetch(`${BASE_URL}/api/auth/teacher-identity`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: unboundCookie,
      "x-real-ip": "10.10.1.5",
    },
    body: JSON.stringify({ teacherId: teacherB.id, pin: "5678" }),
  });
  assert.equal(bindBRes.status, 200);
  const teacherBCookie = extractCookies(bindBRes);

  const arUnauthSubject = await fetch(`${BASE_URL}/api/teacher/award-roll`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherBCookie },
    body: JSON.stringify({
      className: "1st",
      examName: "T1",
      subjects: ["Math", "English"],
      marks: { [stu1.id]: { Math: "99", English: "42" } },
    }),
  });
  assert.equal(arUnauthSubject.status, 403);

  // 14. Admin CSV Export & Promotion
  const csvRes = await fetch(`${BASE_URL}/api/admin/students/export`, {
    headers: { Cookie: adminCookie },
  });
  assert.equal(csvRes.status, 200);
  const csvText = await csvRes.text();
  assert.match(csvText, /TEST STUDENT ONE/);
  assert.match(csvText, /NEW TEST VILLAGE/);

  const promoRes = await fetch(`${BASE_URL}/api/admin/promotion`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ toSession: "2027-28", heldBackStudentIds: [] }),
  });
  assert.equal(promoRes.status, 200);
  const promoData = await promoRes.json();
  assert.equal(promoData.summary.promotedCount, 1);

  // 15. Admin registration toggle + Teacher PIN reset revokes Teacher A session
  const regCloseRes = await fetch(`${BASE_URL}/api/admin/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ registrationOpen: false }),
  });
  assert.equal(regCloseRes.status, 200);

  const closedRegRes = await fetch(`${BASE_URL}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-real-ip": "10.10.4.1" },
    body: JSON.stringify({
      ...baseStudentPayload,
      mobileNumber: "9111111111",
      parentConsent: true,
    }),
  });
  assert.equal(closedRegRes.status, 403);

  const resetPinRes = await fetch(`${BASE_URL}/api/teachers/${teacherA.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: adminCookie },
    body: JSON.stringify({ action: "issue_enrollment_code" }),
  });
  assert.equal(resetPinRes.status, 200);

  const revokedARes = await fetch(`${BASE_URL}/api/teacher/approvals`, {
    headers: { Cookie: teacherACookie },
  });
  assert.equal(revokedARes.status, 403);

  // 16. Distributed login rate limit (429 after 6 failed attempts)
  let got429 = false;
  for (let i = 0; i < 8; i++) {
    const r = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-real-ip": "10.10.9.9" },
      body: JSON.stringify({ mode: "teacher", password: "WrongPassword!" }),
    });
    if (r.status === 429) {
      got429 = true;
      break;
    }
  }
  assert.equal(got429, true);

  await prisma.$disconnect();
});

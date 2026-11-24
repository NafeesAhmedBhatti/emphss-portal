import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { privateJson, verifySameOrigin } from "@/lib/http";
import { validateStudentPhotoDataUrl } from "@/lib/image-validation";
import { getAuthorizedTeacher } from "@/lib/teacher-authz";

function cleanText(val: unknown): string {
  return typeof val === "string" ? val.trim().replace(/\s+/g, " ") : "";
}

const SAFE_TEACHER_SELECT = {
  id: true,
  teacherCode: true,
  fullName: true,
  fatherName: true,
  motherName: true,
  address: true,
  mobileNumber: true,
  qualification: true,
  classesTaught: true,
  formTeacherClass: true,
  subjects: true,
  roleSummary: true,
  photoData: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return privateJson({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    if (session.role === "teacher") {
      const authz = await getAuthorizedTeacher(session);
      if (!authz || authz.teacher?.id !== id) {
        return privateJson(
          { error: "You can only update your own verified teacher profile." },
          { status: 403 }
        );
      }
    }

    const body = await request.json();

    // Admin-only action: issue a fresh 24-hour single-use enrollment code (resets PIN & revokes sessions)
    if (body.action === "issue_enrollment_code") {
      if (session.role !== "admin") {
        return privateJson({ error: "Forbidden." }, { status: 403 });
      }
      const rawCode = crypto.randomBytes(4).toString("hex").toUpperCase();
      const enrollmentCodeHash = await bcrypt.hash(rawCode, 10);
      const enrollmentCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60_000);

      const updated = await prisma.teacher.update({
        where: { id },
        data: {
          pinHash: null,
          pinVersion: { increment: 1 },
          enrollmentCodeHash,
          enrollmentCodeExpiresAt,
        },
        select: SAFE_TEACHER_SELECT,
      });

      return privateJson({
        teacher: { ...updated, hasPin: false, hasEnrollmentCode: true },
        enrollmentCode: rawCode,
      });
    }

    const fullName = cleanText(body.fullName).toUpperCase();
    const fatherName = cleanText(body.fatherName).toUpperCase();
    const motherName = cleanText(body.motherName).toUpperCase();
    const address = cleanText(body.address).toUpperCase();
    const mobileNumber = cleanText(body.mobileNumber).replace(/\D/g, "");
    const qualification = cleanText(body.qualification).toUpperCase();
    const roleSummary = cleanText(body.roleSummary);

    if (!fullName || !/^\d{10}$/.test(mobileNumber) || !qualification || !roleSummary) {
      return privateJson(
        { error: "Please fill all required teacher profile fields accurately." },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {
      fullName,
      fatherName,
      motherName,
      address,
      mobileNumber,
      qualification,
      roleSummary,
    };

    // Only Admin may assign or change classesTaught, formTeacherClass, subjects, or isActive
    if (session.role === "admin") {
      const classesTaught = cleanText(body.classesTaught);
      const formTeacherClass = cleanText(body.formTeacherClass);
      const subjects = cleanText(body.subjects).toUpperCase();
      if (!classesTaught || !subjects) {
        return privateJson(
          { error: "Classes taught and subjects are required." },
          { status: 400 }
        );
      }
      data.classesTaught = classesTaught;
      data.formTeacherClass =
        formTeacherClass && formTeacherClass !== "None"
          ? formTeacherClass
          : null;
      data.subjects = subjects;
      if (typeof body.isActive === "boolean") {
        data.isActive = body.isActive;
      }
    }

    if (typeof body.photoData === "string" && body.photoData.trim() !== "") {
      const p = body.photoData.trim();
      const photoCheck = validateStudentPhotoDataUrl(p);
      if (!photoCheck.valid) {
        return privateJson(
          { error: photoCheck.error || "Invalid or oversized photo file." },
          { status: 400 }
        );
      }
      data.photoData = p;
    }

    if (typeof body.pin === "string" && body.pin.trim() !== "") {
      const newPin = body.pin.trim();
      if (newPin.length < 4 || newPin.length > 32) {
        return privateJson(
          { error: "Teacher PIN must be between 4 and 32 characters." },
          { status: 400 }
        );
      }
      data.pinHash = await bcrypt.hash(newPin, 10);
      data.pinVersion = { increment: 1 };
      data.enrollmentCodeHash = null;
      data.enrollmentCodeExpiresAt = null;
    }

    const teacher = await prisma.teacher.update({
      where: { id },
      data,
      select: {
        ...SAFE_TEACHER_SELECT,
        pinHash: true,
      },
    });

    const { pinHash, ...rest } = teacher;
    return privateJson({
      teacher: { ...rest, hasPin: Boolean(pinHash) },
    });
  } catch (error) {
    console.error("Update teacher error:", error);
    return privateJson(
      { error: "Unable to update teacher profile." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }

  const session = await getSession();
  if (!session || session.role !== "admin") {
    return privateJson(
      { error: "Only the School Admin can delete teacher records." },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;
    await prisma.teacher.delete({ where: { id } });
    return privateJson({ success: true });
  } catch (error) {
    console.error("Delete teacher error:", error);
    return privateJson(
      { error: "Unable to delete teacher record." },
      { status: 500 }
    );
  }
}

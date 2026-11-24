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

export async function GET() {
  const session = await getSession();
  if (!session) {
    return privateJson({ error: "Unauthorized access." }, { status: 401 });
  }

  // Unbound shared-passcode sessions only see minimal profile selector (no PII)
  const authz = await getAuthorizedTeacher(session);
  if (!authz) {
    const directory = await prisma.teacher.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        teacherCode: true,
        fullName: true,
        pinHash: true,
        enrollmentCodeHash: true,
        enrollmentCodeExpiresAt: true,
      },
    });
    const now = new Date();
    return privateJson({
      teachers: directory.map((t) => ({
        id: t.id,
        teacherCode: t.teacherCode,
        fullName: t.fullName,
        hasPin: Boolean(t.pinHash),
        hasEnrollmentCode: Boolean(
          t.enrollmentCodeHash &&
            t.enrollmentCodeExpiresAt &&
            t.enrollmentCodeExpiresAt > now
        ),
      })),
    });
  }

  const teachers = await prisma.teacher.findMany({
    where: session.role === "admin" ? {} : { isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      ...SAFE_TEACHER_SELECT,
      pinHash: true,
      enrollmentCodeHash: true,
      enrollmentCodeExpiresAt: true,
    },
  });

  const now = new Date();
  const safeTeachers = teachers.map(
    ({ pinHash, enrollmentCodeHash, enrollmentCodeExpiresAt, ...rest }) => ({
      ...rest,
      hasPin: Boolean(pinHash),
      hasEnrollmentCode: Boolean(
        enrollmentCodeHash &&
          enrollmentCodeExpiresAt &&
          enrollmentCodeExpiresAt > now
      ),
    })
  );

  return privateJson({ teachers: safeTeachers });
}

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }

  const session = await getSession();
  if (!session || session.role !== "admin") {
    return privateJson(
      { error: "Only the School Admin can create teacher profiles." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const fullName = cleanText(body.fullName).toUpperCase();
    const fatherName = cleanText(body.fatherName).toUpperCase();
    const motherName = cleanText(body.motherName).toUpperCase();
    const address = cleanText(body.address).toUpperCase();
    const mobileNumber = cleanText(body.mobileNumber).replace(/\D/g, "");
    const qualification = cleanText(body.qualification).toUpperCase();
    const classesTaught = cleanText(body.classesTaught);
    const formTeacherClass = cleanText(body.formTeacherClass);
    const subjects = cleanText(body.subjects).toUpperCase();
    const roleSummary = cleanText(body.roleSummary);
    const pin = typeof body.pin === "string" ? body.pin.trim() : "";
    const photoData =
      typeof body.photoData === "string" ? body.photoData.trim() : "";

    if (!fullName || fullName.length < 2) {
      return privateJson(
        { error: "Please enter the teacher's full name." },
        { status: 400 }
      );
    }
    if (!fatherName || fatherName.length < 2) {
      return privateJson(
        { error: "Please enter the father's name." },
        { status: 400 }
      );
    }
    if (!motherName || motherName.length < 2) {
      return privateJson(
        { error: "Please enter the mother's name." },
        { status: 400 }
      );
    }
    if (!address || address.length < 2) {
      return privateJson(
        { error: "Please enter the teacher's residential address / village." },
        { status: 400 }
      );
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
      return privateJson(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }
    if (!qualification || qualification.length < 2) {
      return privateJson(
        { error: "Please enter the teacher's qualification." },
        { status: 400 }
      );
    }
    if (!classesTaught) {
      return privateJson(
        { error: "Please select at least one class taught." },
        { status: 400 }
      );
    }
    if (!subjects || subjects.length < 2) {
      return privateJson(
        { error: "Please enter the subjects taught." },
        { status: 400 }
      );
    }
    if (!roleSummary || roleSummary.length < 2) {
      return privateJson(
        { error: "Please enter a brief role or work summary." },
        { status: 400 }
      );
    }

    if (pin && (pin.length < 4 || pin.length > 32)) {
      return privateJson(
        { error: "Teacher PIN must be between 4 and 32 characters." },
        { status: 400 }
      );
    }

    if (photoData) {
      const photoCheck = validateStudentPhotoDataUrl(photoData);
      if (!photoCheck.valid) {
        return privateJson(
          { error: photoCheck.error || "Invalid or oversized photo file." },
          { status: 400 }
        );
      }
    }

    const pinHash = pin ? await bcrypt.hash(pin, 10) : null;
    // If Admin didn't set a PIN upfront, issue a 24h single-use enrollment code
    const rawEnrollmentCode = pin
      ? null
      : crypto.randomBytes(4).toString("hex").toUpperCase();
    const enrollmentCodeHash = rawEnrollmentCode
      ? await bcrypt.hash(rawEnrollmentCode, 10)
      : null;
    const enrollmentCodeExpiresAt = rawEnrollmentCode
      ? new Date(Date.now() + 24 * 60 * 60_000)
      : null;

    let teacher = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const allTeacherCodes = await prisma.teacher.findMany({
        where: { teacherCode: { startsWith: "EMPHSS-T" } },
        select: { teacherCode: true },
      });

      let maxNum = 0;
      for (const row of allTeacherCodes) {
        const match = row.teacherCode.match(/^EMPHSS-T(\d+)$/);
        if (match) {
          const parsed = Number.parseInt(match[1], 10);
          if (!Number.isNaN(parsed) && parsed > maxNum) {
            maxNum = parsed;
          }
        }
      }

      const teacherCode = `EMPHSS-T${String(maxNum + 1).padStart(2, "0")}`;

      try {
        teacher = await prisma.teacher.create({
          data: {
            teacherCode,
            fullName,
            fatherName,
            motherName,
            address,
            mobileNumber,
            qualification,
            classesTaught,
            formTeacherClass:
              formTeacherClass && formTeacherClass !== "None"
                ? formTeacherClass
                : null,
            subjects,
            roleSummary,
            photoData: photoData || null,
            pinHash,
            enrollmentCodeHash,
            enrollmentCodeExpiresAt,
            isActive: true,
          },
          select: SAFE_TEACHER_SELECT,
        });
        break;
      } catch (err: unknown) {
        const code =
          typeof err === "object" && err !== null && "code" in err
            ? (err as { code?: string }).code
            : undefined;
        if (code === "P2002" && attempt < 4) {
          continue;
        }
        throw err;
      }
    }

    if (!teacher) {
      throw new Error("Failed to allocate unique teacher code.");
    }

    return privateJson(
      {
        teacher: {
          ...teacher,
          hasPin: Boolean(pinHash),
          hasEnrollmentCode: Boolean(rawEnrollmentCode),
        },
        enrollmentCode: rawEnrollmentCode,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create teacher error:", error);
    return privateJson(
      { error: "Unable to save teacher profile. Please try again." },
      { status: 500 }
    );
  }
}

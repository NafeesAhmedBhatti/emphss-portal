import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp, resetRateLimit } from "@/lib/rate-limit";
import { signStudentToken, STUDENT_COOKIE_NAME } from "@/lib/auth";
import { privateJson, verifySameOrigin } from "@/lib/http";

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }

  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const referenceId =
      typeof body.referenceId === "string"
        ? body.referenceId.trim().toUpperCase()
        : "";
    const dateOfBirth =
      typeof body.dateOfBirth === "string" ? body.dateOfBirth.trim() : "";
    const mobileNumber =
      typeof body.mobileNumber === "string"
        ? body.mobileNumber.replace(/\D/g, "")
        : "";
    const motherName =
      typeof body.motherName === "string"
        ? body.motherName.trim().toLowerCase()
        : "";

    if (!referenceId || !dateOfBirth || !/^\d{10}$/.test(mobileNumber) || !motherName) {
      return privateJson(
        {
          error:
            "Please enter Student ID, Date of Birth, 10-digit Mobile Number, and Mother's Name.",
        },
        { status: 400 }
      );
    }

    const rateKey = `stu-lookup:${ip}:${referenceId}`;
    const rl = await checkRateLimit(rateKey, 5, 15 * 60_000);
    if (!rl.allowed) {
      return privateJson(
        {
          error: `Too many failed attempts. Locked for ${Math.ceil(
            rl.retryAfterSec / 60
          )} minute(s) for security.`,
        },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const student = await prisma.student.findUnique({
      where: { referenceId },
    });

    const matches =
      student &&
      student.dateOfBirth === dateOfBirth &&
      student.mobileNumber === mobileNumber &&
      student.motherName.trim().toLowerCase() === motherName;

    if (!matches) {
      return privateJson(
        {
          error:
            "Details did not match. Please verify your Student ID, Date of Birth, Parent Mobile Number, and Mother's Name.",
        },
        { status: 401 }
      );
    }

    await resetRateLimit(rateKey);

    const token = await signStudentToken({
      studentId: student.id,
      referenceId: student.referenceId,
    });

    const safeStudent =
      student.status === "Pending" ? { ...student, photoData: null } : student;

    const response = privateJson({ student: safeStudent });
    response.cookies.set(STUDENT_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    console.error("Student lookup error:", error);
    return privateJson(
      { error: "Unable to load student profile right now. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }

  const response = privateJson({ success: true });
  response.cookies.set(STUDENT_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return response;
}

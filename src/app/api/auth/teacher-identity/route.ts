import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  getSession,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth";
import { privateJson, verifySameOrigin } from "@/lib/http";
import { checkRateLimit, getClientIp, resetRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return privateJson({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const ip = getClientIp(request);
    const body = await request.json();
    const teacherId =
      typeof body.teacherId === "string" ? body.teacherId.trim() : "";
    const pin = typeof body.pin === "string" ? body.pin.trim() : "";
    const newPin = typeof body.newPin === "string" ? body.newPin.trim() : "";
    const enrollmentCode =
      typeof body.enrollmentCode === "string"
        ? body.enrollmentCode.trim().toUpperCase()
        : "";

    if (!teacherId) {
      return privateJson(
        { error: "Teacher ID is required." },
        { status: 400 }
      );
    }

    const rateKey = `t-pin:${ip}:${teacherId}`;
    const rl = await checkRateLimit(rateKey, 6, 15 * 60_000);
    if (!rl.allowed) {
      return privateJson(
        {
          error: `Too many PIN attempts. Please wait ${Math.ceil(
            rl.retryAfterSec / 60
          )} minute(s).`,
        },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
      );
    }

    const teacher = await prisma.teacher.findFirst({
      where: { id: teacherId, isActive: true },
      select: {
        id: true,
        teacherCode: true,
        pinHash: true,
        pinVersion: true,
        enrollmentCodeHash: true,
        enrollmentCodeExpiresAt: true,
      },
    });

    if (!teacher) {
      return privateJson(
        { error: "Active teacher profile not found." },
        { status: 404 }
      );
    }

    let finalPinVersion = teacher.pinVersion;

    if (session.role !== "admin") {
      if (teacher.pinHash) {
        if (!pin) {
          return privateJson(
            {
              error: "Please enter your personal Teacher PIN to switch to this profile.",
              requiresPin: true,
            },
            { status: 401 }
          );
        }
        const validPin = await bcrypt.compare(pin, teacher.pinHash);
        if (!validPin) {
          return privateJson(
            { error: "Incorrect Teacher PIN. Please try again." },
            { status: 401 }
          );
        }
      } else {
        // Legacy or newly provisioned profile without PIN:
        // Require a valid Admin-issued, single-use, non-expired enrollment code!
        const now = new Date();
        if (
          !teacher.enrollmentCodeHash ||
          !teacher.enrollmentCodeExpiresAt ||
          teacher.enrollmentCodeExpiresAt <= now
        ) {
          return privateJson(
            {
              error:
                "This profile has not been enrolled yet. Please ask the School Admin for a single-use Enrollment Code.",
              requiresAdminEnrollment: true,
            },
            { status: 403 }
          );
        }

        if (!enrollmentCode || newPin.length < 4 || newPin.length > 32) {
          return privateJson(
            {
              error:
                "Enter the Admin-issued Enrollment Code and choose a 4–32 character personal PIN.",
              requiresEnrollmentCode: true,
            },
            { status: 400 }
          );
        }

        const validEnroll = await bcrypt.compare(
          enrollmentCode,
          teacher.enrollmentCodeHash
        );
        if (!validEnroll) {
          return privateJson(
            { error: "Invalid Enrollment Code. Please check with the School Admin." },
            { status: 401 }
          );
        }

        const hashedPin = await bcrypt.hash(newPin, 10);
        const claimed = await prisma.teacher.updateMany({
          where: {
            id: teacher.id,
            pinHash: null,
            enrollmentCodeHash: teacher.enrollmentCodeHash,
          },
          data: {
            pinHash: hashedPin,
            enrollmentCodeHash: null,
            enrollmentCodeExpiresAt: null,
            pinVersion: { increment: 1 },
          },
        });

        if (claimed.count === 0) {
          return privateJson(
            { error: "This profile has already been enrolled. Please enter your PIN." },
            { status: 409 }
          );
        }
        finalPinVersion = teacher.pinVersion + 1;
      }
    }

    await resetRateLimit(rateKey);

    const token = await signSessionToken({
      role: session.role,
      email: session.email,
      v: session.v,
      teacherId: teacher.id,
      tv: finalPinVersion,
    });

    const response = privateJson({
      success: true,
      teacherId: teacher.id,
      teacherCode: teacher.teacherCode,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: session.role === "admin" ? 60 * 60 * 24 * 7 : 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error) {
    console.error("Teacher identity bind error:", error);
    return privateJson(
      { error: "Unable to verify teacher profile." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getSession,
  SESSION_COOKIE_NAME,
  signSessionToken,
} from "@/lib/auth";

function cleanText(val: unknown): string {
  return typeof val === "string" ? val.trim().replace(/\s+/g, " ") : "";
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  const teachers = await prisma.teacher.findMany({
    where: session.role === "admin" ? {} : { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ teachers });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
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
    const photoData =
      typeof body.photoData === "string" ? body.photoData.trim() : "";

    if (!fullName || fullName.length < 2) {
      return NextResponse.json(
        { error: "Please enter the teacher's full name." },
        { status: 400 }
      );
    }
    if (!fatherName || fatherName.length < 2) {
      return NextResponse.json(
        { error: "Please enter the father's name." },
        { status: 400 }
      );
    }
    if (!motherName || motherName.length < 2) {
      return NextResponse.json(
        { error: "Please enter the mother's name." },
        { status: 400 }
      );
    }
    if (!address || address.length < 2) {
      return NextResponse.json(
        { error: "Please enter the teacher's residential address / village." },
        { status: 400 }
      );
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }
    if (!qualification || qualification.length < 2) {
      return NextResponse.json(
        { error: "Please enter the teacher's qualification." },
        { status: 400 }
      );
    }
    if (!classesTaught) {
      return NextResponse.json(
        { error: "Please select at least one class taught." },
        { status: 400 }
      );
    }
    if (!subjects || subjects.length < 2) {
      return NextResponse.json(
        { error: "Please enter the subjects taught." },
        { status: 400 }
      );
    }
    if (!roleSummary || roleSummary.length < 2) {
      return NextResponse.json(
        { error: "Please enter a brief role or work summary." },
        { status: 400 }
      );
    }
    const isSafeRasterImage =
      photoData.startsWith("data:image/jpeg;base64,") ||
      photoData.startsWith("data:image/png;base64,") ||
      photoData.startsWith("data:image/webp;base64,");
    if (photoData && (!isSafeRasterImage || photoData.length > 700_000)) {
      return NextResponse.json(
        { error: "Invalid or oversized photo file. Use JPG, PNG, or WebP." },
        { status: 400 }
      );
    }

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
            isActive: true,
          },
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

    const response = NextResponse.json({ teacher }, { status: 201 });
    if (session.role === "teacher") {
      const token = await signSessionToken({
        role: session.role,
        email: session.email,
        v: session.v,
        teacherId: teacher.id,
      });
      response.cookies.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  } catch (error) {
    console.error("Create teacher error:", error);
    return NextResponse.json(
      { error: "Unable to save teacher profile. Please try again." },
      { status: 500 }
    );
  }
}

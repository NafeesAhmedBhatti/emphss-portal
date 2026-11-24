import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CLASS_ORDER, GENDER_OPTIONS } from "@/lib/constants";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { signStudentToken, STUDENT_COOKIE_NAME } from "@/lib/auth";

function cleanText(val: unknown): string {
  return typeof val === "string" ? val.trim().replace(/\s+/g, " ") : "";
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rl = await checkRateLimit(`reg:${ip}`, 4, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        {
          error: `Too many submissions. Please wait ${rl.retryAfterSec} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const settings = await prisma.schoolSettings.findUnique({
      where: { id: "main" },
    });
    if (settings && !settings.registrationOpen) {
      return NextResponse.json(
        {
          error:
            "Online student registration is currently closed by the school administration. Please contact the school office.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const studentName = cleanText(body.studentName).toUpperCase();
    const fatherName = cleanText(body.fatherName).toUpperCase();
    const motherName = cleanText(body.motherName).toUpperCase();
    const gender = cleanText(body.gender);
    const dateOfBirth = cleanText(body.dateOfBirth);
    const mobileNumber = cleanText(body.mobileNumber).replace(/\D/g, "");
    const currentClass = cleanText(body.currentClass);
    const address = cleanText(body.address).toUpperCase();
    const transportMode = cleanText(body.transportMode);
    const vehicleRoute = cleanText(body.vehicleRoute).toUpperCase();
    const subjects = cleanText(body.subjects);
    const photoData =
      typeof body.photoData === "string" ? body.photoData.trim() : "";

    if (!studentName || studentName.length < 2) {
      return NextResponse.json(
        { error: "Please enter the student's full name." },
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
    if (!GENDER_OPTIONS.includes(gender as (typeof GENDER_OPTIONS)[number])) {
      return NextResponse.json(
        { error: "Please select a valid gender." },
        { status: 400 }
      );
    }
    if (!dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      return NextResponse.json(
        { error: "Please enter a valid date of birth." },
        { status: 400 }
      );
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }
    if (!CLASS_ORDER.includes(currentClass as (typeof CLASS_ORDER)[number])) {
      return NextResponse.json(
        { error: "Please select a valid class." },
        { status: 400 }
      );
    }
    if (!address || address.length < 2) {
      return NextResponse.json(
        { error: "Please enter the student's village or residential address." },
        { status: 400 }
      );
    }
    if (transportMode !== "Local" && transportMode !== "School Transport") {
      return NextResponse.json(
        { error: "Please select a mode of transport (Local or School Transport)." },
        { status: 400 }
      );
    }
    if (transportMode === "School Transport" && vehicleRoute.length < 2) {
      return NextResponse.json(
        { error: "Please enter the school bus/van route or stop name." },
        { status: 400 }
      );
    }
    const isSafeRasterImage =
      photoData.startsWith("data:image/jpeg;base64,") ||
      photoData.startsWith("data:image/png;base64,") ||
      photoData.startsWith("data:image/webp;base64,");
    if (!photoData || !isSafeRasterImage) {
      return NextResponse.json(
        { error: "Please upload a valid JPG, PNG, or WebP student photo." },
        { status: 400 }
      );
    }
    if (photoData.length > 700_000) {
      return NextResponse.json(
        { error: "Photo file is too large. Please choose a smaller image." },
        { status: 400 }
      );
    }

    // Check duplicate (same name case-insensitive + DOB + mobile)
    const possibleMatches = await prisma.student.findMany({
      where: {
        dateOfBirth,
        mobileNumber,
      },
      select: {
        id: true,
        referenceId: true,
        studentName: true,
      },
    });

    const duplicate = possibleMatches.find(
      (s) => s.studentName.toLowerCase() === studentName.toLowerCase()
    );

    if (duplicate) {
      return NextResponse.json(
        {
          error:
            "This student is already registered. Please use Student Login or contact the school office if any correction is needed.",
        },
        { status: 409 }
      );
    }

    // Sibling cap: max 5 students per parent mobile number
    const sameMobileCount = await prisma.student.count({
      where: { mobileNumber },
    });
    if (sameMobileCount >= 5) {
      return NextResponse.json(
        {
          error:
            "Maximum registration limit (5 students) reached for this mobile number. Please contact the school office.",
        },
        { status: 400 }
      );
    }

    const academicYear = settings?.currentSession ?? "2026-27";

    // Generate sequential referenceId with retry on concurrent P2002 collision
    let created = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const allIds = await prisma.student.findMany({
        where: { referenceId: { startsWith: "EMPHSS-" } },
        select: { referenceId: true },
      });

      let maxNumber = 0;
      for (const row of allIds) {
        const match = row.referenceId.match(/^EMPHSS-(\d+)$/);
        if (match) {
          const num = Number.parseInt(match[1], 10);
          if (!Number.isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        }
      }

      const referenceId = `EMPHSS-${String(maxNumber + 1).padStart(3, "0")}`;

      try {
        created = await prisma.student.create({
          data: {
            referenceId,
            studentName,
            fatherName,
            motherName,
            gender,
            dateOfBirth,
            mobileNumber,
            currentClass,
            academicYear,
            address,
            transportMode,
            vehicleRoute:
              transportMode === "School Transport" ? vehicleRoute : null,
            subjects,
            photoData,
            status: "Pending",
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

    if (!created) {
      throw new Error("Failed to allocate unique student reference ID.");
    }

    const token = await signStudentToken({
      studentId: created.id,
      referenceId: created.referenceId,
    });

    const response = NextResponse.json({ student: created }, { status: 201 });
    response.cookies.set(STUDENT_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    console.error("Student registration error:", error);
    return NextResponse.json(
      { error: "Unable to submit registration right now. Please try again." },
      { status: 500 }
    );
  }
}

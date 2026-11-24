import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStudentSession } from "@/lib/auth";

const ALLOWED_FIELDS = new Set([
  "studentName",
  "fatherName",
  "motherName",
  "dateOfBirth",
  "mobileNumber",
  "address",
  "Other",
]);

export async function GET() {
  const stuSession = await getStudentSession();
  if (!stuSession) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const requests = await prisma.correctionRequest.findMany({
    where: { studentId: stuSession.studentId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ requests });
}

export async function POST(request: Request) {
  const stuSession = await getStudentSession();
  if (!stuSession) {
    return NextResponse.json(
      { error: "Please open your Student ID profile first." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const fieldToCorrect =
      typeof body.fieldToCorrect === "string" ? body.fieldToCorrect.trim() : "";
    const requestedValue =
      typeof body.requestedValue === "string" ? body.requestedValue.trim() : "";
    const reason =
      typeof body.reason === "string" ? body.reason.trim() : "";

    if (
      !ALLOWED_FIELDS.has(fieldToCorrect) ||
      requestedValue.length < 2 ||
      requestedValue.length > 250 ||
      reason.length > 500
    ) {
      return NextResponse.json(
        {
          error:
            "Please select a valid field and enter a concise correction value (max 250 chars).",
        },
        { status: 400 }
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: stuSession.studentId },
      select: { id: true, referenceId: true, studentName: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student record not found." },
        { status: 404 }
      );
    }

    const created = await prisma.correctionRequest.create({
      data: {
        studentId: student.id,
        referenceId: student.referenceId,
        studentName: student.studentName,
        fieldToCorrect,
        requestedValue,
        reason,
        status: "Pending",
      },
    });

    return NextResponse.json({ request: created }, { status: 201 });
  } catch (error) {
    console.error("Create correction request error:", error);
    return NextResponse.json(
      { error: "Unable to submit correction request." },
      { status: 500 }
    );
  }
}

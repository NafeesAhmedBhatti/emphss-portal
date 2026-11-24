import { prisma } from "@/lib/prisma";
import { getStudentSession } from "@/lib/auth";
import { privateJson, verifySameOrigin } from "@/lib/http";

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
    return privateJson({ error: "Unauthorized." }, { status: 401 });
  }

  const requests = await prisma.correctionRequest.findMany({
    where: { studentId: stuSession.studentId },
    orderBy: { createdAt: "desc" },
  });

  return privateJson({ requests });
}

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }

  const stuSession = await getStudentSession();
  if (!stuSession) {
    return privateJson(
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
      return privateJson(
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
      return privateJson(
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

    return privateJson({ request: created }, { status: 201 });
  } catch (error) {
    console.error("Create correction request error:", error);
    return privateJson(
      { error: "Unable to submit correction request." },
      { status: 500 }
    );
  }
}

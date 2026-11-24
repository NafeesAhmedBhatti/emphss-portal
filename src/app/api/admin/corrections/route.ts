import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { privateJson, verifySameOrigin } from "@/lib/http";

const AUTO_UPDATABLE_FIELDS = new Set([
  "studentName",
  "fatherName",
  "motherName",
  "dateOfBirth",
  "mobileNumber",
  "address",
]);

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return privateJson({ error: "Forbidden." }, { status: 403 });
  }

  const requests = await prisma.correctionRequest.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return privateJson({ requests });
}

export async function PATCH(request: Request) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }

  const session = await getSession();
  if (!session || session.role !== "admin") {
    return privateJson({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const id = typeof body.id === "string" ? body.id.trim() : "";
    if (body.action !== "Approve" && body.action !== "Reject") {
      return privateJson(
        { error: "Invalid action. Expected Approve or Reject." },
        { status: 400 }
      );
    }
    const action = body.action === "Approve" ? "Approved" : "Rejected";

    const existing = await prisma.correctionRequest.findUnique({
      where: { id },
    });
    if (!existing) {
      return privateJson(
        { error: "Correction request not found." },
        { status: 404 }
      );
    }
    if (existing.status !== "Pending") {
      return privateJson(
        { error: "This correction request has already been processed." },
        { status: 409 }
      );
    }

    let validatedValue = existing.requestedValue.trim().replace(/\s+/g, " ");
    if (
      action === "Approved" &&
      AUTO_UPDATABLE_FIELDS.has(existing.fieldToCorrect)
    ) {
      if (existing.fieldToCorrect === "dateOfBirth") {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(validatedValue)) {
          return privateJson(
            { error: "Invalid date of birth format (expected YYYY-MM-DD)." },
            { status: 400 }
          );
        }
      } else if (existing.fieldToCorrect === "mobileNumber") {
        validatedValue = validatedValue.replace(/\D/g, "");
        if (!/^\d{10}$/.test(validatedValue)) {
          return privateJson(
            { error: "Invalid 10-digit mobile number in correction request." },
            { status: 400 }
          );
        }
      } else {
        if (validatedValue.length < 2 || validatedValue.length > 250) {
          return privateJson(
            { error: "Correction value must be between 2 and 250 characters." },
            { status: 400 }
          );
        }
        validatedValue = validatedValue.toUpperCase();
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (
        action === "Approved" &&
        AUTO_UPDATABLE_FIELDS.has(existing.fieldToCorrect)
      ) {
        await tx.student.update({
          where: { id: existing.studentId },
          data: {
            [existing.fieldToCorrect]: validatedValue,
          },
        });
      }

      return tx.correctionRequest.update({
        where: { id },
        data: { status: action },
      });
    });

    return privateJson({ request: updated });
  } catch (error) {
    console.error("Update correction request error:", error);
    return privateJson(
      { error: "Unable to process correction request." },
      { status: 500 }
    );
  }
}

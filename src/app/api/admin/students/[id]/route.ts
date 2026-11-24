import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CLASS_ORDER, GENDER_OPTIONS, PASSED_OUT_STATUS } from "@/lib/constants";
import { privateJson, verifySameOrigin } from "@/lib/http";

function cleanText(val: unknown): string {
  return typeof val === "string" ? val.trim().replace(/\s+/g, " ") : "";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return privateJson({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
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

    if (!studentName || !fatherName || !motherName || !address) {
      return privateJson(
        { error: "All name and address fields are required." },
        { status: 400 }
      );
    }
    if (!GENDER_OPTIONS.includes(gender as (typeof GENDER_OPTIONS)[number])) {
      return privateJson({ error: "Invalid gender." }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      return privateJson(
        { error: "Invalid date of birth." },
        { status: 400 }
      );
    }
    if (!/^\d{10}$/.test(mobileNumber)) {
      return privateJson(
        { error: "Mobile number must be 10 digits." },
        { status: 400 }
      );
    }
    const validClasses = [...CLASS_ORDER, PASSED_OUT_STATUS];
    if (!validClasses.includes(currentClass)) {
      return privateJson({ error: "Invalid class." }, { status: 400 });
    }
    if (transportMode !== "Local" && transportMode !== "School Transport") {
      return privateJson(
        { error: "Invalid transport mode." },
        { status: 400 }
      );
    }
    if (transportMode === "School Transport" && vehicleRoute.length < 2) {
      return privateJson(
        { error: "Please enter the school transport route/stop." },
        { status: 400 }
      );
    }

    const updated = await prisma.student.update({
      where: { id },
      data: {
        studentName,
        fatherName,
        motherName,
        gender,
        dateOfBirth,
        mobileNumber,
        currentClass,
        address,
        transportMode,
        vehicleRoute:
          transportMode === "School Transport" ? vehicleRoute : null,
        status: currentClass === PASSED_OUT_STATUS ? "Passed Out" : "Active",
      },
    });

    return privateJson({ student: updated });
  } catch (error) {
    console.error("Admin student update error:", error);
    return privateJson(
      { error: "Unable to update student record." },
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
    return privateJson({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    await prisma.student.delete({ where: { id } });
    return privateJson({ success: true });
  } catch (error) {
    console.error("Admin student delete error:", error);
    return privateJson(
      { error: "Unable to delete student record." },
      { status: 500 }
    );
  }
}

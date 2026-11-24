import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function cleanText(val: unknown): string {
  return typeof val === "string" ? val.trim().replace(/\s+/g, " ") : "";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    if (session.role === "teacher" && session.teacherId !== id) {
      return NextResponse.json(
        { error: "You can only update your own teacher profile." },
        { status: 403 }
      );
    }
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

    if (!fullName || !/^\d{10}$/.test(mobileNumber) || !qualification || !classesTaught || !subjects || !roleSummary) {
      return NextResponse.json(
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
      classesTaught,
      formTeacherClass: formTeacherClass && formTeacherClass !== "None" ? formTeacherClass : null,
      subjects,
      roleSummary,
    };

    if (typeof body.photoData === "string" && body.photoData.trim() !== "") {
      const p = body.photoData.trim();
      const isSafeRasterImage =
        p.startsWith("data:image/jpeg;base64,") ||
        p.startsWith("data:image/png;base64,") ||
        p.startsWith("data:image/webp;base64,");
      if (!isSafeRasterImage || p.length > 700_000) {
        return NextResponse.json(
          { error: "Invalid or oversized photo file." },
          { status: 400 }
        );
      }
      data.photoData = p;
    }

    if (session.role === "admin" && typeof body.isActive === "boolean") {
      data.isActive = body.isActive;
    }

    const teacher = await prisma.teacher.update({
      where: { id },
      data,
    });

    return NextResponse.json({ teacher });
  } catch (error) {
    console.error("Update teacher error:", error);
    return NextResponse.json(
      { error: "Unable to update teacher profile." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json(
      { error: "Only the School Admin can delete teacher records." },
      { status: 403 }
    );
  }

  try {
    const { id } = await context.params;
    await prisma.teacher.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete teacher error:", error);
    return NextResponse.json(
      { error: "Unable to delete teacher record." },
      { status: 500 }
    );
  }
}

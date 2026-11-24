import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CLASS_ORDER } from "@/lib/constants";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const className = (searchParams.get("className") || "").trim();

  const where: Record<string, string> = { status: "Pending" };
  if (className) {
    where.currentClass = className;
  }

  const pendingStudents = await prisma.student.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      referenceId: true,
      studentName: true,
      fatherName: true,
      motherName: true,
      gender: true,
      dateOfBirth: true,
      mobileNumber: true,
      currentClass: true,
      address: true,
      transportMode: true,
      vehicleRoute: true,
      photoData: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ students: pendingStudents });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const action = body.action as string;
    const studentId = typeof body.studentId === "string" ? body.studentId : "";
    const className = typeof body.className === "string" ? body.className : "";

    if (action === "approve" && studentId) {
      const result = await prisma.student.updateMany({
        where: { id: studentId, status: "Pending" },
        data: { status: "Active" },
      });
      if (result.count === 0) {
        return NextResponse.json(
          { error: "Pending student not found or already processed." },
          { status: 404 }
        );
      }
      const updated = await prisma.student.findUnique({
        where: { id: studentId },
      });
      return NextResponse.json({ success: true, student: updated });
    }

    if (action === "approve_all" && className) {
      if (!CLASS_ORDER.includes(className as (typeof CLASS_ORDER)[number])) {
        return NextResponse.json(
          { error: "Invalid class name." },
          { status: 400 }
        );
      }
      const result = await prisma.student.updateMany({
        where: { currentClass: className, status: "Pending" },
        data: { status: "Active" },
      });
      return NextResponse.json({ success: true, count: result.count });
    }

    if (action === "reject" && studentId) {
      const result = await prisma.student.deleteMany({
        where: { id: studentId, status: "Pending" },
      });
      if (result.count === 0) {
        return NextResponse.json(
          { error: "Only pending registrations can be rejected." },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Approval action error:", error);
    return NextResponse.json(
      { error: "Unable to process approval action." },
      { status: 500 }
    );
  }
}

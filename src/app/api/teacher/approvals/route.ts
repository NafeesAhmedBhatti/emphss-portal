import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CLASS_ORDER } from "@/lib/constants";
import { privateJson, verifySameOrigin } from "@/lib/http";
import { canApproveClass, getAuthorizedTeacher } from "@/lib/teacher-authz";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return privateJson({ error: "Unauthorized." }, { status: 401 });
  }

  const authz = await getAuthorizedTeacher(session);
  if (!authz) {
    return privateJson(
      { error: "Please verify your Teacher Profile PIN first." },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const requestedClass = (searchParams.get("className") || "").trim();

  if (!authz.isAdmin) {
    const formClass = authz.teacher?.formTeacherClass;
    if (!formClass) {
      return privateJson({ students: [] });
    }
    if (requestedClass && requestedClass !== formClass) {
      return privateJson(
        { error: "You can only view pending approvals for your own Form Teacher class." },
        { status: 403 }
      );
    }
  }

  const where: Record<string, string> = { status: "Pending" };
  if (!authz.isAdmin && authz.teacher?.formTeacherClass) {
    where.currentClass = authz.teacher.formTeacherClass;
  } else if (requestedClass) {
    where.currentClass = requestedClass;
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

  return privateJson({ students: pendingStudents });
}

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }

  const session = await getSession();
  if (!session) {
    return privateJson({ error: "Unauthorized." }, { status: 401 });
  }

  const authz = await getAuthorizedTeacher(session);
  if (!authz) {
    return privateJson(
      { error: "Please verify your Teacher Profile PIN first." },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const action = body.action as string;
    const studentId = typeof body.studentId === "string" ? body.studentId : "";
    const className = typeof body.className === "string" ? body.className : "";

    if (action === "approve" && studentId) {
      const target = await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, currentClass: true, status: true },
      });
      if (!target || target.status !== "Pending") {
        return privateJson(
          { error: "Pending student not found or already processed." },
          { status: 404 }
        );
      }
      if (!canApproveClass(authz, target.currentClass)) {
        return privateJson(
          { error: "Only the assigned Form Teacher or Admin can approve this class." },
          { status: 403 }
        );
      }

      const result = await prisma.student.updateMany({
        where: { id: studentId, status: "Pending" },
        data: { status: "Active" },
      });
      if (result.count === 0) {
        return privateJson(
          { error: "Pending student not found or already processed." },
          { status: 404 }
        );
      }
      const updated = await prisma.student.findUnique({
        where: { id: studentId },
      });
      return privateJson({ success: true, student: updated });
    }

    if (action === "approve_all" && className) {
      if (!CLASS_ORDER.includes(className as (typeof CLASS_ORDER)[number])) {
        return privateJson(
          { error: "Invalid class name." },
          { status: 400 }
        );
      }
      if (!canApproveClass(authz, className)) {
        return privateJson(
          { error: "Only the assigned Form Teacher or Admin can approve this class." },
          { status: 403 }
        );
      }
      const result = await prisma.student.updateMany({
        where: { currentClass: className, status: "Pending" },
        data: { status: "Active" },
      });
      return privateJson({ success: true, count: result.count });
    }

    if (action === "reject" && studentId) {
      const target = await prisma.student.findUnique({
        where: { id: studentId },
        select: { id: true, currentClass: true, status: true },
      });
      if (!target || target.status !== "Pending") {
        return privateJson(
          { error: "Only pending registrations can be rejected." },
          { status: 404 }
        );
      }
      if (!canApproveClass(authz, target.currentClass)) {
        return privateJson(
          { error: "Only the assigned Form Teacher or Admin can reject this class." },
          { status: 403 }
        );
      }

      const result = await prisma.student.deleteMany({
        where: { id: studentId, status: "Pending" },
      });
      if (result.count === 0) {
        return privateJson(
          { error: "Only pending registrations can be rejected." },
          { status: 404 }
        );
      }
      return privateJson({ success: true });
    }

    return privateJson({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("Approval action error:", error);
    return privateJson(
      { error: "Unable to process approval action." },
      { status: 500 }
    );
  }
}

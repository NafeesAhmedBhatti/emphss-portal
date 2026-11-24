import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TeacherPortalClient } from "@/components/TeacherPortalClient";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login?tab=teacher");
  }

  const [teachers, activeStudents, pendingStudents] = await Promise.all([
    prisma.teacher.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.student.findMany({
      where: { status: "Active" },
      orderBy: [{ currentClass: "asc" }, { studentName: "asc" }],
      select: {
        id: true,
        referenceId: true,
        studentName: true,
        fatherName: true,
        motherName: true,
        currentClass: true,
        gender: true,
        mobileNumber: true,
        address: true,
        transportMode: true,
        vehicleRoute: true,
        photoData: true,
      },
    }),
    prisma.student.findMany({
      where: { status: "Pending" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        referenceId: true,
        studentName: true,
        fatherName: true,
        motherName: true,
        currentClass: true,
        gender: true,
        dateOfBirth: true,
        mobileNumber: true,
        address: true,
        transportMode: true,
        vehicleRoute: true,
        photoData: true,
      },
    }),
  ]);

  const serializedTeachers = teachers.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <TeacherPortalClient
      initialTeachers={serializedTeachers}
      students={activeStudents}
      initialPendingStudents={pendingStudents}
      role={session.role}
    />
  );
}

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

  const now = new Date();
  const teachers = await prisma.teacher.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const verifiedTeacher =
    session.role === "teacher" && session.teacherId
      ? teachers.find(
          (t) => t.id === session.teacherId && t.pinVersion === session.tv
        ) ?? null
      : null;

  const isAuthorizedForData =
    session.role === "admin" || Boolean(verifiedTeacher);

  const pendingWhere =
    session.role === "admin"
      ? { status: "Pending" }
      : verifiedTeacher?.formTeacherClass
      ? { status: "Pending", currentClass: verifiedTeacher.formTeacherClass }
      : null;

  const [activeStudents, pendingStudents] = isAuthorizedForData
    ? await Promise.all([
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
        pendingWhere
          ? prisma.student.findMany({
              where: pendingWhere,
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
              },
            })
          : Promise.resolve([]),
      ])
    : [[], []];

  // Never expose teacher PII (mobile/address/parents/photo) to an unbound shared-passcode session
  const serializedTeachers = teachers.map(
    ({ pinHash, enrollmentCodeHash, enrollmentCodeExpiresAt, ...t }) => {
      const hasPin = Boolean(pinHash);
      const hasEnrollmentCode = Boolean(
        enrollmentCodeHash &&
          enrollmentCodeExpiresAt &&
          enrollmentCodeExpiresAt > now
      );
      if (!isAuthorizedForData) {
        return {
          ...t,
          fatherName: "",
          motherName: "",
          address: "",
          mobileNumber: "",
          photoData: null,
          hasPin,
          hasEnrollmentCode,
          createdAt: t.createdAt.toISOString(),
        };
      }
      return {
        ...t,
        hasPin,
        hasEnrollmentCode,
        createdAt: t.createdAt.toISOString(),
      };
    }
  );

  return (
    <TeacherPortalClient
      initialTeachers={serializedTeachers}
      students={activeStudents}
      initialPendingStudents={pendingStudents}
      role={session.role}
      initialVerifiedTeacherId={verifiedTeacher?.id ?? ""}
    />
  );
}

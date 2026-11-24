import { prisma } from "@/lib/prisma";
import type { SessionPayload } from "@/lib/auth";

export interface AuthorizedTeacherContext {
  isAdmin: boolean;
  teacher: {
    id: string;
    teacherCode: string;
    fullName: string;
    classesTaught: string;
    formTeacherClass: string | null;
    subjects: string;
    pinVersion: number;
    isActive: boolean;
  } | null;
}

export function parseClassList(classesTaught: string): string[] {
  return classesTaught
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);
}

export function parseSubjectList(subjects: string): string[] {
  return subjects
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function getAuthorizedTeacher(
  session: SessionPayload
): Promise<AuthorizedTeacherContext | null> {
  if (session.role === "admin") {
    return { isAdmin: true, teacher: null };
  }

  if (!session.teacherId) {
    return null;
  }

  const teacher = await prisma.teacher.findFirst({
    where: { id: session.teacherId, isActive: true },
    select: {
      id: true,
      teacherCode: true,
      fullName: true,
      classesTaught: true,
      formTeacherClass: true,
      subjects: true,
      pinVersion: true,
      isActive: true,
    },
  });

  if (!teacher) {
    return null;
  }

  // Revoke session immediately if teacher's PIN was reset/rotated
  if (session.tv !== teacher.pinVersion) {
    return null;
  }

  return { isAdmin: false, teacher };
}

export function canAccessClass(
  authz: AuthorizedTeacherContext,
  className: string
): boolean {
  if (authz.isAdmin) return true;
  if (!authz.teacher) return false;
  if (authz.teacher.formTeacherClass === className) return true;
  return parseClassList(authz.teacher.classesTaught).includes(className);
}

export function canApproveClass(
  authz: AuthorizedTeacherContext,
  className: string
): boolean {
  if (authz.isAdmin) return true;
  if (!authz.teacher) return false;
  return authz.teacher.formTeacherClass === className;
}

export function canEditSubject(
  authz: AuthorizedTeacherContext,
  className: string,
  subject: string
): boolean {
  if (authz.isAdmin) return true;
  if (!authz.teacher) return false;
  if (authz.teacher.formTeacherClass === className) return true;
  const assigned = parseSubjectList(authz.teacher.subjects);
  const norm = subject.trim().toLowerCase();
  return assigned.some((s) => norm === s || norm.includes(s) || s.includes(norm));
}

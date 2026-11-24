import { prisma } from "@/lib/prisma";
import { getStudentSession } from "@/lib/auth";
import { privateJson } from "@/lib/http";

export async function GET() {
  const stuSession = await getStudentSession();
  if (!stuSession) {
    return privateJson({ student: null, corrections: [] });
  }

  const [student, corrections] = await Promise.all([
    prisma.student.findUnique({
      where: { id: stuSession.studentId },
    }),
    prisma.correctionRequest.findMany({
      where: { studentId: stuSession.studentId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!student) {
    return privateJson({ student: null, corrections: [] });
  }

  // Only Active / Passed Out students may receive official ID card photo data
  const safeStudent =
    student.status === "Pending" ? { ...student, photoData: null } : student;

  return privateJson({ student: safeStudent, corrections });
}

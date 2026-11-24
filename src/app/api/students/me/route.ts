import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStudentSession } from "@/lib/auth";

export async function GET() {
  const stuSession = await getStudentSession();
  if (!stuSession) {
    return NextResponse.json({ student: null, corrections: [] });
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
    return NextResponse.json({ student: null, corrections: [] });
  }

  return NextResponse.json({ student, corrections });
}

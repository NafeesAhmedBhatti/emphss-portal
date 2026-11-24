import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getNextClass, PASSED_OUT_STATUS } from "@/lib/constants";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const toSession =
      typeof body.toSession === "string" ? body.toSession.trim() : "";
    const heldBackIds = Array.isArray(body.heldBackStudentIds)
      ? (body.heldBackStudentIds.filter(
          (id: unknown) => typeof id === "string"
        ) as string[])
      : [];

    if (!toSession || toSession.length < 4) {
      return NextResponse.json(
        { error: "Please enter a valid target academic session (e.g., 2027-28)." },
        { status: 400 }
      );
    }

    const heldBackSet = new Set(heldBackIds);

    const settings = await prisma.schoolSettings.findUnique({
      where: { id: "main" },
    });
    const fromSession = settings?.currentSession ?? "2026-27";

    if (fromSession === toSession) {
      return NextResponse.json(
        { error: "New session must be different from the current session." },
        { status: 400 }
      );
    }

    const activeStudents = await prisma.student.findMany({
      where: { status: "Active" },
      select: { id: true, currentClass: true },
    });

    if (activeStudents.length === 0) {
      return NextResponse.json(
        { error: "There are no active students to promote." },
        { status: 400 }
      );
    }

    let promotedCount = 0;
    let heldBackCount = 0;
    let passedOutCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const s of activeStudents) {
        if (heldBackSet.has(s.id)) {
          heldBackCount += 1;
          await tx.student.update({
            where: { id: s.id },
            data: { academicYear: toSession },
          });
          continue;
        }

        const nextClass = getNextClass(s.currentClass);
        if (nextClass === PASSED_OUT_STATUS) {
          passedOutCount += 1;
          await tx.student.update({
            where: { id: s.id },
            data: {
              currentClass: PASSED_OUT_STATUS,
              status: "Passed Out",
              academicYear: toSession,
            },
          });
        } else {
          promotedCount += 1;
          await tx.student.update({
            where: { id: s.id },
            data: {
              currentClass: nextClass,
              academicYear: toSession,
            },
          });
        }
      }

      await tx.schoolSettings.update({
        where: { id: "main" },
        data: { currentSession: toSession },
      });

      await tx.promotionLog.create({
        data: {
          fromSession,
          toSession,
          promotedCount,
          heldBackCount,
          passedOutCount,
        },
      });
    });

    return NextResponse.json({
      success: true,
      summary: {
        fromSession,
        toSession,
        promotedCount,
        heldBackCount,
        passedOutCount,
      },
    });
  } catch (error) {
    console.error("Class promotion error:", error);
    return NextResponse.json(
      { error: "Unable to complete class promotion. Please try again." },
      { status: 500 }
    );
  }
}

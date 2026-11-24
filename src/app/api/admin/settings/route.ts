import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (typeof body.registrationOpen === "boolean") {
      data.registrationOpen = body.registrationOpen;
    }

    if (typeof body.teacherPasscode === "string") {
      const newTeacherPasscode = body.teacherPasscode.trim();
      if (newTeacherPasscode.length < 6 || newTeacherPasscode.length > 128) {
        return NextResponse.json(
          { error: "Teacher access password must be between 6 and 128 characters." },
          { status: 400 }
        );
      }
      data.teacherAccessHash = await bcrypt.hash(newTeacherPasscode, 10);
      data.teacherPasscodeRaw = "[REDACTED]";
      data.sessionVersion = { increment: 1 };
    }

    const updated = await prisma.schoolSettings.update({
      where: { id: "main" },
      data,
      select: {
        currentSession: true,
        registrationOpen: true,
      },
    });

    return NextResponse.json({ settings: updated });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Unable to update settings." },
      { status: 500 }
    );
  }
}

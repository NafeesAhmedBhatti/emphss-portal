import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession, invalidateSessionVersionCache } from "@/lib/auth";
import { privateJson, verifySameOrigin } from "@/lib/http";

export async function PATCH(request: Request) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }

  const session = await getSession();
  if (!session || session.role !== "admin") {
    return privateJson({ error: "Forbidden." }, { status: 403 });
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
        return privateJson(
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

    invalidateSessionVersionCache();
    revalidatePath("/");
    revalidatePath("/register");

    return privateJson({ settings: updated });
  } catch (error) {
    console.error("Update settings error:", error);
    return privateJson(
      { error: "Unable to update settings." },
      { status: 500 }
    );
  }
}

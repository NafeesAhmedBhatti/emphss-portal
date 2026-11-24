import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NOTICE_CATEGORIES } from "@/lib/constants";
import { privateJson, verifySameOrigin } from "@/lib/http";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return privateJson({ error: "Forbidden." }, { status: 403 });
  }

  const notices = await prisma.notice.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return privateJson({ notices });
}

export async function POST(request: Request) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }

  const session = await getSession();
  if (!session || session.role !== "admin") {
    return privateJson({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const content = typeof body.content === "string" ? body.content.trim() : "";
    const category =
      typeof body.category === "string" &&
      NOTICE_CATEGORIES.includes(
        body.category as (typeof NOTICE_CATEGORIES)[number]
      )
        ? body.category
        : "General";
    const isPinned = Boolean(body.isPinned);
    const expireDays =
      typeof body.expireDays === "number" ? body.expireDays : 15;
    const expiresAt =
      expireDays > 0 ? new Date(Date.now() + expireDays * 86400_000) : null;

    if (title.length < 3 || content.length < 5) {
      return privateJson(
        { error: "Please enter both a notice title and description." },
        { status: 400 }
      );
    }

    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        category,
        isPinned,
        isActive: true,
        expiresAt,
      },
    });

    revalidatePath("/");
    return privateJson({ notice }, { status: 201 });
  } catch (error) {
    console.error("Create notice error:", error);
    return privateJson(
      { error: "Unable to publish notice." },
      { status: 500 }
    );
  }
}

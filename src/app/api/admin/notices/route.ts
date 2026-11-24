import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NOTICE_CATEGORIES } from "@/lib/constants";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  const notices = await prisma.notice.findMany({
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ notices });
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
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
      return NextResponse.json(
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

    return NextResponse.json({ notice }, { status: 201 });
  } catch (error) {
    console.error("Create notice error:", error);
    return NextResponse.json(
      { error: "Unable to publish notice." },
      { status: 500 }
    );
  }
}

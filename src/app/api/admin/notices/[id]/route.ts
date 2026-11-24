import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    const body = await request.json();
    const data: Record<string, boolean> = {};
    if (typeof body.isPinned === "boolean") data.isPinned = body.isPinned;
    if (typeof body.isActive === "boolean") data.isActive = body.isActive;

    const notice = await prisma.notice.update({
      where: { id },
      data,
    });

    return NextResponse.json({ notice });
  } catch (error) {
    console.error("Update notice error:", error);
    return NextResponse.json(
      { error: "Unable to update notice." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    await prisma.notice.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete notice error:", error);
    return NextResponse.json(
      { error: "Unable to delete notice." },
      { status: 500 }
    );
  }
}

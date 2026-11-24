import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { privateJson, verifySameOrigin } from "@/lib/http";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return privateJson({ error: "Forbidden." }, { status: 403 });
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

    revalidatePath("/");
    return privateJson({ notice });
  } catch (error) {
    console.error("Update notice error:", error);
    return privateJson(
      { error: "Unable to update notice." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!verifySameOrigin(request)) {
    return privateJson({ error: "Invalid request origin." }, { status: 403 });
  }
  const session = await getSession();
  if (!session || session.role !== "admin") {
    return privateJson({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const { id } = await context.params;
    await prisma.notice.delete({ where: { id } });
    revalidatePath("/");
    return privateJson({ success: true });
  } catch (error) {
    console.error("Delete notice error:", error);
    return privateJson(
      { error: "Unable to delete notice." },
      { status: 500 }
    );
  }
}

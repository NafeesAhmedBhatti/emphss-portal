import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";
import { AdminTeachersClient } from "@/components/AdminTeachersClient";

export const dynamic = "force-dynamic";

export default async function AdminTeachersPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login?tab=admin");
  }

  const [settings, teachers] = await Promise.all([
    prisma.schoolSettings.findUnique({ where: { id: "main" } }),
    prisma.teacher.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const serialized = teachers.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <AdminShell currentSession={settings?.currentSession ?? "2026-27"}>
      <AdminTeachersClient initialTeachers={serialized} />
    </AdminShell>
  );
}

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";
import { AdminPromotionClient } from "@/components/AdminPromotionClient";

export const dynamic = "force-dynamic";

export default async function AdminPromotionPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login?tab=admin");
  }

  const [settings, activeStudents, logs] = await Promise.all([
    prisma.schoolSettings.findUnique({ where: { id: "main" } }),
    prisma.student.findMany({
      where: { status: "Active" },
      orderBy: [{ currentClass: "asc" }, { studentName: "asc" }],
      select: {
        id: true,
        referenceId: true,
        studentName: true,
        fatherName: true,
        currentClass: true,
      },
    }),
    prisma.promotionLog.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const serializedLogs = logs.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <AdminShell currentSession={settings?.currentSession ?? "2026-27"}>
      <AdminPromotionClient
        currentSession={settings?.currentSession ?? "2026-27"}
        activeStudents={activeStudents}
        logs={serializedLogs}
      />
    </AdminShell>
  );
}

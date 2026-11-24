import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";
import { AdminStudentsClient } from "@/components/AdminStudentsClient";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login?tab=admin");
  }

  const resolvedParams = await searchParams;
  const [settings, students] = await Promise.all([
    prisma.schoolSettings.findUnique({ where: { id: "main" } }),
    prisma.student.findMany({ orderBy: { createdAt: "desc" } }),
  ]);

  const serialized = students.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }));

  return (
    <AdminShell currentSession={settings?.currentSession ?? "2026-27"}>
      <AdminStudentsClient
        initialStudents={serialized}
        initialClassFilter={resolvedParams.class || "All"}
      />
    </AdminShell>
  );
}

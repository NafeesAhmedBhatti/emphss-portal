import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AdminShell } from "@/components/AdminShell";
import { AdminSettingsClient } from "@/components/AdminSettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login?tab=admin");
  }

  const [settings, notices, corrections] = await Promise.all([
    prisma.schoolSettings.findUnique({ where: { id: "main" } }),
    prisma.notice.findMany({
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    }),
    prisma.correctionRequest.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
  ]);

  const serializedNotices = notices.map((n) => ({
    ...n,
    createdAt: n.createdAt.toISOString(),
  }));

  const serializedCorrections = corrections.map((c) => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <AdminShell currentSession={settings?.currentSession ?? "2026-27"}>
      <AdminSettingsClient
        initialNotices={serializedNotices}
        hasTeacherPasscode={Boolean(settings?.teacherAccessHash)}
        initialRegistrationOpen={settings?.registrationOpen ?? true}
        initialCorrections={serializedCorrections}
      />
    </AdminShell>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Bus,
  Download,
  Home,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CLASS_ORDER, TRANSPORT_ROUTES } from "@/lib/constants";
import { AdminShell } from "@/components/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    redirect("/login?tab=admin");
  }

  const [settings, activeStatsStudents, pendingCount, recentStudents, teachersCount] =
    await Promise.all([
      prisma.schoolSettings.findUnique({ where: { id: "main" } }),
      prisma.student.findMany({
        where: { status: "Active" },
        select: {
          currentClass: true,
          transportMode: true,
          vehicleRoute: true,
        },
      }),
      prisma.student.count({ where: { status: "Pending" } }),
      prisma.student.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          referenceId: true,
          studentName: true,
          currentClass: true,
          transportMode: true,
          vehicleRoute: true,
          mobileNumber: true,
          status: true,
          photoData: true,
        },
      }),
      prisma.teacher.count({ where: { isActive: true } }),
    ]);

  const totalStudents = activeStatsStudents.length;
  const localCount = activeStatsStudents.filter(
    (s) => s.transportMode === "Local"
  ).length;
  const transportCount = activeStatsStudents.filter(
    (s) => s.transportMode === "School Transport"
  ).length;

  const classCounts = CLASS_ORDER.map((cls) => ({
    cls,
    count: activeStatsStudents.filter((s) => s.currentClass === cls).length,
  }));

  // Group school transport routes (standardize official routes + include any custom stops)
  const routeCountByUpper = new Map<string, number>();
  for (const s of activeStatsStudents) {
    if (s.transportMode === "School Transport") {
      const key = (s.vehicleRoute?.trim() || "Unspecified Route").toUpperCase();
      routeCountByUpper.set(key, (routeCountByUpper.get(key) ?? 0) + 1);
    }
  }

  const officialUpperSet = new Set(
    TRANSPORT_ROUTES.map((r) => r.toUpperCase())
  );
  const officialRouteSummary = TRANSPORT_ROUTES.map((route) => ({
    route,
    count: routeCountByUpper.get(route.toUpperCase()) ?? 0,
  }));
  const otherRouteSummary = Array.from(routeCountByUpper.entries())
    .filter(([upper]) => !officialUpperSet.has(upper))
    .sort((a, b) => b[1] - a[1])
    .map(([route, count]) => ({ route, count }));
  const routeSummary = [...officialRouteSummary, ...otherRouteSummary];

  return (
    <AdminShell currentSession={settings?.currentSession ?? "2026-27"}>
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-[#0F2942]">
            School Administration Overview
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Live student, transport, and faculty summary for EMPHSS Bawli.
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <a
            href="/api/admin/students/export"
            download="EMPHSS-Students-Export.csv"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-[#0F2942] shadow-xs hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-amber-600" />
            Export All CSV
          </a>
          <Link
            href="/admin/students"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0F2942] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#163B5E]"
          >
            Manage Students
            <ArrowRight className="h-4 w-4 text-amber-400" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Active Students
            </span>
            <Users className="h-5 w-5 text-[#0F2942]" />
          </div>
          <p className="font-heading mt-2 text-3xl font-extrabold text-[#0F2942]">
            {totalStudents}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {pendingCount > 0 ? (
              <span className="font-semibold text-amber-700">
                {pendingCount} pending teacher approval
              </span>
            ) : (
              "Nursery to Class 12th"
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Local Students
            </span>
            <Home className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="font-heading mt-2 text-3xl font-extrabold text-emerald-700">
            {localCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">Self / Walking / Cycle</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              School Transport
            </span>
            <Bus className="h-5 w-5 text-amber-600" />
          </div>
          <p className="font-heading mt-2 text-3xl font-extrabold text-amber-700">
            {transportCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {routeSummary.filter((r) => r.count > 0).length} active route(s)
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Active Faculty
            </span>
            <UserCheck className="h-5 w-5 text-purple-600" />
          </div>
          <p className="font-heading mt-2 text-3xl font-extrabold text-[#0F2942]">
            {teachersCount}
          </p>
          <p className="mt-1 text-xs text-slate-400">Registered Teachers</p>
        </div>
      </div>

      {/* Class Distribution & Transport Route Summary */}
      <div className="mt-8 grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-7">
          <h2 className="font-heading text-base font-extrabold text-[#0F2942]">
            Class-Wise Student Strength
          </h2>
          <div className="mt-4 grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-5">
            {classCounts.map((item) => (
              <Link
                key={item.cls}
                href={`/admin/students?class=${encodeURIComponent(item.cls)}`}
                className="flex flex-col items-center justify-center rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-center transition-all hover:border-[#0F2942]/40 hover:bg-white hover:shadow-xs"
              >
                <span className="text-[11px] font-bold tracking-wide text-slate-500 uppercase">
                  {item.cls}
                </span>
                <span className="font-heading mt-1 text-xl font-bold text-[#0F2942]">
                  {item.count}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading flex items-center gap-2 text-base font-extrabold text-[#0F2942]">
              <Bus className="h-5 w-5 text-amber-600" />
              Transport Route Summary
            </h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-900">
              Total: {transportCount}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {routeSummary.map(({ route, count }) => (
              <div
                key={route}
                className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-slate-50 px-4 py-2.5 text-sm"
              >
                <span className="font-semibold text-slate-800">{route}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    count > 0
                      ? "bg-[#0F2942] text-amber-300"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {count} student{count === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-base font-extrabold text-[#0F2942]">
            Recent Student Submissions
          </h2>
          <Link
            href="/admin/students"
            className="text-xs font-bold text-[#0F2942] hover:underline"
          >
            View All →
          </Link>
        </div>

        {recentStudents.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            No student registrations submitted yet.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-slate-100">
            {recentStudents.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between gap-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 text-slate-400">
                    {s.photoData ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={s.photoData}
                        alt={s.studentName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#0F2942]">
                      {s.studentName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {s.referenceId} • Class {s.currentClass} •{" "}
                      {s.transportMode === "School Transport"
                        ? s.vehicleRoute
                        : "Local"}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {s.mobileNumber}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminShell>
  );
}

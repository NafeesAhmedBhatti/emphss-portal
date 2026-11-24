"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  TrendingUp,
  UserCheck,
  Users,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/teachers", label: "Teachers", icon: UserCheck },
  { href: "/admin/settings", label: "Notices & Settings", icon: Bell },
  { href: "/admin/promotion", label: "Class Promotion", icon: TrendingUp },
];

export function AdminShell({
  children,
  currentSession,
}: {
  children: React.ReactNode;
  currentSession?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login?tab=admin");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top Admin Header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-[#0F2942] text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-[#0F2942]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-heading text-sm font-bold tracking-tight sm:text-base">
                EMPHSS Admin
              </span>
              {currentSession && (
                <p className="text-[11px] text-amber-300">
                  Session {currentSession}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 sm:inline-flex"
            >
              Public Site
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 md:inline-flex"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
            <button
              type="button"
              aria-label="Toggle Admin Menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="rounded-lg border border-white/20 bg-white/10 p-1.5 text-white md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Desktop Sub-Navigation */}
        <div className="hidden border-t border-white/10 bg-[#0B2034] md:block">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-1 px-4 py-2 sm:px-6">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                    active
                      ? "bg-amber-500 text-[#0F2942]"
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Clean Drawer Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#0B2034] px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${
                      active
                        ? "bg-amber-500 text-[#0F2942]"
                        : "text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/"
                target="_blank"
                onClick={() => setMobileMenuOpen(false)}
                className="mt-1 flex items-center gap-2.5 rounded-xl border border-white/15 px-3.5 py-2.5 text-sm font-semibold text-slate-200"
              >
                <ArrowUpRight className="h-4 w-4 text-amber-300" />
                Open Public Site
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-slate-200 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500">
        <Link
          href="/developer"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pr-3 pl-1 transition-colors hover:border-[#0F2942]/30"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nafees.jpg"
            alt="Nafees Ahmed Bhatti"
            className="h-6 w-6 rounded-full border border-amber-400 object-cover object-top"
          />
          <span>
            Built by{" "}
            <strong className="text-[#0F2942]">Nafees Ahmed Bhatti</strong>
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        </Link>
      </footer>
    </div>
  );
}

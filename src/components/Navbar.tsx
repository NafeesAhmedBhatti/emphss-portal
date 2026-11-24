"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, Menu, X, UserPlus, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";

interface ActiveStudentBadge {
  referenceId: string;
  studentName: string;
  photoData: string | null;
}

export function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeStudent, setActiveStudent] = useState<ActiveStudentBadge | null>(
    null
  );

  useEffect(() => {
    let mounted = true;
    fetch("/api/students/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        if (data.student) {
          setActiveStudent({
            referenceId: data.student.referenceId,
            studentName: data.student.studentName,
            photoData: data.student.photoData,
          });
        } else {
          setActiveStudent(null);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [pathname]);

  const isActive = (href: string) => pathname === href;

  return (
    <header className="no-print sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3.5 py-2.5 sm:px-6 sm:py-3">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0F2942] text-amber-400 shadow-xs transition-transform group-hover:scale-105 sm:h-10 sm:w-10">
            <GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="min-w-0 leading-tight">
            <span className="font-heading block text-base font-bold tracking-tight text-[#0F2942] sm:text-lg">
              EMPHSS
            </span>
            <p className="truncate text-[11px] font-medium text-slate-500 sm:text-xs">
              <span className="sm:hidden">Bawli • Nursery – 12th</span>
              <span className="hidden sm:inline">
                English Medium Public H.S. School, Bawli
              </span>
            </p>
          </div>
        </Link>

        {/* Desktop Nav — Strictly Student & Parent Focused */}
        <nav className="hidden items-center gap-1.5 lg:flex">
          <Link
            href="/"
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              isActive("/")
                ? "bg-slate-100 text-[#0F2942]"
                : "text-slate-600 hover:bg-slate-50 hover:text-[#0F2942]"
            }`}
          >
            Home
          </Link>
          <Link
            href="/#notices"
            className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50 hover:text-[#0F2942]"
          >
            Notice Board
          </Link>
          <Link
            href="/principal"
            className={`rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
              isActive("/principal")
                ? "bg-slate-100 text-[#0F2942]"
                : "text-slate-600 hover:bg-slate-50 hover:text-[#0F2942]"
            }`}
          >
            Principal
          </Link>

          {activeStudent ? (
            <Link
              href="/student"
              className="ml-1 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pr-3 pl-1 text-xs font-bold text-[#0F2942] shadow-2xs transition-all hover:border-[#0F2942]/30 hover:bg-white"
              title="Open My Student ID Card"
            >
              {activeStudent.photoData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeStudent.photoData}
                  alt={activeStudent.studentName}
                  className="h-7 w-7 rounded-full object-cover"
                />
              ) : (
                <CreditCard className="ml-1.5 h-4 w-4 text-amber-600" />
              )}
              <span>{activeStudent.referenceId}</span>
            </Link>
          ) : (
            <Link
              href="/student"
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                isActive("/student")
                  ? "bg-slate-100 text-[#0F2942]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-[#0F2942]"
              }`}
            >
              <CreditCard className="h-4 w-4 text-amber-600" />
              My ID Card
            </Link>
          )}

          <Link
            href="/register"
            className="ml-2 inline-flex items-center gap-2 rounded-xl bg-[#0F2942] px-4 py-2 text-sm font-semibold text-white shadow-xs transition-all hover:bg-[#163B5E] active:scale-[0.98]"
          >
            <UserPlus className="h-4 w-4 text-amber-400" />
            Student Form
          </Link>
        </nav>

        {/* Mobile & Tablet Actions */}
        <div className="flex shrink-0 items-center gap-2 lg:hidden">
          {!activeStudent && (
            <Link
              href="/register"
              className="inline-flex items-center gap-1 rounded-xl bg-[#0F2942] px-3 py-2 text-xs font-semibold text-white shadow-xs"
            >
              <UserPlus className="h-3.5 w-3.5 text-amber-400" />
              Form
            </Link>
          )}
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            aria-label="Toggle Menu"
            className={`flex items-center gap-1.5 border border-slate-200 transition-colors hover:bg-slate-50 ${
              activeStudent
                ? "rounded-full bg-slate-50 p-1 text-[#0F2942] shadow-2xs"
                : "rounded-xl p-2 text-slate-700"
            }`}
          >
            {open ? (
              <X className="m-1 h-5 w-5" />
            ) : activeStudent?.photoData ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeStudent.photoData}
                  alt={activeStudent.studentName}
                  className="h-7 w-7 rounded-full border border-amber-400 object-cover"
                />
                <Menu className="mr-1 h-4 w-4 text-[#0F2942]" />
              </>
            ) : activeStudent ? (
              <>
                <CreditCard className="ml-1.5 h-4 w-4 text-amber-600" />
                <Menu className="mr-1 h-4 w-4 text-[#0F2942]" />
              </>
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Dropdown */}
      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 lg:hidden">
          <div className="flex flex-col gap-1">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Home
            </Link>
            <Link
              href="/#notices"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Notice Board
            </Link>
            <Link
              href="/principal"
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Principal&apos;s Desk
            </Link>
            <Link
              href="/student"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0F2942] hover:bg-slate-50"
            >
              <CreditCard className="h-4 w-4 text-amber-600" />
              {activeStudent
                ? `My ID Card (${activeStudent.referenceId})`
                : "My ID Card (Student Login)"}
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-[#0F2942] hover:bg-slate-50"
            >
              <UserPlus className="h-4 w-4 text-amber-600" />
              Student Profile Form
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

import Link from "next/link";
import {
  ArrowRight,
  Bell,
  Camera,
  CheckCircle2,
  Phone,
  Pin,
  Quote,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { HeroSlider } from "@/components/HeroSlider";
import {
  getDailyMotivationalQuote,
  getUpcomingAutoHolidays,
} from "@/lib/holidays";

export const revalidate = 60;

const CATEGORY_STYLES: Record<string, string> = {
  Admission: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Transport: "bg-sky-50 text-sky-700 border-sky-200",
  Timing: "bg-amber-50 text-amber-800 border-amber-200",
  General: "bg-slate-100 text-slate-700 border-slate-200",
};

export default async function HomePage() {
  const now = new Date();
  const [settings, notices] = await Promise.all([
    prisma.schoolSettings.findUnique({ where: { id: "main" } }),
    prisma.notice.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
      take: 6,
    }),
  ]);

  const autoHolidays = getUpcomingAutoHolidays();
  const dailyQuote = getDailyMotivationalQuote();
  const currentSession = settings?.currentSession ?? "2026-27";

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Executive School Hero Banner */}
        <HeroSlider currentSession={currentSession} />

        {/* Academic Wings Showcase */}
        <section className="mx-auto max-w-6xl px-4 pt-6 pb-2 sm:px-6">
          <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="font-heading text-xl font-extrabold text-[#0F2942] sm:text-2xl">
                Academic Wings at EMPHSS
              </h2>
              <p className="text-xs text-slate-500 sm:text-sm">
                Structured learning stages from early childhood to board
                examinations
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                tag: "Nursery • LKG • UKG",
                title: "Pre-Primary Wing",
                desc: "Activity-based foundational learning, phonics, and caring mentorship for young beginners.",
                border: "border-t-4 border-t-amber-500",
              },
              {
                tag: "Class 1st to 8th",
                title: "Primary & Middle Wing",
                desc: "Strong command over English, Mathematics, Science, and computer fundamentals.",
                border: "border-t-4 border-t-[#0F2942]",
              },
              {
                tag: "Class 9th to 12th",
                title: "Higher Secondary Wing",
                desc: "Focused board exam preparation, disciplined study habits, and career readiness.",
                border: "border-t-4 border-t-emerald-600",
              },
            ].map((wing) => (
              <div
                key={wing.title}
                className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-xs ${wing.border}`}
              >
                <span className="inline-block rounded-md bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-[#0F2942]">
                  {wing.tag}
                </span>
                <h3 className="font-heading mt-3 text-base font-extrabold text-[#0F2942]">
                  {wing.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                  {wing.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* From the Principal's Desk */}
        <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0F2942]/10 px-3 py-1 text-xs font-bold text-[#0F2942]">
                  From the Principal&apos;s Desk
                </span>
                <div className="mt-3 flex items-start gap-3">
                  <Quote className="mt-1 h-6 w-6 shrink-0 text-amber-500" />
                  <p className="text-sm leading-relaxed text-slate-700 sm:text-base">
                    &ldquo;At EMPHSS Bawli, our commitment is to provide
                    disciplined, value-driven English Medium education from
                    Nursery to Class 12th. With our digital portal, every
                    student&apos;s record and official ID card is accurate,
                    accessible, and transparent.&rdquo;
                  </p>
                </div>
                <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 sm:inline-flex">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F2942] font-heading text-xs font-bold text-amber-400">
                    KH
                  </div>
                  <div className="border-l-2 border-amber-400 pl-3">
                    <p className="font-heading text-sm font-bold text-[#0F2942] sm:text-base">
                      Mr. Kafayat Hussain
                    </p>
                    <p className="text-[11px] font-medium text-slate-600 sm:text-xs">
                      Principal •{" "}
                      <span className="font-semibold text-[#0F2942]">
                        English Medium Public Higher Secondary School, Bawli
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/principal"
                className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs font-bold text-[#0F2942] hover:bg-slate-100 md:self-center"
              >
                Read Full Message
                <ArrowRight className="h-4 w-4 text-amber-600" />
              </Link>
            </div>
          </div>
        </section>

        {/* Simple 3-Step Guide for Parents & Students */}
        <section className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xs sm:p-7">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800">
                  <Sparkles className="h-3 w-3" />
                  Easy for Students &amp; Parents
                </span>
                <h2 className="font-heading mt-1.5 text-lg font-bold text-[#0F2942] sm:text-2xl">
                  3 Simple Steps to Register
                </h2>
              </div>
              <Link
                href="/register"
                className="hidden items-center gap-2 rounded-xl bg-[#0F2942] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#163B5E] sm:inline-flex sm:text-sm"
              >
                Start Registration
                <ArrowRight className="h-4 w-4 text-amber-400" />
              </Link>
            </div>

            <div className="mt-4 grid gap-2.5 sm:mt-5 sm:gap-4 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Enter Details & Photo",
                  desc: "Fill student & parent info and upload a clear photo.",
                  icon: Camera,
                },
                {
                  step: "02",
                  title: "Review & Confirm",
                  desc: "Check all spellings carefully before final submit.",
                  icon: ShieldCheck,
                },
                {
                  step: "03",
                  title: "Download Your ID Card",
                  desc: "Get your Student ID and download your digital card.",
                  icon: CheckCircle2,
                },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.step}
                    className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 md:block md:p-5"
                  >
                    <div className="flex shrink-0 items-center gap-2 md:justify-between">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F2942] font-heading text-xs font-bold text-amber-400 md:h-auto md:w-auto md:bg-transparent md:text-xl md:text-amber-500">
                        {s.step}
                      </span>
                      <div className="hidden h-8 w-8 items-center justify-center rounded-lg bg-white text-[#0F2942] shadow-xs md:flex">
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-heading text-sm font-bold text-[#0F2942] md:mt-2.5 md:text-base">
                        {s.title}
                      </h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-slate-600 md:mt-1 md:text-sm">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link
              href="/register"
              className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F2942] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#163B5E] sm:hidden"
            >
              Start Registration
              <ArrowRight className="h-4 w-4 text-amber-400" />
            </Link>
          </div>
        </section>

        {/* Digital Notice Board */}
        <section id="notices" className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-extrabold text-[#0F2942] sm:text-2xl">
                  Digital Notice Board
                </h2>
                <p className="text-xs text-slate-500 sm:text-sm">
                  Latest announcements &amp; updates from EMPHSS Bawli
                </p>
              </div>
            </div>
          </div>

          {autoHolidays.length === 0 && notices.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50/80 to-white p-6 shadow-xs sm:p-8">
              <div className="flex items-start gap-3">
                <Quote className="mt-1 h-7 w-7 shrink-0 text-amber-500" />
                <div>
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-0.5 text-[11px] font-bold text-amber-800">
                    Thought for the Day • EMPHSS Students
                  </span>
                  <p className="font-heading mt-2.5 text-base leading-relaxed font-bold text-[#0F2942] sm:text-lg">
                    &ldquo;{dailyQuote.quote}&rdquo;
                  </p>
                  <p className="mt-1.5 text-xs font-semibold text-slate-500">
                    — {dailyQuote.author}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {autoHolidays.map((h) => {
                const [y, m, d] = h.date.split("-");
                const formattedDate = `${d}-${m}-${y}`;
                return (
                  <article
                    key={`${h.date}-${h.title}`}
                    className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 shadow-xs sm:p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-800">
                        Holiday
                      </span>
                      <span className="text-xs font-semibold text-rose-700">
                        {h.label} ({formattedDate})
                      </span>
                    </div>
                    <h3 className="font-heading mt-2.5 text-sm font-bold text-[#0F2942] sm:text-base">
                      {h.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {h.description}
                    </p>
                  </article>
                );
              })}
              {notices.map((notice) => {
                const badgeClass =
                  CATEGORY_STYLES[notice.category] ?? CATEGORY_STYLES.General;
                return (
                  <article
                    key={notice.id}
                    className={`rounded-2xl border bg-white p-4 shadow-xs transition-all hover:shadow-md sm:p-5 ${
                      notice.isPinned
                        ? "border-amber-300 ring-1 ring-amber-200/60"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass}`}
                      >
                        {notice.category}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        {notice.isPinned && (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                            <Pin className="h-3 w-3" />
                            Pinned
                          </span>
                        )}
                        <span>
                          {new Date(notice.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          }).replace(/\//g, "-")}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-heading mt-2.5 text-sm font-bold text-[#0F2942] sm:text-base">
                      {notice.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {notice.content}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* School Helpdesk & Official Contacts */}
        <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
            <div className="mb-5">
              <h2 className="font-heading text-xl font-bold text-[#0F2942] sm:text-2xl">
                School Helpdesk &amp; Official Contacts
              </h2>
              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                Parents &amp; students can directly tap to call for admissions,
                fees, or record corrections.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              {[
                {
                  role: "Principal",
                  name: "Mr. Kafayat Hussain",
                  phone: "+91 9103214843",
                  tel: "+919103214843",
                },
                {
                  role: "Accountant (Fee Section)",
                  name: "Mr. Aqib Abbas Bhatti",
                  phone: "+91 9149636385",
                  tel: "+919149636385",
                },
                {
                  role: "Record Section",
                  name: "Mr. Khalid Latif Dar",
                  phone: "+91 7006278350",
                  tel: "+917006278350",
                },
              ].map((c) => (
                <a
                  key={c.role}
                  href={`tel:${c.tel}`}
                  className="group flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition-all hover:border-[#0F2942]/30 hover:bg-white hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0F2942] text-amber-400 transition-transform group-hover:scale-105">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold tracking-wider text-amber-700 uppercase">
                      {c.role}
                    </p>
                    <p className="truncate text-sm font-bold text-[#0F2942]">
                      {c.name}
                    </p>
                    <p className="mt-0.5 text-xs font-semibold text-slate-600">
                      {c.phone}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-5 rounded-3xl bg-[#0F2942] p-6 text-white shadow-lg sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="font-heading text-xl font-extrabold sm:text-2xl">
                Haven&apos;t Submitted Your Student Profile Yet?
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                All students from Nursery to Class 12th can submit their profile
                and photo online in minutes.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-500 px-6 py-3.5 text-sm font-bold text-[#0F2942] shadow-md hover:bg-amber-400"
            >
              Fill Student Form Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

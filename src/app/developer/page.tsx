import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  GraduationCap,
  Layers,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function DeveloperPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Executive Hero Card with Real Portrait */}
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F2942] via-[#153A5B] to-[#0B1E30] p-6 text-white shadow-xl sm:p-10">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:items-center sm:text-left">
              <div className="h-32 w-32 shrink-0 overflow-hidden rounded-3xl border-2 border-amber-400/70 bg-white shadow-xl sm:h-36 sm:w-36">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/nafees.jpg"
                  alt="Nafees Ahmed Bhatti"
                  className="h-full w-full object-cover object-top"
                />
              </div>

              <div className="flex-1">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Portal Architect &amp; CS Faculty
                </div>
                <h1 className="font-heading mt-2.5 text-2xl font-bold sm:text-3xl">
                  Nafees Ahmed Bhatti
                </h1>
                <p className="mt-1 text-sm font-medium text-amber-200 sm:text-base">
                  AI Engineer &amp; Full-Stack Developer • CS Faculty, EMPHSS
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                  <a
                    href="https://nafeesbhatti.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-[#0F2942] shadow-md transition-all hover:bg-amber-400"
                  >
                    Visit Full Portfolio
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <Link
                    href="/"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-xs font-semibold text-white hover:bg-white/20"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to EMPHSS Home
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Concise School-Focused Introduction */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
            <h2 className="font-heading text-lg font-bold text-[#0F2942]">
              About the Creator
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600 sm:text-base">
              I&apos;m an{" "}
              <strong className="text-[#0F2942]">
                AI Engineer and Full-Stack Developer
              </strong>{" "}
              building LLM-powered systems and modern web applications in
              TypeScript, Next.js, Python, and PostgreSQL—alongside teaching
              Computer Science at{" "}
              <strong className="text-[#0F2942]">EMPHSS Bawli</strong>. I
              designed and engineered this portal end-to-end so students,
              parents, and staff can manage Digital IDs, notices, and academic
              records from any device.
            </p>
            <p className="mt-3 text-xs text-slate-500 sm:text-sm">
              Want to see my engineering work, AI projects, and full technical
              background? Visit my{" "}
              <a
                href="https://nafeesbhatti.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-[#0F2942] underline decoration-amber-400 underline-offset-4 hover:text-amber-700"
              >
                Personal Portfolio
              </a>
              .
            </p>
          </div>

          {/* What Was Built for EMPHSS */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: GraduationCap,
                title: "Student ID & Profiles",
                desc: "Mobile photo upload, Form Teacher verification, and instant Digital ID cards.",
              },
              {
                icon: Layers,
                title: "Teacher & Award Roll",
                desc: "Class-wise examination Award Rolls with draft saving and student lookup.",
              },
              {
                icon: ShieldCheck,
                title: "Privacy & Role Security",
                desc: "4-Factor student verification, encrypted staff sessions, and annual class promotion.",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
                >
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F2942] text-amber-400">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-heading mt-3 text-sm font-bold text-[#0F2942]">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {item.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

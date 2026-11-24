import Link from "next/link";
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  Briefcase,
  Code2,
  Cpu,
  GraduationCap,
  Layers,
  MapPin,
  ShieldCheck,
  Sparkles,
  Users,
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
                  Portal Architect &amp; Creator
                </div>
                <h1 className="font-heading mt-2.5 text-2xl font-bold sm:text-3xl">
                  Nafees Ahmed Bhatti
                </h1>
                <p className="mt-1 text-sm font-medium text-amber-200 sm:text-base">
                  AI Engineer &amp; Full-Stack Developer
                </p>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-slate-300 sm:justify-start">
                  <MapPin className="h-3.5 w-3.5 text-amber-400" />
                  Jammu &amp; Kashmir, India
                </p>

                <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 sm:justify-start">
                  <a
                    href="https://nafees-ahmed.vercel.app/"
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

            {/* Impact Stats Strip */}
            <div className="mt-7 grid grid-cols-2 gap-3 border-t border-white/15 pt-6 sm:grid-cols-4">
              {[
                { label: "Students Trained", value: "500+" },
                { label: "Experience", value: "2+ Years" },
                { label: "Technologies", value: "20+" },
                { label: "Current Role", value: "AI Engineer" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-white/5 px-3.5 py-3 text-center"
                >
                  <p className="font-heading text-lg font-bold text-amber-300 sm:text-xl">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-300">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* About & Teaching Background */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
            <h2 className="font-heading text-lg font-bold text-[#0F2942]">
              About Nafees Ahmed Bhatti
            </h2>
            <p className="mt-2.5 text-sm leading-relaxed text-slate-600 sm:text-base">
              I am an <strong>AI Engineer and Full-Stack Developer</strong>{" "}
              passionate about turning real-world ideas into fast, reliable
              software. My journey began with building web applications and
              mentoring students—having trained{" "}
              <strong className="text-[#0F2942]">
                500+ students in full-stack development
              </strong>
              —which naturally grew into engineering intelligent Generative AI,
              LLM, and machine learning systems.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 sm:text-base">
              I designed and engineered this complete{" "}
              <strong className="text-[#0F2942]">
                EMPHSS Bawli Digital School Portal
              </strong>{" "}
              to replace manual paper registers with a secure, mobile-first
              platform for students, teachers, and school administration.
            </p>
          </div>

          {/* Experience Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0F2942] text-amber-400">
                  <Cpu className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                  Current Role
                </span>
              </div>
              <h3 className="font-heading mt-4 text-base font-bold text-[#0F2942]">
                AI Engineer — DryTIS
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                Building practical Generative AI applications, LLM workflows,
                RAG pipelines, and production machine learning models with
                Python and modern full-stack architectures.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Users className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600">
                  1 Year • Teaching
                </span>
              </div>
              <h3 className="font-heading mt-4 text-base font-bold text-[#0F2942]">
                Technical Trainer — Desire Infotech
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
                Served for 1 year as a dedicated Trainer in the teaching field,
                mentoring students in web development, programming logic, and
                real-world software projects.
              </p>
            </div>
          </div>

          {/* Technical Toolkit */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
            <h2 className="font-heading flex items-center gap-2 text-lg font-bold text-[#0F2942]">
              <Code2 className="h-5 w-5 text-amber-600" />
              Technical Expertise
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                "Next.js",
                "React.js",
                "TypeScript",
                "Python",
                "Node.js",
                "Express.js",
                "Django",
                "Laravel",
                "PostgreSQL",
                "Prisma ORM",
                "MongoDB",
                "Tailwind CSS",
                "Generative AI",
                "LLMs & RAG",
                "TensorFlow",
                "Scikit-Learn",
                "OpenCV",
              ].map((skill) => (
                <span
                  key={skill}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-[#0F2942]"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* What Was Built for EMPHSS */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: GraduationCap,
                title: "Student ID & Profiles",
                desc: "Mobile photo upload, Form Teacher approval queue, and instant PNG/PDF ID cards.",
              },
              {
                icon: Layers,
                title: "Award Roll Engine",
                desc: "Class-wise examination Award Rolls with draft saving and automatic pass analytics.",
              },
              {
                icon: ShieldCheck,
                title: "Tight Role Security",
                desc: "4-Factor student verification, 90-day staff sessions, and annual class promotion.",
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

import Link from "next/link";
import { Award, BookOpen, GraduationCap, Phone, Quote, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export default function PrincipalPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-6">
          {/* Header Banner */}
          <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#0F2942] via-[#153A5B] to-[#0B1E30] p-5 text-white shadow-lg sm:p-8">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-400/15 text-amber-300 shadow-md sm:h-20 sm:w-20">
                <GraduationCap className="h-7 w-7 sm:h-10 sm:w-10" />
              </div>
              <div className="min-w-0">
                <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300 sm:px-3 sm:py-1 sm:text-xs">
                  From the Principal&apos;s Desk
                </span>
                <h1 className="font-heading mt-1.5 text-xl font-bold sm:mt-2 sm:text-3xl">
                  Principal&apos;s Message
                </h1>
                <p className="mt-0.5 text-xs leading-snug text-slate-300 sm:text-sm">
                  English Medium Public Higher Secondary School, Bawli (Nursery
                  to 12th)
                </p>
              </div>
            </div>
          </div>

          {/* Message Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8">
            <Quote className="h-8 w-8 text-amber-500/80" />
            <div className="mt-3 space-y-4 text-sm leading-relaxed text-slate-700 sm:text-base">
              <p>
                <strong>Dear Parents, Guardians, and Students,</strong>
              </p>
              <p>
                Welcome to{" "}
                <strong>
                  English Medium Public Higher Secondary School (EMPHSS), Bawli
                </strong>
                . Our mission has always been to provide quality, disciplined,
                and value-driven English Medium education to every child from
                Nursery through Class 12th.
              </p>
              <p>
                With our new Digital School Portal, we are bringing transparency,
                accurate student record management, and seamless communication
                between parents, teachers, and school administration. Every
                student&apos;s digital profile and official ID card is now just
                a click away.
              </p>
              <p>
                Together with our dedicated faculty, we remain committed to
                nurturing confident, responsible, and academically strong young
                citizens.
              </p>
            </div>

            <div className="mt-6 flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-heading text-base font-bold text-[#0F2942]">
                  Mr. Kafayat Hussain
                </p>
                <p className="text-xs text-slate-500">
                  Principal, English Medium Public Higher Secondary School, Bawli
                </p>
              </div>
              <a
                href="tel:+919103214843"
                className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-bold text-[#0F2942] hover:bg-slate-100"
              >
                <Phone className="h-3.5 w-3.5 text-amber-600" />
                +91 9103214843
              </a>
            </div>
          </div>

          {/* Core Values */}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: "Academic Excellence",
                desc: "Strong foundation from Nursery to Class 12th board exams.",
              },
              {
                icon: ShieldCheck,
                title: "Discipline & Safety",
                desc: "Caring campus and organized transport across surrounding areas.",
              },
              {
                icon: Award,
                title: "Digital Transparency",
                desc: "Verified student IDs, notices, and streamlined exam records.",
              },
            ].map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
                >
                  <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="font-heading mt-3 text-sm font-bold text-[#0F2942]">
                    {v.title}
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    {v.desc}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F2942] px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#163B5E]"
            >
              Fill Student Profile Form
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

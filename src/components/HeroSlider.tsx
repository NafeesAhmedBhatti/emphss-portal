"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Bus,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  GraduationCap,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface HeroSliderProps {
  currentSession: string;
}

const SLIDES = [
  {
    badge: "Nursery / LKG to Class 12th",
    title: "English Medium Public Higher Secondary School, Bawli",
    subtitle:
      "Empowering students with strong academics, discipline, and modern values. Complete your digital student profile in 2 minutes from any mobile phone.",
    accent: "from-[#0F2942] via-[#153A5B] to-[#0B1E30]",
    highlightLabel: "Digital Admission & Record Portal",
    icon: GraduationCap,
  },
  {
    badge: "Safe & Organized Transport",
    title: "Local & School Transport Covering Bawli & Surrounding Areas",
    subtitle:
      "Whether your child commutes locally or by school van/bus, keep your transport route and parent contact details up to date in our official school register.",
    accent: "from-[#122D48] via-[#1C476D] to-[#0F2942]",
    highlightLabel: "Village & Route Tracking Ready",
    icon: Bus,
  },
  {
    badge: "Instant Digital Profile Card",
    title: "One-Time Student Form with Automatic Class Progression",
    subtitle:
      "Upload a student photo, verify all details in the preview pop-up, and receive your official EMPHSS Student ID Card immediately.",
    accent: "from-[#0D2338] via-[#183E61] to-[#112A42]",
    highlightLabel: "Smart Session Promotion System",
    icon: ShieldCheck,
  },
];

export function HeroSlider({ currentSession }: HeroSliderProps) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[active];
  const SlideIcon = slide.icon;

  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-6xl px-4 pt-6 pb-8 sm:px-6 sm:pt-8">
        <div
          className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${slide.accent} p-6 text-white shadow-xl transition-colors duration-500 sm:p-10 lg:p-12`}
        >
          {/* Decorative background circles */}
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-400/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-sky-400/10 blur-2xl" />

          <div className="relative z-10 grid items-center gap-8 lg:grid-cols-12">
            <div className="flex flex-col items-center text-center lg:col-span-8 lg:items-start lg:text-left">
              <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-amber-300 backdrop-blur-sm sm:gap-2 sm:px-3.5 sm:text-xs">
                <Sparkles className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">Session {currentSession}</span>
                <span className="text-white/40">•</span>
                <span className="text-white">{slide.badge}</span>
              </div>

              <h1 className="font-heading mt-3.5 text-xl leading-snug font-bold tracking-tight text-white sm:text-3xl lg:text-[34px]">
                {slide.title}
              </h1>

              <p className="mt-2.5 max-w-2xl text-xs leading-relaxed text-slate-200 sm:text-base">
                {slide.subtitle}
              </p>

              <div className="mt-5 flex w-full flex-col gap-2.5 sm:mt-6 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-bold text-[#0F2942] shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-400 active:scale-[0.98]"
                >
                  Fill Student Profile Form
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/student"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  <CreditCard className="h-4 w-4 text-amber-300" />
                  Download My ID Card
                </Link>
              </div>
            </div>

            {/* Right visual card */}
            <div className="hidden lg:col-span-4 lg:flex lg:justify-end">
              <div className="w-full max-w-xs rounded-2xl border border-white/15 bg-white/10 p-6 backdrop-blur-md">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-[#0F2942] shadow-md">
                  <SlideIcon className="h-8 w-8" />
                </div>
                <p className="mt-4 text-xs font-semibold tracking-wider text-amber-300 uppercase">
                  EMPHSS Bawli
                </p>
                <p className="font-heading mt-1 text-lg font-bold text-white">
                  {slide.highlightLabel}
                </p>
                <div className="mt-4 space-y-2 border-t border-white/15 pt-4 text-xs text-slate-200">
                  <div className="flex items-center justify-between">
                    <span>Classes</span>
                    <span className="font-semibold text-white">Nursery – 12th</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Medium</span>
                    <span className="font-semibold text-white">English Medium</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Location</span>
                    <span className="font-semibold text-white">Bawli</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Slider Controls */}
          <div className="relative z-10 mt-7 flex items-center justify-between border-t border-white/10 pt-4">
            <div className="flex items-center gap-2">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Slide ${idx + 1}`}
                  onClick={() => setActive(idx)}
                  className={`h-2 rounded-full transition-all ${
                    active === idx
                      ? "w-8 bg-amber-400"
                      : "w-2 bg-white/35 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous slide"
                onClick={() =>
                  setActive((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)
                }
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                aria-label="Next slide"
                onClick={() => setActive((prev) => (prev + 1) % SLIDES.length)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

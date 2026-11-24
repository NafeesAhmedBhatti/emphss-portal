import Link from "next/link";
import { ArrowUpRight, GraduationCap, MapPin, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="no-print mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          {/* School Identity */}
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F2942] text-amber-400 shadow-xs">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading text-sm font-bold text-[#0F2942] sm:text-base">
                English Medium Public Higher Secondary School
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                Bawli • Nursery / LKG to Class 12th
              </p>
            </div>
          </div>

          {/* Clean Responsive Navigation Links */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-xs font-semibold text-slate-600 sm:flex sm:flex-wrap sm:items-center sm:gap-4 sm:text-sm">
            <Link href="/" className="hover:text-[#0F2942]">
              Home
            </Link>
            <Link href="/principal" className="hover:text-[#0F2942]">
              Principal&apos;s Desk
            </Link>
            <Link href="/student" className="hover:text-[#0F2942]">
              My ID Card
            </Link>
            <Link href="/register" className="hover:text-[#0F2942]">
              Student Form
            </Link>
            <Link
              href="/login"
              className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-[#0F2942] hover:bg-slate-100 sm:col-span-1"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#0F2942]" />
              Staff &amp; Admin Portal
            </Link>
          </div>
        </div>

        {/* Prominent Creator Banner */}
        <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 px-4 py-3 sm:flex-row">
          <p className="text-[11px] text-slate-500 sm:text-xs">
            © {new Date().getFullYear()} EMPHSS Bawli. Official Digital School
            Portal.
          </p>

          <Link
            href="/developer"
            className="group inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1 pr-3 pl-1 shadow-2xs transition-all hover:border-[#0F2942]/30 hover:shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/nafees.jpg"
              alt="Nafees Ahmed Bhatti"
              className="h-7 w-7 rounded-full border border-amber-400 object-cover object-top"
            />
            <span className="text-xs font-semibold text-slate-600">
              Built by{" "}
              <strong className="text-[#0F2942] group-hover:underline">
                Nafees Ahmed Bhatti
              </strong>
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-amber-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </footer>
  );
}

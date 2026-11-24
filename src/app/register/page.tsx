import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StudentRegistrationForm } from "@/components/StudentRegistrationForm";
import { Lock } from "lucide-react";
import Link from "next/link";

export const revalidate = 300;

export default async function RegisterPage() {
  const settings = await prisma.schoolSettings.findUnique({
    where: { id: "main" },
    select: { currentSession: true, registrationOpen: true },
  });

  const currentSession = settings?.currentSession ?? "2026-27";
  const registrationOpen = settings?.registrationOpen ?? true;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto mb-6 max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-[#0F2942]/10 px-3.5 py-1 text-xs font-bold text-[#0F2942]">
            EMPHSS Bawli • Student Record Portal
          </span>
          <h1 className="font-heading mt-2.5 text-2xl font-bold text-[#0F2942] sm:text-3xl">
            Student Digital Profile Form
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Enter accurate student details and upload a recent photo. Upon
            submission, you will receive your official{" "}
            <strong>EMPHSS Student ID Card</strong>.
          </p>
        </div>

        {!registrationOpen ? (
          <div className="mx-auto max-w-lg rounded-3xl border border-amber-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Lock className="h-6 w-6" />
            </div>
            <h2 className="font-heading mt-4 text-lg font-bold text-[#0F2942]">
              Online Registration is Currently Closed
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              The school administration has closed public student registration
              for this session. If you are already registered, you can view and
              download your ID Card anytime.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                href="/student"
                className="rounded-xl bg-[#0F2942] px-5 py-2.5 text-xs font-bold text-white"
              >
                Open My ID Card
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          <StudentRegistrationForm currentSession={currentSession} />
        )}
      </main>

      <Footer />
    </div>
  );
}

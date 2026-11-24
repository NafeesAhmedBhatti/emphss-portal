import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { StaffLoginForm } from "@/components/StaffLoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getSession();
  if (session?.role === "admin") {
    redirect("/admin");
  }
  if (session?.role === "teacher") {
    redirect("/teacher/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <Suspense fallback={<div className="text-sm text-slate-500">Loading...</div>}>
          <StaffLoginForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

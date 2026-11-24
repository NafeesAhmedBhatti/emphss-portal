"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Users,
} from "lucide-react";

export function StaffLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "admin" ? "admin" : "teacher";

  const [mode, setMode] = useState<"teacher" | "admin">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          email: mode === "admin" ? email : undefined,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials. Please try again.");
        setLoading(false);
        return;
      }

      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0F2942] to-[#173E63] px-6 py-6 text-center text-white">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-[#0F2942] shadow-md">
            <GraduationCap className="h-7 w-7" />
          </div>
          <h1 className="font-heading mt-3 text-xl font-extrabold">
            EMPHSS Staff &amp; Admin Portal
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Authorized school faculty and administration access only
          </p>
        </div>

        {/* Role Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 border-b border-slate-100 bg-slate-50/80 p-3">
          <button
            type="button"
            onClick={() => {
              setMode("teacher");
              setError("");
              setPassword("");
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
              mode === "teacher"
                ? "bg-[#0F2942] text-white shadow-sm"
                : "text-slate-600 hover:bg-white hover:text-[#0F2942]"
            }`}
          >
            <Users className="h-4 w-4 text-amber-400" />
            Teacher Login
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("admin");
              setError("");
              setPassword("");
            }}
            className={`flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-bold transition-all ${
              mode === "admin"
                ? "bg-[#0F2942] text-white shadow-sm"
                : "text-slate-600 hover:bg-white hover:text-[#0F2942]"
            }`}
          >
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            Admin Login
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800 sm:text-sm">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {mode === "teacher" ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs leading-relaxed text-amber-950">
              Enter the <strong>Staff Access Password</strong> shared by your
              School Admin to add or update your teacher profile.
            </div>
          ) : (
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@emphss.edu.in"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <KeyRound className="h-4 w-4 text-slate-400" />
              {mode === "teacher" ? "Staff Access Password" : "Admin Password"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  mode === "teacher"
                    ? "Enter staff access password"
                    : "Enter admin password"
                }
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pr-11 pl-4 text-sm text-slate-900 outline-none focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
              />
              <button
                type="button"
                aria-label="Toggle password visibility"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center px-3.5 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F2942] px-5 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-[#163B5E] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-amber-400" />
                {mode === "teacher"
                  ? "Sign In to Teacher Portal"
                  : "Sign In to Admin Panel"}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

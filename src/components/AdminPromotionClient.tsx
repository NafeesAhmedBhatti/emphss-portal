"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  History,
  Loader2,
  Search,
  TrendingUp,
} from "lucide-react";
import { getNextClass, PASSED_OUT_STATUS } from "@/lib/constants";

interface ActiveStudentItem {
  id: string;
  referenceId: string;
  studentName: string;
  fatherName: string;
  currentClass: string;
}

interface PromotionLogItem {
  id: string;
  fromSession: string;
  toSession: string;
  promotedCount: number;
  heldBackCount: number;
  passedOutCount: number;
  createdAt: string;
}

function suggestNextSession(current: string): string {
  const match = current.match(/^(\d{4})-(\d{2})$/);
  if (!match) return "2027-28";
  const start = Number.parseInt(match[1], 10) + 1;
  const end = String((start + 1) % 100).padStart(2, "0");
  return `${start}-${end}`;
}

export function AdminPromotionClient({
  currentSession,
  activeStudents,
  logs,
}: {
  currentSession: string;
  activeStudents: ActiveStudentItem[];
  logs: PromotionLogItem[];
}) {
  const router = useRouter();
  const [toSession, setToSession] = useState(() =>
    suggestNextSession(currentSession)
  );
  const [heldBackIds, setHeldBackIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const heldBackSet = useMemo(() => new Set(heldBackIds), [heldBackIds]);

  const counts = useMemo(() => {
    let promoted = 0;
    let passedOut = 0;
    let heldBack = 0;

    for (const s of activeStudents) {
      if (heldBackSet.has(s.id)) {
        heldBack += 1;
      } else if (getNextClass(s.currentClass) === PASSED_OUT_STATUS) {
        passedOut += 1;
      } else {
        promoted += 1;
      }
    }
    return { promoted, passedOut, heldBack };
  }, [activeStudents, heldBackSet]);

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeStudents;
    return activeStudents.filter(
      (s) =>
        s.studentName.toLowerCase().includes(q) ||
        s.referenceId.toLowerCase().includes(q) ||
        s.currentClass.toLowerCase().includes(q)
    );
  }, [activeStudents, search]);

  function toggleHoldBack(id: string) {
    setHeldBackIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function handlePromote() {
    if (activeStudents.length === 0) return;
    if (
      !window.confirm(
        `Promote ${counts.promoted} student(s) and graduate ${counts.passedOut} Class 12th student(s) from ${currentSession} to ${toSession}?`
      )
    ) {
      return;
    }

    setPromoting(true);
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/admin/promotion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toSession,
          heldBackStudentIds: heldBackIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to promote students.");
        setPromoting(false);
        return;
      }

      setSuccessMsg(
        `Session updated to ${data.summary.toSession}! Promoted: ${data.summary.promotedCount}, Passed Out: ${data.summary.passedOutCount}, Held Back: ${data.summary.heldBackCount}.`
      );
      setHeldBackIds([]);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPromoting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-[#0F2942]">
          Annual Class Promotion Center
        </h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Promote all active students to the next class (Nursery → LKG → ... →
          12th → Passed Out) in one click at the end of the academic year.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-900">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Session Transition & Summary */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-5">
          <h2 className="font-heading text-base font-extrabold text-[#0F2942]">
            Session Transition Setup
          </h2>

          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
            <div className="flex-1">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">
                Current Session
              </p>
              <p className="font-heading text-lg font-extrabold text-[#0F2942]">
                {currentSession}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase">
                New Session
              </label>
              <input
                type="text"
                value={toSession}
                onChange={(e) => setToSession(e.target.value)}
                placeholder="2027-28"
                className="mt-0.5 w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-heading text-sm font-bold text-[#0F2942] outline-none focus:border-[#0F2942]"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
            <div className="rounded-xl bg-emerald-50 p-3">
              <p className="text-xs font-semibold text-emerald-700">Promote</p>
              <p className="font-heading mt-1 text-2xl font-extrabold text-emerald-800">
                {counts.promoted}
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3">
              <p className="text-xs font-semibold text-[#0F2942]">Pass Out</p>
              <p className="font-heading mt-1 text-2xl font-extrabold text-[#0F2942]">
                {counts.passedOut}
              </p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3">
              <p className="text-xs font-semibold text-amber-800">Hold Back</p>
              <p className="font-heading mt-1 text-2xl font-extrabold text-amber-800">
                {counts.heldBack}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={promoting || activeStudents.length === 0}
            onClick={handlePromote}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F2942] px-5 py-3.5 text-sm font-bold text-white shadow-md hover:bg-[#163B5E] disabled:opacity-50"
          >
            {promoting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TrendingUp className="h-4 w-4 text-amber-400" />
            )}
            Promote All Eligible Students
          </button>
        </div>

        {/* Exception Selector */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-7">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-heading text-base font-extrabold text-[#0F2942]">
                Exceptions (Optional Hold Back)
              </h2>
              <p className="text-xs text-slate-500">
                Check any student who should remain in their current class.
              </p>
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter student..."
                className="w-full rounded-xl border border-slate-300 py-2 pr-3 pl-9 text-xs outline-none focus:border-[#0F2942]"
              />
            </div>
          </div>

          {activeStudents.length === 0 ? (
            <p className="mt-6 text-center text-sm text-slate-500">
              No active students found.
            </p>
          ) : (
            <div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
              {filteredStudents.map((s) => {
                const isHeldBack = heldBackSet.has(s.id);
                const nextCls = isHeldBack
                  ? s.currentClass
                  : getNextClass(s.currentClass);
                return (
                  <label
                    key={s.id}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 text-xs transition-colors ${
                      isHeldBack
                        ? "border-amber-300 bg-amber-50/70"
                        : "border-slate-100 bg-slate-50 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isHeldBack}
                        onChange={() => toggleHoldBack(s.id)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <div>
                        <p className="font-bold text-[#0F2942]">
                          {s.studentName}
                        </p>
                        <p className="text-slate-500">
                          {s.referenceId} • Father: {s.fatherName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-semibold">
                      <span className="text-slate-500">{s.currentClass}</span>
                      <span className="mx-1.5 text-amber-600">→</span>
                      <span
                        className={
                          isHeldBack ? "text-amber-700" : "text-emerald-700"
                        }
                      >
                        {nextCls}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Promotion History Log */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="font-heading flex items-center gap-2 text-base font-extrabold text-[#0F2942]">
          <History className="h-5 w-5 text-amber-600" />
          Promotion History
        </h2>
        {logs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No annual promotions have been executed yet.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
                <tr>
                  <th className="py-2.5 pr-4">Session Transition</th>
                  <th className="py-2.5 pr-4">Promoted</th>
                  <th className="py-2.5 pr-4">Passed Out</th>
                  <th className="py-2.5 pr-4">Held Back</th>
                  <th className="py-2.5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 pr-4 font-bold text-[#0F2942]">
                      {log.fromSession} → {log.toSession}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-emerald-700">
                      {log.promotedCount}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-blue-700">
                      {log.passedOutCount}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-amber-700">
                      {log.heldBackCount}
                    </td>
                    <td className="py-3 text-slate-500">
                      {new Date(log.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

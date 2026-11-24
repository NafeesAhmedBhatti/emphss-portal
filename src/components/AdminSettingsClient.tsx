"use client";

import { useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  Edit3,
  KeyRound,
  Loader2,
  Lock,
  Pin,
  Plus,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import { NOTICE_CATEGORIES } from "@/lib/constants";

interface NoticeRecord {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  isActive: boolean;
  createdAt: string;
}

interface CorrectionRecord {
  id: string;
  studentId: string;
  referenceId: string;
  studentName: string;
  fieldToCorrect: string;
  requestedValue: string;
  reason: string;
  status: string;
  createdAt: string;
}

export function AdminSettingsClient({
  initialNotices,
  hasTeacherPasscode,
  initialRegistrationOpen,
  initialCorrections,
}: {
  initialNotices: NoticeRecord[];
  hasTeacherPasscode: boolean;
  initialRegistrationOpen: boolean;
  initialCorrections: CorrectionRecord[];
}) {
  const [notices, setNotices] = useState<NoticeRecord[]>(initialNotices);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("General");
  const [expireDays, setExpireDays] = useState<number>(15);
  const [isPinned, setIsPinned] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const [teacherPasscode, setTeacherPasscode] = useState("");
  const [savingPass, setSavingPass] = useState(false);
  const [passMessage, setPassMessage] = useState("");

  const [registrationOpen, setRegistrationOpen] = useState(
    initialRegistrationOpen
  );
  const [togglingReg, setTogglingReg] = useState(false);

  const [corrections, setCorrections] =
    useState<CorrectionRecord[]>(initialCorrections);
  const [processingCorrId, setProcessingCorrId] = useState<string | null>(null);

  async function handleToggleRegistration() {
    setTogglingReg(true);
    try {
      const nextState = !registrationOpen;
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationOpen: nextState }),
      });
      if (res.ok) {
        setRegistrationOpen(nextState);
      }
    } finally {
      setTogglingReg(false);
    }
  }

  async function handleCorrectionAction(
    id: string,
    action: "Approve" | "Reject"
  ) {
    setProcessingCorrId(id);
    try {
      const res = await fetch("/api/admin/corrections", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const data = await res.json();
      if (res.ok) {
        setCorrections((prev) =>
          prev.map((c) => (c.id === id ? data.request : c))
        );
      }
    } finally {
      setProcessingCorrId(null);
    }
  }

  async function handlePublishNotice(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3 || content.trim().length < 5) return;
    setPublishing(true);
    try {
      const res = await fetch("/api/admin/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, category, isPinned, expireDays }),
      });
      const data = await res.json();
      if (res.ok) {
        setNotices((prev) => [data.notice, ...prev]);
        setTitle("");
        setContent("");
        setIsPinned(false);
      }
    } finally {
      setPublishing(false);
    }
  }

  async function handleTogglePin(notice: NoticeRecord) {
    const res = await fetch(`/api/admin/notices/${notice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPinned: !notice.isPinned }),
    });
    if (res.ok) {
      const data = await res.json();
      setNotices((prev) =>
        prev.map((n) => (n.id === notice.id ? data.notice : n))
      );
    }
  }

  async function handleDeleteNotice(id: string) {
    const res = await fetch(`/api/admin/notices/${id}`, { method: "DELETE" });
    if (res.ok) {
      setNotices((prev) => prev.filter((n) => n.id !== id));
    }
  }

  async function handleUpdatePasscode(e: React.FormEvent) {
    e.preventDefault();
    setSavingPass(true);
    setPassMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherPasscode }),
      });
      const data = await res.json();
      if (res.ok) {
        setTeacherPasscode("");
        setPassMessage(
          "Teacher Access Password updated & active teacher sessions rotated."
        );
      } else {
        setPassMessage(data.error || "Failed to update password.");
      }
    } finally {
      setSavingPass(false);
    }
  }

  const pendingCount = corrections.filter((c) => c.status === "Pending").length;

  return (
    <div className="space-y-8">
      {/* Top Row: Registration Open/Close Control & Correction Requests */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-heading flex items-center gap-2 text-lg font-bold text-[#0F2942]">
                {registrationOpen ? (
                  <Unlock className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Lock className="h-5 w-5 text-rose-600" />
                )}
                Public Student Registration
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Close public registration once all students have submitted their
                forms to prevent any outside or fake entries.
              </p>
            </div>
            <span
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                registrationOpen
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-rose-100 text-rose-800"
              }`}
            >
              {registrationOpen ? "OPEN" : "CLOSED"}
            </span>
          </div>

          <button
            type="button"
            disabled={togglingReg}
            onClick={handleToggleRegistration}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs font-bold text-white shadow-xs transition-colors ${
              registrationOpen
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {togglingReg && <Loader2 className="h-4 w-4 animate-spin" />}
            {registrationOpen
              ? "Close Public Registration"
              : "Re-Open Public Registration"}
          </button>
        </div>

        {/* Student Correction Requests */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-7">
          <h2 className="font-heading flex items-center gap-2 text-lg font-bold text-[#0F2942]">
            <Edit3 className="h-5 w-5 text-amber-600" />
            Student Correction Requests ({pendingCount} Pending)
          </h2>
          {corrections.length === 0 ? (
            <p className="mt-3 text-xs text-slate-500">
              No correction requests submitted by students yet.
            </p>
          ) : (
            <div className="mt-4 max-h-64 space-y-2.5 overflow-y-auto pr-1">
              {corrections.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs sm:flex-row sm:items-center"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-[#0F2942]">
                        {c.studentName} ({c.referenceId})
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          c.status === "Approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : c.status === "Rejected"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <p className="mt-1 text-slate-700">
                      Update <strong>{c.fieldToCorrect}</strong> →{" "}
                      <span className="font-bold text-[#0F2942]">
                        {c.requestedValue}
                      </span>
                    </p>
                    {c.reason && (
                      <p className="mt-0.5 text-slate-500">Note: {c.reason}</p>
                    )}
                  </div>

                  {c.status === "Pending" && (
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        disabled={processingCorrId === c.id}
                        onClick={() => handleCorrectionAction(c.id, "Approve")}
                        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={processingCorrId === c.id}
                        onClick={() => handleCorrectionAction(c.id, "Reject")}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50"
                      >
                        <X className="h-3.5 w-3.5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Notice Board & Teacher Password */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left: Notice Board Manager */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="font-heading flex items-center gap-2 text-lg font-bold text-[#0F2942]">
              <Bell className="h-5 w-5 text-amber-600" />
              Publish Notice to Home Page
            </h2>
            <form onSubmit={handlePublishNotice} className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Summer School Timings Effective Monday"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#0F2942]"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0F2942]"
                  >
                    {NOTICE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Auto-Delete After
                  </label>
                  <select
                    value={expireDays}
                    onChange={(e) => setExpireDays(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0F2942]"
                  >
                    <option value={7}>7 Days</option>
                    <option value={15}>15 Days (Recommended)</option>
                    <option value={30}>30 Days</option>
                    <option value={0}>Keep Until Deleted</option>
                  </select>
                </div>
                <label className="flex cursor-pointer items-center gap-2 self-end rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={(e) => setIsPinned(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Pin Notice to Top
                </label>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Notice Details *
                </label>
                <textarea
                  rows={3}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write clear announcement details for parents and students..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#0F2942]"
                />
              </div>

              <button
                type="submit"
                disabled={publishing}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0F2942] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#163B5E] disabled:opacity-60"
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 text-amber-400" />
                )}
                Publish Notice
              </button>
            </form>
          </div>

          {/* Existing Notices */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <h3 className="font-heading text-base font-bold text-[#0F2942]">
              Active Notices ({notices.length})
            </h3>
            <div className="mt-4 space-y-3">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="rounded-md bg-white px-2 py-0.5 font-bold text-[#0F2942] shadow-2xs">
                        {n.category}
                      </span>
                      {n.isPinned && (
                        <span className="font-bold text-amber-700">Pinned</span>
                      )}
                    </div>
                    <p className="mt-1.5 text-sm font-bold text-[#0F2942]">
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">{n.content}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleTogglePin(n)}
                      className={`rounded-lg border p-1.5 ${
                        n.isPinned
                          ? "border-amber-300 bg-amber-50 text-amber-700"
                          : "border-slate-200 bg-white text-slate-500"
                      }`}
                      title="Toggle Pin"
                    >
                      <Pin className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteNotice(n.id)}
                      className="rounded-lg border border-slate-200 bg-white p-1.5 text-rose-600 hover:bg-rose-50"
                      title="Delete Notice"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Teacher Access Password Manager */}
        <div className="lg:col-span-5">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <h2 className="font-heading flex items-center gap-2 text-lg font-bold text-[#0F2942]">
              <KeyRound className="h-5 w-5 text-amber-600" />
              Teacher Portal Access Password
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Share this password in your personal staff WhatsApp group so
              teachers can sign in at <strong>/login</strong> and enter their
              details.
            </p>

            <form onSubmit={handleUpdatePasscode} className="mt-5 space-y-3.5">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
                Status:{" "}
                <strong className="text-emerald-700">
                  {hasTeacherPasscode
                    ? "Active & Encrypted (hidden for security)"
                    : "Not Configured"}
                </strong>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Set New Staff Access Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  maxLength={128}
                  placeholder="Enter new teacher passcode (min 6 chars)"
                  value={teacherPasscode}
                  onChange={(e) => setTeacherPasscode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-mono text-sm font-bold text-[#0F2942] outline-none focus:border-[#0F2942]"
                />
              </div>

              {passMessage && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{passMessage}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={savingPass}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F2942] px-5 py-3 text-xs font-bold text-white hover:bg-[#163B5E] disabled:opacity-60"
              >
                {savingPass && <Loader2 className="h-4 w-4 animate-spin" />}
                Update Teacher Password
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

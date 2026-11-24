"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  Loader2,
  LogOut,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { IdCardPreview } from "@/components/IdCardPreview";
import { DobPicker } from "@/components/DobPicker";

interface StudentProfile {
  id: string;
  referenceId: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  gender: string;
  dateOfBirth: string;
  mobileNumber: string;
  currentClass: string;
  academicYear: string;
  address: string;
  transportMode: string;
  vehicleRoute: string | null;
  photoData: string | null;
  status: string;
}

interface CorrectionReqItem {
  id: string;
  fieldToCorrect: string;
  requestedValue: string;
  reason: string;
  status: string;
  createdAt: string;
}

const CORRECTION_FIELDS = [
  { value: "studentName", label: "Student Name" },
  { value: "fatherName", label: "Father's Name" },
  { value: "motherName", label: "Mother's Name" },
  { value: "dateOfBirth", label: "Date of Birth (YYYY-MM-DD)" },
  { value: "mobileNumber", label: "Mobile Number" },
  { value: "address", label: "Village / Address" },
  { value: "Other", label: "Other Detail" },
];

export function StudentPortalClient() {
  const router = useRouter();
  const [initializing, setInitializing] = useState(true);
  const [referenceId, setReferenceId] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [motherName, setMotherName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [student, setStudent] = useState<StudentProfile | null>(null);

  // Correction Request state
  const [showCorrection, setShowCorrection] = useState(false);
  const [fieldToCorrect, setFieldToCorrect] = useState("studentName");
  const [requestedValue, setRequestedValue] = useState("");
  const [reason, setReason] = useState("");
  const [submittingCorr, setSubmittingCorr] = useState(false);
  const [corrMsg, setCorrMsg] = useState("");
  const [corrections, setCorrections] = useState<CorrectionReqItem[]>([]);

  useEffect(() => {
    let active = true;
    fetch("/api/students/me")
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data.student) {
          setStudent(data.student);
          if (Array.isArray(data.corrections)) {
            setCorrections(data.corrections);
          }
        }
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/students/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referenceId,
          dateOfBirth,
          mobileNumber,
          motherName,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to find your student profile.");
        setLoading(false);
        return;
      }

      setStudent(data.student);
      router.refresh();
      const cRes = await fetch("/api/students/correction");
      if (cRes.ok) {
        const cData = await cRes.json();
        setCorrections(cData.requests || []);
      }
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoutStudent() {
    await fetch("/api/students/lookup", { method: "DELETE" });
    setStudent(null);
    setCorrections([]);
    setReferenceId("");
    setDateOfBirth("");
    setMobileNumber("");
    setMotherName("");
    router.refresh();
  }

  async function handleCorrectionSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmittingCorr(true);
    setCorrMsg("");
    try {
      const res = await fetch("/api/students/correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldToCorrect, requestedValue, reason }),
      });
      const data = await res.json();
      if (res.ok) {
        setCorrections((prev) => [data.request, ...prev]);
        setRequestedValue("");
        setReason("");
        setShowCorrection(false);
        setCorrMsg("Correction request submitted to School Admin.");
      } else {
        setCorrMsg(data.error || "Unable to submit request.");
      }
    } finally {
      setSubmittingCorr(false);
    }
  }

  if (initializing) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#0F2942]" />
        Loading Student Portal...
      </div>
    );
  }

  if (student) {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <div className="no-print flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {student.photoData && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={student.photoData}
                alt={student.studentName}
                className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 object-cover"
              />
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 uppercase">
                Active Student • {student.referenceId}
              </p>
              <p className="font-heading truncate text-base font-bold text-[#0F2942]">
                {student.studentName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowCorrection((prev) => !prev);
                setCorrMsg("");
              }}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100"
            >
              <Edit3 className="h-3.5 w-3.5 shrink-0" />
              <span>Correction</span>
            </button>
            <button
              type="button"
              onClick={handleLogoutStudent}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              <LogOut className="h-3.5 w-3.5 shrink-0" />
              <span>Switch ID</span>
            </button>
          </div>
        </div>

        {corrMsg && (
          <div className="no-print flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{corrMsg}</span>
          </div>
        )}

        {showCorrection && (
          <form
            onSubmit={handleCorrectionSubmit}
            className="no-print space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
          >
            <h2 className="font-heading text-base font-bold text-[#0F2942]">
              Request Profile Correction
            </h2>
            <p className="text-xs text-slate-500">
              Your request will be sent to the School Admin for review and
              approval.
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Field to Correct *
                </label>
                <select
                  value={fieldToCorrect}
                  onChange={(e) => setFieldToCorrect(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold outline-none focus:border-[#0F2942]"
                >
                  {CORRECTION_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Correct Detail *
                </label>
                <input
                  type="text"
                  required
                  value={requestedValue}
                  onChange={(e) => setRequestedValue(e.target.value)}
                  placeholder="Enter the exact correct value"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#0F2942]"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Reason / Note (Optional)
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Brief note for school office"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs outline-none focus:border-[#0F2942]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCorrection(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingCorr}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2942] px-4 py-2 text-xs font-bold text-white"
              >
                {submittingCorr && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Submit Request
              </button>
            </div>
          </form>
        )}

        {student.status === "Pending" ? (
          <div className="rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-sm sm:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <Clock className="h-6 w-6" />
            </div>
            <h2 className="font-heading mt-3 text-lg font-bold text-[#0F2942]">
              Pending Verification by Class {student.currentClass} Form Teacher
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-600 sm:text-sm">
              Your registration (<strong>{student.referenceId}</strong>) has
              been received. Once your Class Form Teacher verifies and approves
              your details, your official downloadable{" "}
              <strong>EMPHSS Student ID Card</strong> will appear right here.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#0F2942] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#163B5E]"
            >
              <RefreshCw className="h-3.5 w-3.5 text-amber-400" />
              Check Approval Status
            </button>
          </div>
        ) : (
          <IdCardPreview
            card={{
              type: "student",
              idNumber: student.referenceId,
              name: student.studentName,
              photoData: student.photoData,
              primaryBadge: `Class: ${student.currentClass}`,
              sessionOrRole: `Session ${student.academicYear}`,
              fields: [
                { label: "Father's Name", value: student.fatherName },
                { label: "Mother's Name", value: student.motherName },
                {
                  label: "Date of Birth",
                  value: `${student.dateOfBirth} (${student.gender})`,
                },
                { label: "Mobile Number", value: student.mobileNumber },
                { label: "Address", value: student.address },
                {
                  label: "Transport",
                  value:
                    student.transportMode === "School Transport"
                      ? `${student.vehicleRoute}`
                      : "Local",
                },
              ],
            }}
          />
        )}

        {corrections.length > 0 && (
          <div className="no-print rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <h3 className="font-heading text-xs font-bold text-[#0F2942] uppercase">
              Your Correction Requests
            </h3>
            <div className="mt-2.5 space-y-2">
              {corrections.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-[#0F2942]">
                      {c.fieldToCorrect}:
                    </span>{" "}
                    <span className="text-slate-700">{c.requestedValue}</span>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
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
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">
        <div className="bg-gradient-to-r from-[#0F2942] to-[#173E63] px-6 py-6 text-center text-white">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-[#0F2942] shadow-md">
            <CreditCard className="h-7 w-7" />
          </div>
          <h1 className="font-heading mt-3 text-xl font-bold">
            Student Profile &amp; ID Card
          </h1>
          <p className="mt-1 text-xs text-slate-300">
            Verify your identity using 4 details to view and download your
            official EMPHSS ID Card.
          </p>
        </div>

        <form onSubmit={handleLookup} className="space-y-3.5 p-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
            Protected by 4-Factor Student Privacy Verification
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Student ID *
            </label>
            <input
              type="text"
              required
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value.toUpperCase())}
              placeholder="e.g., EMPHSS-001"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-semibold tracking-wide text-[#0F2942] uppercase outline-none focus:border-[#0F2942]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Date of Birth (DD / MM / YYYY) *
            </label>
            <DobPicker
              value={dateOfBirth}
              onChange={(val) => setDateOfBirth(val)}
              compact
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Parent&apos;s 10-Digit Mobile Number *
            </label>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              required
              value={mobileNumber}
              onChange={(e) =>
                setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="Registered 10-digit mobile"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0F2942]"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-700">
              Mother&apos;s Name *
            </label>
            <input
              type="text"
              required
              value={motherName}
              onChange={(e) => setMotherName(e.target.value.toUpperCase())}
              placeholder="Registered mother's name"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm uppercase text-slate-900 outline-none focus:border-[#0F2942]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F2942] px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-[#163B5E] disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 text-amber-400" />
                View My Profile &amp; ID Card
              </>
            )}
          </button>

          <div className="border-t border-slate-100 pt-3 text-center text-xs text-slate-500">
            Haven&apos;t registered yet?{" "}
            <Link
              href="/register"
              className="inline-flex items-center gap-1 font-bold text-[#0F2942] hover:underline"
            >
              Fill Student Form
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

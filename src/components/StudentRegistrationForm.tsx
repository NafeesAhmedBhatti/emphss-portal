"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Bus,
  Camera,
  CheckCircle2,
  Home,
  Loader2,
  MapPin,
  Phone,
  ShieldAlert,
  User,
  UserCheck,
} from "lucide-react";
import {
  CLASS_ORDER,
  GENDER_OPTIONS,
  TRANSPORT_ROUTES,
  getSubjectsForClass,
} from "@/lib/constants";
import { compressStudentPhoto } from "@/lib/image-utils";
import { DobPicker } from "@/components/DobPicker";

interface FormState {
  studentName: string;
  fatherName: string;
  motherName: string;
  gender: string;
  dateOfBirth: string;
  mobileNumber: string;
  currentClass: string;
  address: string;
  transportMode: "Local" | "School Transport" | "";
  vehicleRoute: string;
  subjects: string[];
  photoData: string;
  parentConsent: boolean;
}

interface SubmittedStudent {
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
  createdAt: string;
}

const INITIAL_FORM: FormState = {
  studentName: "",
  fatherName: "",
  motherName: "",
  gender: "",
  dateOfBirth: "",
  mobileNumber: "",
  currentClass: "",
  address: "",
  transportMode: "",
  vehicleRoute: "",
  subjects: [],
  photoData: "",
  parentConsent: false,
};

export function StudentRegistrationForm({
  currentSession,
}: {
  currentSession: string;
}) {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [error, setError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedStudent, setSubmittedStudent] =
    useState<SubmittedStudent | null>(null);

  const updateField = <K extends keyof FormState>(
    key: K,
    value: FormState[K]
  ) => {
    const upperKeys = new Set([
      "studentName",
      "fatherName",
      "motherName",
      "address",
      "vehicleRoute",
    ]);
    const finalVal =
      typeof value === "string" && upperKeys.has(key as string)
        ? (value.toUpperCase() as FormState[K])
        : value;
    setForm((prev) => ({ ...prev, [key]: finalVal }));
    if (error) setError("");
  };

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setPhotoLoading(true);
    try {
      const compressed = await compressStudentPhoto(file);
      updateField("photoData", compressed);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process the selected photo."
      );
    } finally {
      setPhotoLoading(false);
    }
  }

  function validateForm(): string | null {
    if (!form.photoData) return "Please upload a student photograph.";
    if (form.studentName.trim().length < 2)
      return "Please enter the student's full name.";
    if (!form.currentClass) return "Please select the student's class.";
    if (form.subjects.length === 0)
      return "Please select at least one subject for your class.";
    if (!form.gender) return "Please select the student's gender.";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.dateOfBirth))
      return "Please select complete Day, Month, and Year for Date of Birth.";
    if (form.fatherName.trim().length < 2)
      return "Please enter the father's name.";
    if (form.motherName.trim().length < 2)
      return "Please enter the mother's name.";
    const digits = form.mobileNumber.replace(/\D/g, "");
    if (digits.length !== 10)
      return "Please enter a valid 10-digit mobile number.";
    if (form.address.trim().length < 2)
      return "Please enter the student's village or residential address.";
    if (!form.transportMode)
      return "Please select the mode of transport (Local or School Transport).";
    if (
      form.transportMode === "School Transport" &&
      form.vehicleRoute.trim().length < 2
    ) {
      return "Please enter the school bus/van route or stop name.";
    }
    if (!form.parentConsent) {
      return "Please confirm parent or guardian consent before submitting.";
    }
    return null;
  }

  function handleOpenPreview(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setError("");
    setShowConfirmModal(true);
  }

  async function handleFinalSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          subjects: form.subjects.join(", "),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShowConfirmModal(false);
        setError(data.error || "Unable to submit form. Please try again.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      setShowConfirmModal(false);
      setSubmittedStudent(data.student);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setShowConfirmModal(false);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  // Post-Submit Student Profile Receipt Card
  if (submittedStudent) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="no-print flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-amber-600" />
          <div className="text-sm">
            <p className="font-bold">
              Form Submitted — Pending Form Teacher Verification!
            </p>
            <p className="mt-0.5 text-amber-900">
              Your <strong>Student ID</strong> is{" "}
              <strong className="underline">{submittedStudent.referenceId}</strong>.
              Please save a screenshot of this ID. Once your Class{" "}
              {submittedStudent.currentClass} Form Teacher approves your record,
              your official ID Card will be ready to download at{" "}
              <Link href="/student" className="font-bold underline">
                My ID Card
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">
              Pending Teacher Approval
            </span>
            <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Your Student Reference ID
            </p>
            <p className="font-heading mt-1 text-3xl font-extrabold tracking-wide text-[#0F2942] sm:text-4xl">
              {submittedStudent.referenceId}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Please write down or screenshot this Reference ID.
            </p>
          </div>

          <dl className="mt-6 grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-xs sm:text-sm">
            <div>
              <dt className="text-slate-500">Student Name</dt>
              <dd className="font-bold text-[#0F2942]">
                {submittedStudent.studentName}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Class &amp; Session</dt>
              <dd className="font-bold text-[#0F2942]">
                {submittedStudent.currentClass} ({submittedStudent.academicYear})
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-slate-500">Father&apos;s Name</dt>
              <dd className="font-bold text-[#0F2942]">
                {submittedStudent.fatherName}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex justify-center">
            <Link
              href="/student"
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F2942] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#163B5E]"
            >
              Check Status at My ID Card
            </Link>
          </div>
        </div>

        <p className="no-print rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-center text-xs text-amber-900">
          Note: If any correction is needed later, please share your{" "}
          <strong>{submittedStudent.referenceId}</strong> with the school office
          (Admin).
        </p>

        <div className="no-print flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSubmittedStudent(null);
              setForm(INITIAL_FORM);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Register Another Student
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-slate-600 hover:text-[#0F2942]"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={handleOpenPreview}
        className="mx-auto max-w-2xl space-y-6"
        noValidate
      >
        {error && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-xs">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <p className="font-bold">Please Check</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Section 1: Student Photo Upload */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
          <div className="flex flex-col items-center gap-5 sm:flex-row">
            <label
              htmlFor="student-photo"
              className="group relative flex h-32 w-32 shrink-0 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-[#0F2942] hover:bg-slate-100"
            >
              {photoLoading ? (
                <Loader2 className="h-7 w-7 animate-spin text-[#0F2942]" />
              ) : form.photoData ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.photoData}
                  alt="Student preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center p-2 text-center text-slate-500">
                  <Camera className="h-8 w-8 text-[#0F2942]" />
                  <span className="mt-1.5 text-xs font-semibold">
                    Tap to Upload Photo
                  </span>
                </div>
              )}
              <input
                id="student-photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="sr-only"
              />
            </label>

            <div className="text-center sm:text-left">
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                Session {currentSession}
              </span>
              <h2 className="font-heading mt-1.5 text-lg font-extrabold text-[#0F2942]">
                Upload Student Photograph *
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
                Please upload a clear passport-size or recent photo of the
                student. It will appear on the Digital Profile Card.
              </p>
              <label
                htmlFor="student-photo"
                className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-[#0F2942] shadow-xs hover:bg-slate-50"
              >
                <Camera className="h-4 w-4 text-amber-600" />
                {form.photoData ? "Change Photo" : "Choose Photo"}
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Student & Family Details */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
          <h2 className="font-heading flex items-center gap-2 text-lg font-extrabold text-[#0F2942]">
            <User className="h-5 w-5 text-amber-600" />
            Student &amp; Family Details
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Please enter all names and details accurately in English.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Student&apos;s Full Name *
              </label>
              <input
                type="text"
                value={form.studentName}
                onChange={(e) => updateField("studentName", e.target.value)}
                placeholder="Enter student's full name"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition-all focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Class *
              </label>
              <select
                value={form.currentClass}
                onChange={(e) => {
                  const cls = e.target.value;
                  const classSubjects = getSubjectsForClass(cls);
                  const autoSelectAll =
                    cls !== "11th" && cls !== "12th" ? classSubjects : [];
                  setForm((prev) => ({
                    ...prev,
                    currentClass: cls,
                    subjects: autoSelectAll,
                  }));
                  if (error) setError("");
                }}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition-all focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
              >
                <option value="">-- Select Class --</option>
                {CLASS_ORDER.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>

            {form.currentClass && (
              <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                <label className="mb-1.5 block text-sm font-semibold text-[#0F2942]">
                  Subjects for Class {form.currentClass} *
                </label>
                <p className="mb-2.5 text-xs text-slate-500">
                  {form.currentClass === "11th" || form.currentClass === "12th"
                    ? "Select all subjects chosen by the student."
                    : "All standard subjects for this class are pre-selected (tap to adjust if needed)."}
                </p>
                <div className="flex flex-wrap gap-2">
                  {getSubjectsForClass(form.currentClass).map((sub) => {
                    const checked = form.subjects.includes(sub);
                    return (
                      <button
                        key={sub}
                        type="button"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            subjects: checked
                              ? prev.subjects.filter((s) => s !== sub)
                              : [...prev.subjects, sub],
                          }));
                        }}
                        className={`rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                          checked
                            ? "border-[#0F2942] bg-[#0F2942] text-white"
                            : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Date of Birth (DD / MM / YYYY) *
              </label>
              <DobPicker
                value={form.dateOfBirth}
                onChange={(val) => updateField("dateOfBirth", val)}
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Gender *
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => updateField("gender", g)}
                    className={`rounded-xl border px-3 py-3 text-sm font-bold transition-all ${
                      form.gender === g
                        ? "border-[#0F2942] bg-[#0F2942] text-white shadow-sm"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Father&apos;s Name *
              </label>
              <input
                type="text"
                value={form.fatherName}
                onChange={(e) => updateField("fatherName", e.target.value)}
                placeholder="Enter father's full name"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition-all focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Mother&apos;s Name *
              </label>
              <input
                type="text"
                value={form.motherName}
                onChange={(e) => updateField("motherName", e.target.value)}
                placeholder="Enter mother's full name"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition-all focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Phone className="h-4 w-4 text-slate-400" />
                Parent&apos;s Mobile Number *
              </label>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={form.mobileNumber}
                onChange={(e) =>
                  updateField(
                    "mobileNumber",
                    e.target.value.replace(/\D/g, "").slice(0, 10)
                  )
                }
                placeholder="Enter 10-digit mobile number"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base tracking-wide text-slate-900 outline-none transition-all focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Address & Transport */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-7">
          <h2 className="font-heading flex items-center gap-2 text-lg font-extrabold text-[#0F2942]">
            <MapPin className="h-5 w-5 text-amber-600" />
            Address &amp; Transport Details
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                Village / Locality / Residential Address *
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                placeholder="e.g., Bawli / Nearby Village Name"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition-all focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Mode of Transport *
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    updateField("transportMode", "Local");
                    updateField("vehicleRoute", "");
                  }}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                    form.transportMode === "Local"
                      ? "border-[#0F2942] bg-[#0F2942] text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      form.transportMode === "Local"
                        ? "bg-white/15 text-amber-300"
                        : "bg-slate-100 text-[#0F2942]"
                    }`}
                  >
                    <Home className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Local</p>
                    <p
                      className={`text-xs ${
                        form.transportMode === "Local"
                          ? "text-slate-200"
                          : "text-slate-500"
                      }`}
                    >
                      Self / Walking / Cycle
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateField("transportMode", "School Transport")}
                  className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                    form.transportMode === "School Transport"
                      ? "border-[#0F2942] bg-[#0F2942] text-white shadow-sm"
                      : "border-slate-300 bg-white text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      form.transportMode === "School Transport"
                        ? "bg-white/15 text-amber-300"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    <Bus className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">School Transport</p>
                    <p
                      className={`text-xs ${
                        form.transportMode === "School Transport"
                          ? "text-slate-200"
                          : "text-slate-500"
                      }`}
                    >
                      School Van / Bus
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {form.transportMode === "School Transport" && (
              <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">
                <label className="block text-sm font-semibold text-[#0F2942]">
                  Select Your Bus / Van Stop (Route) *
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {TRANSPORT_ROUTES.map((route) => {
                    const selected = form.vehicleRoute === route;
                    return (
                      <button
                        key={route}
                        type="button"
                        onClick={() => updateField("vehicleRoute", route)}
                        className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition-all ${
                          selected
                            ? "border-[#0F2942] bg-[#0F2942] text-amber-300 shadow-xs"
                            : "border-amber-200 bg-white text-[#0F2942] hover:border-[#0F2942]/40 hover:bg-amber-50"
                        }`}
                      >
                        {route}
                      </button>
                    );
                  })}
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">
                    Or type another stop name if not listed above
                  </label>
                  <input
                    type="text"
                    value={form.vehicleRoute}
                    onChange={(e) => updateField("vehicleRoute", e.target.value)}
                    placeholder="Select a route above or type stop name"
                    className="w-full rounded-xl border border-amber-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Parent Consent & Privacy Notice */}
        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs sm:p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.parentConsent}
              onChange={(e) => updateField("parentConsent", e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 rounded border-slate-300 text-[#0F2942] focus:ring-[#0F2942]"
            />
            <span className="text-xs leading-relaxed text-slate-600 sm:text-sm">
              <strong className="text-[#0F2942]">
                Parent / Guardian Consent:
              </strong>{" "}
              I confirm that I am the parent or legal guardian of this student
              and consent to EMPHSS Bawli collecting these details and
              photograph for school registration, Digital ID card generation,
              transport coordination, and academic records. Corrections can be
              requested via <strong>My ID Card</strong>, and record deletion can
              be requested through the school office.
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Home Page
          </Link>
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2942] px-7 py-4 text-base font-bold text-white shadow-lg shadow-[#0F2942]/20 transition-all hover:bg-[#163B5E] active:scale-[0.99]"
          >
            <UserCheck className="h-5 w-5 text-amber-400" />
            Review &amp; Submit Form
          </button>
        </div>
      </form>

      {/* Pre-Submit Confirmation Pop-up Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950">
              <ShieldAlert className="mt-0.5 h-6 w-6 shrink-0 text-amber-600" />
              <div className="text-xs leading-relaxed sm:text-sm">
                <p className="font-bold">
                  Please Review All Details Carefully Before Submitting
                </p>
                <p className="mt-0.5 text-amber-800">
                  Ensure the student&apos;s name, parents&apos; names, class,
                  and mobile number are spelled correctly.{" "}
                  <strong>
                    Once submitted, you will not be able to edit these details
                    yourself.
                  </strong>
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-4 border-b border-slate-100 pb-4">
              {form.photoData && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.photoData}
                  alt="Preview"
                  className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
                />
              )}
              <div>
                <span className="rounded-md bg-[#0F2942] px-2.5 py-0.5 text-xs font-bold text-amber-300">
                  Class {form.currentClass}
                </span>
                <h3 className="font-heading mt-1 text-lg font-extrabold text-[#0F2942]">
                  {form.studentName}
                </h3>
                <p className="text-xs text-slate-500">
                  {form.gender} • DOB: {form.dateOfBirth}
                </p>
              </div>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <dt className="text-slate-500">Father&apos;s Name</dt>
                <dd className="font-semibold text-slate-900">
                  {form.fatherName}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Mother&apos;s Name</dt>
                <dd className="font-semibold text-slate-900">
                  {form.motherName}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Mobile Number</dt>
                <dd className="font-semibold text-slate-900">
                  {form.mobileNumber}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Address / Village</dt>
                <dd className="font-semibold text-slate-900">{form.address}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-slate-500">Mode of Transport</dt>
                <dd className="font-semibold text-slate-900">
                  {form.transportMode === "School Transport"
                    ? `School Transport (${form.vehicleRoute})`
                    : "Local (Self / Walking / Cycle)"}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={submitting}
                onClick={() => setShowConfirmModal(false)}
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                ← Back to Edit
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleFinalSubmit}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Confirm &amp; Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

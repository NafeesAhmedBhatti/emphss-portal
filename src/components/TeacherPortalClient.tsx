"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Camera,
  Check,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  GraduationCap,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  Pencil,
  Phone,
  Search,
  Trash2,
  User,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { CLASS_ORDER } from "@/lib/constants";
import { compressStudentPhoto } from "@/lib/image-utils";
import { IdCardPreview } from "@/components/IdCardPreview";
import { AwardRollClient } from "@/components/AwardRollClient";

export interface TeacherRecord {
  id: string;
  teacherCode: string;
  fullName: string;
  fatherName: string;
  motherName: string;
  address: string;
  mobileNumber: string;
  qualification: string;
  classesTaught: string;
  formTeacherClass: string | null;
  subjects: string;
  roleSummary: string;
  photoData: string | null;
  hasPin?: boolean;
  hasEnrollmentCode?: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface PendingStudentItem {
  id: string;
  referenceId: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  currentClass: string;
  gender: string;
  dateOfBirth: string;
  mobileNumber: string;
  address: string;
  transportMode: string;
  vehicleRoute: string | null;
  photoData: string | null;
}

export interface TeacherStudentLookupItem {
  id: string;
  referenceId: string;
  studentName: string;
  fatherName: string;
  motherName: string;
  currentClass: string;
  gender: string;
  mobileNumber: string;
  address: string;
  transportMode: string;
  vehicleRoute: string | null;
  photoData: string | null;
}

interface TeacherFormState {
  fullName: string;
  fatherName: string;
  motherName: string;
  address: string;
  mobileNumber: string;
  qualification: string;
  selectedClasses: string[];
  formTeacherClass: string;
  subjects: string;
  roleSummary: string;
  photoData: string;
  pin: string;
}

const EMPTY_FORM: TeacherFormState = {
  fullName: "",
  fatherName: "",
  motherName: "",
  address: "",
  mobileNumber: "",
  qualification: "",
  selectedClasses: [],
  formTeacherClass: "None",
  subjects: "",
  roleSummary: "",
  photoData: "",
  pin: "",
};

export function TeacherPortalClient({
  initialTeachers,
  students: initialActiveStudents = [],
  initialPendingStudents = [],
  role,
  initialVerifiedTeacherId = "",
}: {
  initialTeachers: TeacherRecord[];
  students?: TeacherStudentLookupItem[];
  initialPendingStudents?: PendingStudentItem[];
  role: "teacher" | "admin";
  initialVerifiedTeacherId?: string;
}) {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "approvals" | "students" | "award-roll" | "faculty"
  >("profile");
  const [students, setStudents] = useState<TeacherStudentLookupItem[]>(
    initialActiveStudents
  );
  const [pendingStudents, setPendingStudents] = useState<PendingStudentItem[]>(
    initialPendingStudents
  );
  const [approvalBusyId, setApprovalBusyId] = useState<string | null>(null);
  const [teachers, setTeachers] = useState<TeacherRecord[]>(initialTeachers);
  const [form, setForm] = useState<TeacherFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState<boolean>(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [idCardTeacher, setIdCardTeacher] = useState<TeacherRecord | null>(
    null
  );

  const [verifiedTeacherId, setVerifiedTeacherId] = useState<string>(
    initialVerifiedTeacherId
  );
  const [pinPrompt, setPinPrompt] = useState<{
    teacher: TeacherRecord;
    pinInput: string;
    enrollmentCodeInput: string;
    error: string;
    busy: boolean;
  } | null>(null);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(() => {
    if (initialVerifiedTeacherId) return initialVerifiedTeacherId;
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("emphss_active_teacher_id") || "";
    }
    return "";
  });
  const [studentQuery, setStudentQuery] = useState("");
  const [studentClassFilter, setStudentClassFilter] = useState("MyClasses");

  const activeTeacher = useMemo(
    () => teachers.find((t) => t.id === selectedTeacherId) ?? teachers[0] ?? null,
    [teachers, selectedTeacherId]
  );

  function selectActiveTeacher(id: string) {
    const target = teachers.find((t) => t.id === id);
    if (!target) return;

    if (role === "admin" || id === verifiedTeacherId) {
      setSelectedTeacherId(id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("emphss_active_teacher_id", id);
      }
      if (role === "admin") {
        fetch("/api/auth/teacher-identity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacherId: id }),
        }).catch(() => {});
      }
      return;
    }

    // Require PIN (or Admin-issued Enrollment Code + new PIN) before switching
    setPinPrompt({
      teacher: target,
      pinInput: "",
      enrollmentCodeInput: "",
      error: "",
      busy: false,
    });
  }

  async function handleConfirmPin(e: React.FormEvent) {
    e.preventDefault();
    if (!pinPrompt) return;
    const val = pinPrompt.pinInput.trim();
    const enroll = pinPrompt.enrollmentCodeInput.trim().toUpperCase();
    if (val.length < 4) {
      setPinPrompt((p) =>
        p ? { ...p, error: "Please enter at least 4 characters." } : null
      );
      return;
    }
    if (!pinPrompt.teacher.hasPin && !enroll) {
      setPinPrompt((p) =>
        p
          ? {
              ...p,
              error: "Please enter the single-use Enrollment Code from Admin.",
            }
          : null
      );
      return;
    }

    setPinPrompt((p) => (p ? { ...p, busy: true, error: "" } : null));
    try {
      const payload = pinPrompt.teacher.hasPin
        ? { teacherId: pinPrompt.teacher.id, pin: val }
        : {
            teacherId: pinPrompt.teacher.id,
            enrollmentCode: enroll,
            newPin: val,
          };
      const res = await fetch("/api/auth/teacher-identity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinPrompt((p) =>
          p
            ? {
                ...p,
                busy: false,
                error: data.error || "Unable to verify Teacher PIN.",
              }
            : null
        );
        return;
      }

      const verifiedId = pinPrompt.teacher.id;
      setTeachers((prev) =>
        prev.map((t) => (t.id === verifiedId ? { ...t, hasPin: true } : t))
      );
      setVerifiedTeacherId(verifiedId);
      setSelectedTeacherId(verifiedId);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("emphss_active_teacher_id", verifiedId);
      }
      setPinPrompt(null);
      router.refresh();
    } catch {
      setPinPrompt((p) =>
        p ? { ...p, busy: false, error: "Network error. Please try again." } : null
      );
    }
  }

  const assignedClassSet = useMemo(() => {
    if (!activeTeacher) return new Set<string>();
    return new Set(
      activeTeacher.classesTaught
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean)
    );
  }, [activeTeacher]);

  const filteredStudents = useMemo(() => {
    const q = studentQuery.trim().toLowerCase();
    return students.filter((s) => {
      // When searching by name, ID, father name, or mobile, search across ALL classes
      if (q) {
        const matchesSearch =
          s.studentName.toLowerCase().includes(q) ||
          s.referenceId.toLowerCase().includes(q) ||
          s.fatherName.toLowerCase().includes(q) ||
          s.mobileNumber.includes(q);
        if (!matchesSearch) return false;
        if (
          studentClassFilter !== "MyClasses" &&
          studentClassFilter !== "All" &&
          s.currentClass !== studentClassFilter
        ) {
          return false;
        }
        return true;
      }

      // Default view: show only students from the teacher's assigned classes
      if (studentClassFilter === "MyClasses") {
        if (assignedClassSet.size === 0) return false;
        return assignedClassSet.has(s.currentClass);
      }

      if (studentClassFilter !== "All" && s.currentClass !== studentClassFilter) {
        return false;
      }
      return true;
    });
  }, [students, studentQuery, studentClassFilter, assignedClassSet]);

  function toggleClass(cls: string) {
    setForm((prev) => {
      const exists = prev.selectedClasses.includes(cls);
      return {
        ...prev,
        selectedClasses: exists
          ? prev.selectedClasses.filter((c) => c !== cls)
          : [...prev.selectedClasses, cls],
      };
    });
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    setError("");
    try {
      const compressed = await compressStudentPhoto(file, 360, 0.8);
      setForm((prev) => ({ ...prev, photoData: compressed }));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process the photo."
      );
    } finally {
      setPhotoLoading(false);
    }
  }

  function startEdit(teacher: TeacherRecord) {
    setEditingId(teacher.id);
    setActiveTab("profile");
    setError("");
    setSuccess("");
    setForm({
      fullName: teacher.fullName,
      fatherName: teacher.fatherName || "",
      motherName: teacher.motherName || "",
      address: teacher.address || "",
      mobileNumber: teacher.mobileNumber,
      qualification: teacher.qualification,
      selectedClasses: teacher.classesTaught
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      formTeacherClass: teacher.formTeacherClass || "None",
      subjects: teacher.subjects,
      roleSummary: teacher.roleSummary,
      photoData: teacher.photoData || "",
      pin: "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setCreatingNew(false);
    setForm(EMPTY_FORM);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.fullName.trim().length < 2) {
      setError("Please enter the teacher's full name.");
      return;
    }
    if (form.fatherName.trim().length < 2) {
      setError("Please enter father's name.");
      return;
    }
    if (form.motherName.trim().length < 2) {
      setError("Please enter mother's name.");
      return;
    }
    if (form.address.trim().length < 2) {
      setError("Please enter residential address / village.");
      return;
    }
    if (!/^\d{10}$/.test(form.mobileNumber.replace(/\D/g, ""))) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (form.qualification.trim().length < 2) {
      setError("Please enter highest qualification (e.g., M.Sc., B.Ed.).");
      return;
    }
    if (form.selectedClasses.length === 0) {
      setError("Please select at least one class taught.");
      return;
    }
    if (form.subjects.trim().length < 2) {
      setError("Please enter the subjects taught.");
      return;
    }
    if (form.roleSummary.trim().length < 2) {
      setError("Please enter a brief role or responsibility description.");
      return;
    }

    if (!editingId && role === "teacher" && form.pin.trim().length < 4) {
      setError("Please set a Personal Teacher PIN (4–32 characters).");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        fatherName: form.fatherName.trim(),
        motherName: form.motherName.trim(),
        address: form.address.trim(),
        mobileNumber: form.mobileNumber.replace(/\D/g, ""),
        qualification: form.qualification.trim(),
        classesTaught: form.selectedClasses.join(", "),
        formTeacherClass: form.formTeacherClass,
        subjects: form.subjects.trim(),
        roleSummary: form.roleSummary.trim(),
        photoData: form.photoData,
        ...(form.pin.trim() ? { pin: form.pin.trim() } : {}),
      };

      const url = editingId ? `/api/teachers/${editingId}` : "/api/teachers";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save teacher profile.");
        setSaving(false);
        return;
      }

      if (editingId) {
        setTeachers((prev) =>
          prev.map((t) => (t.id === editingId ? data.teacher : t))
        );
        setSuccess("Teacher profile updated successfully.");
        setEditingId(null);
      } else {
        setTeachers((prev) => [data.teacher, ...prev]);
        setSelectedTeacherId(data.teacher.id);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("emphss_active_teacher_id", data.teacher.id);
        }
        setCreatingNew(false);
        setSuccess(
          `Teacher profile created! Your Teacher ID is ${data.teacher.teacherCode}.`
        );
      }
      setForm(EMPTY_FORM);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const pendingForMyClass = useMemo(() => {
    if (!activeTeacher?.formTeacherClass) return [];
    return pendingStudents.filter(
      (p) => p.currentClass === activeTeacher.formTeacherClass
    );
  }, [pendingStudents, activeTeacher]);

  async function handleApprovalAction(
    action: "approve" | "approve_all" | "reject",
    studentId?: string
  ) {
    if (!activeTeacher?.formTeacherClass) return;
    if (
      action === "reject" &&
      !window.confirm("Delete this unverified/fake student entry permanently?")
    ) {
      return;
    }
    setApprovalBusyId(studentId || "all");
    try {
      const res = await fetch("/api/teacher/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          studentId,
          className: activeTeacher.formTeacherClass,
        }),
      });
      if (res.ok) {
        if (action === "approve_all") {
          const toApprove = pendingStudents.filter(
            (p) => p.currentClass === activeTeacher.formTeacherClass
          );
          setPendingStudents((prev) =>
            prev.filter((p) => p.currentClass !== activeTeacher.formTeacherClass)
          );
          setStudents((prev) => [...toApprove, ...prev]);
        } else if (action === "approve" && studentId) {
          const target = pendingStudents.find((p) => p.id === studentId);
          setPendingStudents((prev) => prev.filter((p) => p.id !== studentId));
          if (target) {
            setStudents((prev) => [target, ...prev]);
          }
        } else if (action === "reject" && studentId) {
          setPendingStudents((prev) => prev.filter((p) => p.id !== studentId));
        }
      }
    } finally {
      setApprovalBusyId(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Dedicated Faculty Top Bar (No Student Form / My ID Card links) */}
      <header className="no-print sticky top-0 z-40 border-b border-slate-200 bg-[#0F2942] text-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-[#0F2942]">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-heading text-sm font-extrabold tracking-tight sm:text-base">
                EMPHSS Faculty Portal
              </span>
              <p className="text-[11px] text-amber-300">
                Authorized Staff Workspace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {role === "admin" && (
              <Link
                href="/admin"
                className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-[#0F2942] hover:bg-amber-400"
              >
                Admin Panel
              </Link>
            )}
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-1 rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/20 sm:inline-flex"
            >
              Public Site
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="hidden items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-600 md:inline-flex"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
            <button
              type="button"
              aria-label="Toggle Faculty Menu"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 p-1 text-white transition-colors hover:bg-white/20 md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="m-1 h-5 w-5" />
              ) : activeTeacher?.photoData ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={activeTeacher.photoData}
                    alt={activeTeacher.fullName}
                    className="h-7 w-7 rounded-full border border-amber-400 object-cover"
                  />
                  <Menu className="mr-1 h-4 w-4 text-amber-300" />
                </>
              ) : (
                <Menu className="m-1 h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Desktop Sub-Navigation Tabs */}
        <div className="hidden border-t border-white/10 bg-[#0B2034] md:block">
          <div className="mx-auto flex max-w-6xl flex-wrap gap-1 px-4 py-2 sm:px-6">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                activeTab === "profile"
                  ? "bg-amber-500 text-[#0F2942]"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              My Profile &amp; ID Card
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("approvals")}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                activeTab === "approvals"
                  ? "bg-amber-500 text-[#0F2942]"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Approvals ({pendingForMyClass.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("students")}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                activeTab === "students"
                  ? "bg-amber-500 text-[#0F2942]"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Search className="h-3.5 w-3.5" />
              Student Lookup ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("award-roll")}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                activeTab === "award-roll"
                  ? "bg-amber-500 text-[#0F2942]"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <ClipboardList className="h-3.5 w-3.5" />
              Award Roll{activeTeacher?.formTeacherClass ? ` (${activeTeacher.formTeacherClass})` : ""}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("faculty")}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-colors ${
                activeTab === "faculty"
                  ? "bg-amber-500 text-[#0F2942]"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Faculty Directory ({teachers.length})
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-[#0B2034] px-4 py-3 md:hidden">
            <div className="flex flex-col gap-1">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("profile");
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold ${
                  activeTab === "profile"
                    ? "bg-amber-500 text-[#0F2942]"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <UserPlus className="h-4 w-4" />
                My Profile &amp; ID Card
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("approvals");
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold ${
                  activeTab === "approvals"
                    ? "bg-amber-500 text-[#0F2942]"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                Pending Approvals ({pendingForMyClass.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("students");
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold ${
                  activeTab === "students"
                    ? "bg-amber-500 text-[#0F2942]"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <Search className="h-4 w-4" />
                Student Lookup ({students.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("award-roll");
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold ${
                  activeTab === "award-roll"
                    ? "bg-amber-500 text-[#0F2942]"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <ClipboardList className="h-4 w-4" />
                Award Roll
                {activeTeacher?.formTeacherClass
                  ? ` (${activeTeacher.formTeacherClass})`
                  : ""}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("faculty");
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold ${
                  activeTab === "faculty"
                    ? "bg-amber-500 text-[#0F2942]"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <Users className="h-4 w-4" />
                Faculty Directory ({teachers.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-semibold text-slate-200 hover:bg-white/10 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">

      {/* TAB 1: My Profile & Official Teacher ID Card */}
      {activeTab === "profile" && (
        <>
          {activeTeacher && !editingId && !creatingNew ? (
            <div className="mx-auto max-w-2xl space-y-5">
              {success && (
                <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{success}</span>
                </div>
              )}

              {/* Clean Teacher Action Bar */}
              <div className="no-print flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase">
                    Active Faculty Profile
                  </p>
                  {teachers.length > 1 ? (
                    <select
                      value={activeTeacher.id}
                      onChange={(e) => selectActiveTeacher(e.target.value)}
                      className="mt-0.5 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-heading text-sm font-bold text-[#0F2942] outline-none sm:w-auto"
                    >
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.teacherCode})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="font-heading truncate text-base font-bold text-[#0F2942]">
                      {activeTeacher.fullName} ({activeTeacher.teacherCode})
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => startEdit(activeTeacher)}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#0F2942] px-4 py-2 text-xs font-bold text-white hover:bg-[#163B5E] sm:w-auto"
                  >
                    <Pencil className="h-3.5 w-3.5 text-amber-400" />
                    Edit My Profile
                  </button>
                  {role === "admin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setForm(EMPTY_FORM);
                        setCreatingNew(true);
                        setError("");
                        setSuccess("");
                      }}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Add New
                    </button>
                  )}
                </div>
              </div>

              {/* Official Teacher ID Card (Main Info Only) */}
              <IdCardPreview
                card={{
                  type: "teacher",
                  idNumber: activeTeacher.teacherCode,
                  name: activeTeacher.fullName,
                  photoData: activeTeacher.photoData,
                  primaryBadge: activeTeacher.qualification,
                  sessionOrRole: "Faculty Member",
                  fields: [
                    { label: "Subjects", value: activeTeacher.subjects },
                    { label: "Classes", value: activeTeacher.classesTaught },
                    {
                      label: "Form Teacher",
                      value: activeTeacher.formTeacherClass
                        ? `Class ${activeTeacher.formTeacherClass}`
                        : "Subject Faculty",
                    },
                    {
                      label: "Mobile Number",
                      value: activeTeacher.mobileNumber,
                    },
                  ],
                }}
              />
            </div>
          ) : (
            <div className="mx-auto max-w-xl">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading flex items-center gap-2 text-lg font-bold text-[#0F2942]">
                    <UserPlus className="h-5 w-5 text-amber-600" />
                    {editingId
                      ? "Update Teacher Profile"
                      : "Create Your Teacher Profile & ID"}
                  </h2>
                  {(editingId || (creatingNew && activeTeacher)) && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                    >
                      <X className="h-3.5 w-3.5" />
                      Cancel
                    </button>
                  )}
                </div>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{success}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {/* Photo Upload */}
                <div className="flex items-center gap-4">
                  <label
                    htmlFor="teacher-photo"
                    className="flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 hover:border-[#0F2942]"
                  >
                    {photoLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-[#0F2942]" />
                    ) : form.photoData ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.photoData}
                        alt="Teacher preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Camera className="h-6 w-6 text-slate-400" />
                    )}
                    <input
                      id="teacher-photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="sr-only"
                    />
                  </label>
                  <div>
                    <label
                      htmlFor="teacher-photo"
                      className="cursor-pointer text-xs font-bold text-[#0F2942] hover:underline"
                    >
                      {form.photoData
                        ? "Change Teacher Photo"
                        : "Upload Photo for Teacher ID Card"}
                    </label>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Clear portrait photo recommended for your official ID Card
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        fullName: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="e.g., NAFEES AHMED"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm uppercase outline-none focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Father&apos;s Name *
                    </label>
                    <input
                      type="text"
                      value={form.fatherName}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          fatherName: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Enter father's name"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm uppercase outline-none focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Mother&apos;s Name *
                    </label>
                    <input
                      type="text"
                      value={form.motherName}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          motherName: e.target.value.toUpperCase(),
                        }))
                      }
                      placeholder="Enter mother's name"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm uppercase outline-none focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Address / Village *
                  </label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        address: e.target.value.toUpperCase(),
                      }))
                    }
                    placeholder="e.g., BAWLI / VILLAGE NAME"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm uppercase outline-none focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Mobile Number *
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={10}
                      value={form.mobileNumber}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          mobileNumber: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 10),
                        }))
                      }
                      placeholder="10-digit number"
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Qualification *
                    </label>
                    <input
                      type="text"
                      value={form.qualification}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          qualification: e.target.value,
                        }))
                      }
                      placeholder="e.g., M.Sc., B.Ed."
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Classes Taught *{" "}
                    {role !== "admin" && (
                      <span className="font-normal text-slate-400">
                        (Managed by Admin)
                      </span>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CLASS_ORDER.map((cls) => {
                      const selected = form.selectedClasses.includes(cls);
                      return (
                        <button
                          key={cls}
                          type="button"
                          disabled={role !== "admin"}
                          onClick={() => toggleClass(cls)}
                          className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-70 ${
                            selected
                              ? "border-[#0F2942] bg-[#0F2942] text-white"
                              : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                          }`}
                        >
                          {cls}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Form Teacher Of (1st Period Class)
                  </label>
                  <select
                    disabled={role !== "admin"}
                    value={form.formTeacherClass}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        formTeacherClass: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15 disabled:bg-slate-100 disabled:text-slate-500"
                  >
                    <option value="None">None (Subject Teacher Only)</option>
                    {CLASS_ORDER.map((cls) => (
                      <option key={cls} value={cls}>
                        Form Teacher — Class {cls}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Subjects Taught *
                  </label>
                  <input
                    type="text"
                    disabled={role !== "admin"}
                    value={form.subjects}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, subjects: e.target.value }))
                    }
                    placeholder="e.g., Mathematics, Physics"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Role &amp; Responsibilities *
                  </label>
                  <textarea
                    rows={3}
                    value={form.roleSummary}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, roleSummary: e.target.value }))
                    }
                    placeholder="e.g., Class Teacher of 8th, Science Lab Coordinator"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    {editingId
                      ? "Update Personal Teacher PIN (Optional)"
                      : "Personal Teacher PIN * (4–32 chars)"}
                  </label>
                  <input
                    type="password"
                    minLength={4}
                    maxLength={32}
                    value={form.pin}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, pin: e.target.value }))
                    }
                    placeholder={
                      editingId
                        ? "Leave blank to keep current PIN"
                        : "Set a private PIN only you know"
                    }
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15"
                  />
                </div>

                <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
                  {(editingId || (creatingNew && activeTeacher)) && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 sm:w-1/3"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F2942] px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-[#163B5E] disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving Profile...
                      </>
                    ) : editingId ? (
                      "Update Teacher Profile"
                    ) : (
                      "Submit & Generate Teacher ID Card"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
          )}
        </>
      )}

      {/* TAB 2: Pending Student Approvals (Form Teacher Only) */}
      {activeTab === "approvals" && (
        <div className="space-y-5">
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
            <div>
              <h2 className="font-heading text-base font-bold text-[#0F2942]">
                Pending Student Approvals
                {activeTeacher?.formTeacherClass
                  ? ` — Class ${activeTeacher.formTeacherClass}`
                  : ""}
              </h2>
              <p className="text-xs text-slate-500">
                Verify newly submitted students for your Form Teacher class.
                Approved students move to the official register &amp; Award Roll;
                fake entries can be deleted immediately.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {teachers.length > 0 && (
                <select
                  value={activeTeacher?.id ?? ""}
                  onChange={(e) => selectActiveTeacher(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-[#0F2942] outline-none"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} (
                      {t.formTeacherClass
                        ? `Form Teacher: ${t.formTeacherClass}`
                        : "No Form Class"}
                      )
                    </option>
                  ))}
                </select>
              )}
              {pendingForMyClass.length > 0 && (
                <button
                  type="button"
                  disabled={approvalBusyId !== null}
                  onClick={() => handleApprovalAction("approve_all")}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Approve All ({pendingForMyClass.length})
                </button>
              )}
            </div>
          </div>

          {!activeTeacher?.formTeacherClass ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              Select your <strong>Form Teacher Of (1st Period Class)</strong> in
              &ldquo;My Profile &amp; ID Card&rdquo; to verify student
              submissions for your class.
            </div>
          ) : pendingForMyClass.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
              <p className="font-heading mt-3 text-base font-bold text-[#0F2942]">
                All Caught Up!
              </p>
              <p className="mt-1 text-xs text-slate-500">
                No pending student registrations for Class{" "}
                {activeTeacher.formTeacherClass}.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pendingForMyClass.map((stu) => (
                <div
                  key={stu.id}
                  className="rounded-2xl border border-amber-200 bg-white p-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-slate-400">
                      {stu.photoData ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={stu.photoData}
                          alt={stu.studentName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                        PENDING • {stu.referenceId}
                      </span>
                      <h3 className="font-heading mt-1 text-base font-bold text-[#0F2942]">
                        {stu.studentName}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
                    <p>
                      <strong>Father:</strong> {stu.fatherName}
                    </p>
                    <p>
                      <strong>Mother:</strong> {stu.motherName}
                    </p>
                    <p>
                      <strong>DOB:</strong> {stu.dateOfBirth} ({stu.gender})
                    </p>
                    <p>
                      <strong>Mobile:</strong> {stu.mobileNumber}
                    </p>
                    <p>
                      <strong>Address:</strong> {stu.address}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      disabled={approvalBusyId === stu.id}
                      onClick={() => handleApprovalAction("approve", stu.id)}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={approvalBusyId === stu.id}
                      onClick={() => handleApprovalAction("reject", stu.id)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                      title="Delete Fake Entry"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Student Lookup (Read-Only) */}
      {activeTab === "students" && (
        <div className="space-y-5">
          <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center">
            <div>
              <h2 className="font-heading text-base font-extrabold text-[#0F2942]">
                Student Directory (Read-Only)
              </h2>
              <p className="text-xs text-slate-500">
                Search by Student ID, Name, or Class to view parent contact and
                transport details. Editing is restricted to Admin only.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {teachers.length > 0 && (
                <select
                  value={activeTeacher?.id ?? ""}
                  onChange={(e) => {
                    selectActiveTeacher(e.target.value);
                    setStudentClassFilter("MyClasses");
                  }}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-[#0F2942] outline-none focus:border-[#0F2942]"
                >
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      Teacher: {t.fullName} ({t.classesTaught})
                    </option>
                  ))}
                </select>
              )}
              <div className="relative w-full sm:w-auto">
                <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Search any student by ID, name, mobile..."
                  className="w-full rounded-xl border border-slate-300 py-2 pr-3 pl-9 text-xs outline-none focus:border-[#0F2942] sm:w-60"
                />
              </div>
              <select
                value={studentClassFilter}
                onChange={(e) => setStudentClassFilter(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs outline-none focus:border-[#0F2942]"
              >
                <option value="MyClasses">
                  My Assigned Classes ({activeTeacher?.classesTaught || "None"})
                </option>
                <option value="All">All Classes</option>
                {CLASS_ORDER.map((c) => (
                  <option key={c} value={c}>
                    Class {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredStudents.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
              No matching students found.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filteredStudents.map((s) => (
                <div
                  key={s.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-slate-400">
                      {s.photoData ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.photoData}
                          alt={s.studentName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <span className="rounded-md bg-[#0F2942]/10 px-2 py-0.5 text-[11px] font-bold text-[#0F2942]">
                        {s.referenceId} • Class {s.currentClass}
                      </span>
                      <h3 className="font-heading mt-1 text-base font-extrabold text-[#0F2942]">
                        {s.studentName}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    <p>
                      <span className="font-semibold text-slate-500">
                        Father:
                      </span>{" "}
                      {s.fatherName}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">
                        Mother:
                      </span>{" "}
                      {s.motherName}
                    </p>
                    <p className="flex items-center gap-1.5 font-bold text-[#0F2942]">
                      <Phone className="h-3.5 w-3.5 text-emerald-600" />
                      <a href={`tel:${s.mobileNumber}`} className="hover:underline">
                        {s.mobileNumber}
                      </a>
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">
                        Address:
                      </span>{" "}
                      {s.address}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-500">
                        Transport:
                      </span>{" "}
                      {s.transportMode === "School Transport"
                        ? s.vehicleRoute
                        : "Local"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Award Roll (Strictly for Form Teacher's Class) */}
      {activeTab === "award-roll" && (
        <div className="space-y-4">
          {teachers.length > 0 && (
            <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              <div>
                <h2 className="font-heading text-base font-extrabold text-[#0F2942]">
                  Examination Award Roll
                </h2>
                <p className="text-xs text-slate-500">
                  Each Form Teacher can view, save, and print the Award Roll
                  strictly for their own Form Teacher class.
                </p>
              </div>
              <select
                value={activeTeacher?.id ?? ""}
                onChange={(e) => selectActiveTeacher(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-[#0F2942] outline-none"
              >
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} (
                    {t.formTeacherClass
                      ? `Form Teacher: ${t.formTeacherClass}`
                      : "No Form Class"}
                    )
                  </option>
                ))}
              </select>
            </div>
          )}

          {!activeTeacher?.formTeacherClass ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />
              <p className="font-heading mt-3 text-base font-bold text-slate-700">
                No Form Teacher Class Assigned
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Edit your profile in &ldquo;My Profile &amp; ID Card&rdquo; and
                select your <strong>Form Teacher Of (1st Period Class)</strong>{" "}
                to unlock your class&apos;s Award Roll.
              </p>
            </div>
          ) : (
            <AwardRollClient formTeacherClass={activeTeacher.formTeacherClass} />
          )}
        </div>
      )}

      {/* TAB 4: Faculty Directory */}
      {activeTab === "faculty" && (
        <div className="grid gap-4 md:grid-cols-2">
          {teachers.map((teacher) => (
            <div
              key={teacher.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-slate-400">
                    {teacher.photoData ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={teacher.photoData}
                        alt={teacher.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                        {teacher.teacherCode}
                      </span>
                      <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-800">
                        {teacher.qualification}
                      </span>
                    </div>
                    <h3 className="font-heading mt-1 text-lg font-extrabold text-[#0F2942]">
                      {teacher.fullName}
                    </h3>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                      <Phone className="h-3.5 w-3.5" />
                      {teacher.mobileNumber}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 text-xs sm:grid-cols-2">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="flex items-center gap-1.5 font-semibold text-slate-500">
                    <BookOpen className="h-3.5 w-3.5 text-[#0F2942]" />
                    Subjects &amp; Classes
                  </p>
                  <p className="mt-1 font-bold text-[#0F2942]">
                    {teacher.subjects}
                  </p>
                  <p className="mt-0.5 text-slate-600">
                    Classes: {teacher.classesTaught}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="flex items-center gap-1.5 font-semibold text-slate-500">
                    <Briefcase className="h-3.5 w-3.5 text-amber-600" />
                    Role &amp; Responsibilities
                  </p>
                  <p className="mt-1 leading-relaxed text-slate-700">
                    {teacher.roleSummary}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Teacher ID Card Modal */}
      {idCardTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/65 p-4 backdrop-blur-xs">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#F8FAFC] p-5 shadow-2xl sm:p-6">
            <div className="no-print mb-4 flex items-center justify-between">
              <h3 className="font-heading text-lg font-extrabold text-[#0F2942]">
                Official EMPHSS Teacher ID Card
              </h3>
              <button
                type="button"
                onClick={() => setIdCardTeacher(null)}
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:text-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <IdCardPreview
              card={{
                type: "teacher",
                idNumber: idCardTeacher.teacherCode,
                name: idCardTeacher.fullName,
                photoData: idCardTeacher.photoData,
                primaryBadge: idCardTeacher.qualification,
                sessionOrRole: "Faculty Member",
                fields: [
                  { label: "Subjects", value: idCardTeacher.subjects },
                  { label: "Classes", value: idCardTeacher.classesTaught },
                  {
                    label: "Form Teacher",
                    value: idCardTeacher.formTeacherClass
                      ? `Class ${idCardTeacher.formTeacherClass}`
                      : "Subject Faculty",
                  },
                  { label: "Mobile Number", value: idCardTeacher.mobileNumber },
                  { label: "Role", value: idCardTeacher.roleSummary },
                ],
              }}
            />
          </div>
        </div>
      )}
      </div>

      <footer className="no-print border-t border-slate-200 bg-white px-4 py-4 text-center text-xs text-slate-500">
        <Link
          href="/developer"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pr-3 pl-1 transition-colors hover:border-[#0F2942]/30"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nafees.jpg"
            alt="Nafees Ahmed Bhatti"
            className="h-6 w-6 rounded-full border border-amber-400 object-cover object-top"
          />
          <span>
            Built by{" "}
            <strong className="text-[#0F2942]">Nafees Ahmed Bhatti</strong>
          </span>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-amber-600" />
        </Link>
      </footer>

      {pinPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleConfirmPin}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl"
          >
            <h3 className="font-heading text-lg font-bold text-[#0F2942]">
              {pinPrompt.teacher.hasPin
                ? "Verify Personal Teacher PIN"
                : "Enroll Teacher Profile"}
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              {pinPrompt.teacher.hasPin
                ? `Enter the personal PIN for ${pinPrompt.teacher.fullName} (${pinPrompt.teacher.teacherCode}) to access this profile.`
                : `Enter the single-use Enrollment Code issued by the School Admin and choose your personal 4–32 character PIN.`}
            </p>
            {!pinPrompt.teacher.hasPin && (
              <input
                type="text"
                required
                autoFocus
                value={pinPrompt.enrollmentCodeInput}
                onChange={(e) =>
                  setPinPrompt((p) =>
                    p
                      ? {
                          ...p,
                          enrollmentCodeInput: e.target.value.toUpperCase(),
                          error: "",
                        }
                      : null
                  )
                }
                placeholder="Admin Enrollment Code (e.g., A1B2C3D4)"
                className="mt-4 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 font-mono text-sm uppercase outline-none focus:border-[#0F2942]"
              />
            )}
            <input
              type="password"
              required
              minLength={4}
              maxLength={32}
              autoFocus={Boolean(pinPrompt.teacher.hasPin)}
              value={pinPrompt.pinInput}
              onChange={(e) =>
                setPinPrompt((p) =>
                  p ? { ...p, pinInput: e.target.value, error: "" } : null
                )
              }
              placeholder={
                pinPrompt.teacher.hasPin ? "Enter PIN" : "Choose Personal PIN"
              }
              className="mt-3 w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#0F2942]"
            />
            {pinPrompt.error && (
              <p className="mt-2 text-xs font-semibold text-rose-600">
                {pinPrompt.error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={pinPrompt.busy}
                onClick={() => setPinPrompt(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={pinPrompt.busy}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#0F2942] px-4 py-2 text-xs font-bold text-white hover:bg-[#163B5E] disabled:opacity-60"
              >
                {pinPrompt.busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Verify &amp; Switch
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

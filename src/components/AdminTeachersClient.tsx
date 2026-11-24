"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Briefcase,
  Phone,
  Trash2,
  User,
  UserPlus,
} from "lucide-react";
import type { TeacherRecord } from "@/components/TeacherPortalClient";

export function AdminTeachersClient({
  initialTeachers,
}: {
  initialTeachers: TeacherRecord[];
}) {
  const [teachers, setTeachers] = useState<TeacherRecord[]>(initialTeachers);

  async function handleToggleActive(teacher: TeacherRecord) {
    const res = await fetch(`/api/teachers/${teacher.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: teacher.fullName,
        fatherName: teacher.fatherName,
        motherName: teacher.motherName,
        address: teacher.address,
        mobileNumber: teacher.mobileNumber,
        qualification: teacher.qualification,
        classesTaught: teacher.classesTaught,
        formTeacherClass: teacher.formTeacherClass || "None",
        subjects: teacher.subjects,
        roleSummary: teacher.roleSummary,
        isActive: !teacher.isActive,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacher.id ? data.teacher : t))
      );
    }
  }

  async function handleDelete(teacher: TeacherRecord) {
    if (!window.confirm(`Delete ${teacher.fullName} (${teacher.teacherCode})?`))
      return;
    const res = await fetch(`/api/teachers/${teacher.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-[#0F2942]">
            Faculty Management ({teachers.length})
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            View, activate/deactivate, or remove registered EMPHSS teachers.
          </p>
        </div>

        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-[#0F2942] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#163B5E]"
        >
          <UserPlus className="h-4 w-4 text-amber-400" />
          Add / Edit in Teacher Portal
        </Link>
      </div>

      {teachers.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No teacher profiles submitted yet. Share the Teacher Login link and
          Staff Access Password with your teachers.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {teachers.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-slate-400">
                    {t.photoData ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.photoData}
                        alt={t.fullName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
                        {t.teacherCode}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          t.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-200 text-slate-600"
                        }`}
                      >
                        {t.isActive ? "Active" : "Inactive"}
                      </span>
                      {t.formTeacherClass && (
                        <span className="rounded-md bg-[#0F2942] px-2 py-0.5 text-[11px] font-bold text-amber-300">
                          Form Teacher: {t.formTeacherClass}
                        </span>
                      )}
                    </div>
                    <h2 className="font-heading mt-1 text-base font-bold text-[#0F2942]">
                      {t.fullName}
                    </h2>
                    <p className="text-xs font-semibold text-amber-700">
                      {t.qualification}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                      <Phone className="h-3 w-3" />
                      {t.mobileNumber}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(t)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {t.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(t)}
                    className="rounded-lg border border-slate-200 p-1.5 text-rose-600 hover:bg-rose-50"
                    title="Delete Teacher"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-4 space-y-2 border-t border-slate-100 pt-3 text-xs">
                {(t.fatherName || t.motherName || t.address) && (
                  <p className="text-slate-600">
                    {t.fatherName && <><strong>Father:</strong> {t.fatherName} • </>}
                    {t.motherName && <><strong>Mother:</strong> {t.motherName} • </>}
                    {t.address && <><strong>Address:</strong> {t.address}</>}
                  </p>
                )}
                <p className="flex items-start gap-1.5 text-slate-700">
                  <BookOpen className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#0F2942]" />
                  <span>
                    <strong>{t.subjects}</strong> • Classes: {t.classesTaught}
                  </span>
                </p>
                <p className="flex items-start gap-1.5 text-slate-600">
                  <Briefcase className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span>{t.roleSummary}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

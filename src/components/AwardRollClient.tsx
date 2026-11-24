"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Printer,
  Save,
} from "lucide-react";

interface AwardRollStudent {
  id: string;
  referenceId: string;
  studentName: string;
  fatherName: string;
  subjects: string;
}

const EXAM_OPTIONS = ["T1", "T2", "Half Yearly", "Annual"];

export function AwardRollClient({
  formTeacherClass,
}: {
  formTeacherClass: string;
}) {
  const [examName, setExamName] = useState("T1");
  const [section, setSection] = useState("A");
  const [maxMarks, setMaxMarks] = useState(50);
  const [sessionName, setSessionName] = useState("2026-27");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [students, setStudents] = useState<AwardRollStudent[]>([]);
  const [marks, setMarks] = useState<Record<string, Record<string, string>>>(
    {}
  );
  const [blankPrintMode, setBlankPrintMode] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  useEffect(() => {
    let active = true;
    async function loadRoll() {
      setLoading(true);
      setError("");
      setSavedMsg("");
      try {
        const res = await fetch(
          `/api/teacher/award-roll?className=${encodeURIComponent(
            formTeacherClass
          )}&examName=${encodeURIComponent(examName)}`
        );
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setError(data.error || "Unable to load Award Roll.");
          setLoading(false);
          return;
        }
        setSessionName(data.session || "2026-27");
        setSection(data.section || "A");
        setMaxMarks(data.maxMarksPerSubject || 50);
        setSubjects(data.subjects || []);
        setStudents(data.students || []);
        setMarks(data.marks || {});
      } catch {
        if (active) setError("Network error while loading Award Roll.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadRoll();
    return () => {
      active = false;
    };
  }, [formTeacherClass, examName]);

  function handleMarkChange(studentId: string, subject: string, raw: string) {
    const val = raw.toUpperCase().trim();
    if (val !== "" && val !== "A" && val !== "AB") {
      const num = Number(val);
      if (Number.isNaN(num) || num < 0 || num > maxMarks) {
        return;
      }
    }
    setSavedMsg("");
    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subject]: val,
      },
    }));
  }

  async function handleSaveDraft() {
    setSaving(true);
    setError("");
    setSavedMsg("");
    try {
      const res = await fetch("/api/teacher/award-roll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          className: formTeacherClass,
          examName,
          section,
          maxMarksPerSubject: maxMarks,
          subjects,
          marks,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to save draft.");
        return;
      }
      setSavedMsg(
        `Draft saved for Class ${formTeacherClass} (${examName})! You can continue entering remaining subjects anytime.`
      );
    } catch {
      setError("Network error while saving draft.");
    } finally {
      setSaving(false);
    }
  }

  const totalMaxPerStudent = subjects.length * maxMarks;

  // Calculations for each student and class summary
  const summary = useMemo(() => {
    const passThreshold = maxMarks * 0.33;
    const subjectStats = subjects.map((sub) => {
      let sum = 0;
      let passed = 0;
      let entered = 0;

      for (const stu of students) {
        const raw = (marks[stu.id]?.[sub] || "").trim().toUpperCase();
        if (raw === "AB") {
          entered += 1;
        } else if (raw !== "") {
          const n = Number(raw);
          if (!Number.isNaN(n)) {
            entered += 1;
            sum += n;
            if (n >= passThreshold) passed += 1;
          }
        }
      }

      const avgPct =
        entered > 0 && maxMarks > 0
          ? ((sum / (entered * maxMarks)) * 100).toFixed(2)
          : "0.00";
      const passPct =
        entered > 0 ? ((passed / entered) * 100).toFixed(2) : "0.00";

      return {
        subject: sub,
        avgPct: Number(avgPct),
        passPct: Number(passPct),
        entered,
      };
    });

    let totalObtainedAll = 0;
    let totalMaxAll = 0;

    for (const stu of students) {
      for (const sub of subjects) {
        const raw = (marks[stu.id]?.[sub] || "").trim().toUpperCase();
        if (raw !== "" && raw !== "AB") {
          const n = Number(raw);
          if (!Number.isNaN(n)) {
            totalObtainedAll += n;
            totalMaxAll += maxMarks;
          }
        } else if (raw === "AB") {
          totalMaxAll += maxMarks;
        }
      }
    }

    const overallPct =
      totalMaxAll > 0 ? ((totalObtainedAll / totalMaxAll) * 100).toFixed(2) : "0.00";

    const enteredSubjects = subjectStats.filter((s) => s.entered > 0);
    const bestSubject =
      enteredSubjects.length > 0
        ? enteredSubjects.reduce((a, b) => (b.avgPct > a.avgPct ? b : a)).subject
        : "-";
    const lowestSubject =
      enteredSubjects.length > 0
        ? enteredSubjects.reduce((a, b) => (b.avgPct < a.avgPct ? b : a)).subject
        : "-";

    return {
      subjectStats,
      totalObtainedAll,
      totalMaxAll,
      overallPct,
      bestSubject,
      lowestSubject,
    };
  }, [students, subjects, marks, maxMarks]);

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-slate-200 bg-white p-12 text-sm text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#0F2942]" />
        Loading Class {formTeacherClass} Award Roll...
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Controls Bar (Hidden on Print) */}
      <div className="no-print rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase">
                Examination
              </label>
              <select
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                className="mt-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-[#0F2942] outline-none"
              >
                {EXAM_OPTIONS.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase">
                Section
              </label>
              <input
                type="text"
                value={section}
                onChange={(e) => setSection(e.target.value.toUpperCase())}
                className="mt-1 w-20 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-[#0F2942] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase">
                Max Marks / Subject
              </label>
              <input
                type="number"
                min={10}
                max={200}
                value={maxMarks}
                onChange={(e) =>
                  setMaxMarks(Math.max(1, Number(e.target.value) || 50))
                }
                className="mt-1 w-24 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-[#0F2942] outline-none"
              />
            </div>

            <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={blankPrintMode}
                onChange={(e) => setBlankPrintMode(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Print Blank Sheet (Hand-Entry)
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={saving || students.length === 0}
              onClick={handleSaveDraft}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Draft Marks
            </button>
            <button
              type="button"
              disabled={students.length === 0}
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0F2942] px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#163B5E] disabled:opacity-50"
            >
              <Printer className="h-4 w-4 text-amber-400" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {savedMsg && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-900">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{savedMsg}</span>
          </div>
        )}
      </div>

      {/* Printable Official Award Roll Sheet */}
      {students.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No active students registered in <strong>Class {formTeacherClass}</strong> yet.
          Once students submit their registration form for Class {formTeacherClass},
          they will automatically appear in this Award Roll.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-300 bg-white p-4 shadow-xs sm:p-6">
          {/* Official Sheet Header */}
          <div className="border-b-2 border-[#0F2942] pb-3 text-center">
            <h2 className="font-heading text-base font-extrabold tracking-wide text-[#0F2942] uppercase sm:text-lg">
              ENGLISH MEDIUM PUBLIC HIGHER SECONDARY SCHOOL, BAWLI
            </h2>
            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs font-bold text-slate-700">
              <span>EXAMINATION: {examName}</span>
              <span>MAXIMUM MARKS: {maxMarks}</span>
              <span>SESSION: {sessionName}</span>
              <span>
                CLASS: {formTeacherClass} • SECTION: {section}
              </span>
              <span className="text-[#0F2942] underline">AWARD ROLL</span>
            </div>
          </div>

          {/* Award Roll Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 text-xs">
              <thead>
                <tr className="bg-slate-100 text-[#0F2942]">
                  <th className="border border-slate-300 px-2 py-2 text-center">
                    Sr.
                  </th>
                  <th className="border border-slate-300 px-2.5 py-2 text-left">
                    Student Name
                  </th>
                  <th className="border border-slate-300 px-2.5 py-2 text-left">
                    Parentage
                  </th>
                  {subjects.map((sub) => (
                    <th
                      key={sub}
                      className="min-w-[68px] border border-slate-300 px-2 py-2 text-center"
                    >
                      <div>{sub}</div>
                      <div className="text-[10px] font-semibold text-slate-500">
                        MM {maxMarks}
                      </div>
                    </th>
                  ))}
                  <th className="border border-slate-300 px-2 py-2 text-center">
                    <div>Total</div>
                    <div className="text-[10px] font-semibold text-slate-500">
                      MM {totalMaxPerStudent}
                    </div>
                  </th>
                  <th className="border border-slate-300 px-2 py-2 text-center">
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {students.map((stu, idx) => {
                  let rowSum = 0;
                  let hasAnyMark = false;
                  for (const sub of subjects) {
                    const raw = (marks[stu.id]?.[sub] || "").trim();
                    if (raw !== "" && raw !== "AB") {
                      const n = Number(raw);
                      if (!Number.isNaN(n)) {
                        rowSum += n;
                        hasAnyMark = true;
                      }
                    }
                  }
                  const rowPct =
                    hasAnyMark && totalMaxPerStudent > 0
                      ? ((rowSum / totalMaxPerStudent) * 100).toFixed(2)
                      : "";

                  return (
                    <tr key={stu.id} className="hover:bg-slate-50/70">
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold">
                        {idx + 1}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-1.5 font-bold text-[#0F2942]">
                        {stu.studentName}
                      </td>
                      <td className="border border-slate-300 px-2.5 py-1.5 text-slate-700">
                        {stu.fatherName}
                      </td>
                      {subjects.map((sub) => (
                        <td
                          key={sub}
                          className="border border-slate-300 p-1 text-center"
                        >
                          {blankPrintMode ? (
                            <div className="h-6 w-full" />
                          ) : (
                            <input
                              type="text"
                              value={marks[stu.id]?.[sub] ?? ""}
                              onChange={(e) =>
                                handleMarkChange(stu.id, sub, e.target.value)
                              }
                              placeholder="-"
                              className="w-full rounded bg-transparent py-1 text-center font-semibold text-slate-900 outline-none focus:bg-amber-50"
                            />
                          )}
                        </td>
                      ))}
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-bold text-[#0F2942]">
                        {blankPrintMode ? "" : hasAnyMark ? rowSum : ""}
                      </td>
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-semibold text-slate-700">
                        {blankPrintMode ? "" : rowPct}
                      </td>
                    </tr>
                  );
                })}

                {!blankPrintMode && (
                  <>
                    <tr className="bg-slate-50 font-bold text-[#0F2942]">
                      <td
                        colSpan={3}
                        className="border border-slate-300 px-2.5 py-2 text-right"
                      >
                        Pass Percentage (%)
                      </td>
                      {summary.subjectStats.map((st) => (
                        <td
                          key={st.subject}
                          className="border border-slate-300 px-2 py-2 text-center"
                        >
                          {st.entered > 0 ? `${st.passPct.toFixed(2)}%` : "-"}
                        </td>
                      ))}
                      <td
                        colSpan={2}
                        className="border border-slate-300 px-2 py-2"
                      />
                    </tr>
                    <tr className="bg-slate-50 font-bold text-slate-700">
                      <td
                        colSpan={3}
                        className="border border-slate-300 px-2.5 py-2 text-right"
                      >
                        Subject Average (%)
                      </td>
                      {summary.subjectStats.map((st) => (
                        <td
                          key={st.subject}
                          className="border border-slate-300 px-2 py-2 text-center"
                        >
                          {st.entered > 0 ? `${st.avgPct.toFixed(2)}%` : "-"}
                        </td>
                      ))}
                      <td
                        colSpan={2}
                        className="border border-slate-300 px-2 py-2"
                      />
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Class Summary */}
          {!blankPrintMode && (
            <div className="mt-5 grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs sm:grid-cols-5">
              <div>
                <p className="text-slate-500">Total Students</p>
                <p className="font-bold text-[#0F2942]">{students.length}</p>
              </div>
              <div>
                <p className="text-slate-500">Marks Obtained / Max</p>
                <p className="font-bold text-[#0F2942]">
                  {summary.totalObtainedAll} / {summary.totalMaxAll}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Overall Class %</p>
                <p className="font-bold text-emerald-700">
                  {summary.overallPct}%
                </p>
              </div>
              <div>
                <p className="text-slate-500">Best Subject</p>
                <p className="font-bold text-[#0F2942]">{summary.bestSubject}</p>
              </div>
              <div>
                <p className="text-slate-500">Lowest Subject</p>
                <p className="font-bold text-rose-700">
                  {summary.lowestSubject}
                </p>
              </div>
            </div>
          )}

          {/* Official Signature Footer */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-6 px-2 pt-4 text-xs font-bold text-slate-700">
            <span>PREPARED BY ____________________</span>
            <span>CHECKED BY ____________________</span>
            <span>PRINCIPAL ____________________</span>
          </div>
        </div>
      )}
    </div>
  );
}

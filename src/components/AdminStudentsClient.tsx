"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Download,
  Loader2,
  Pencil,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  CLASS_ORDER,
  GENDER_OPTIONS,
  PASSED_OUT_STATUS,
} from "@/lib/constants";

export interface StudentRecord {
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
  createdAt: string;
}

export function AdminStudentsClient({
  initialStudents,
  initialClassFilter = "All",
}: {
  initialStudents: StudentRecord[];
  initialClassFilter?: string;
}) {
  const [students, setStudents] = useState<StudentRecord[]>(initialStudents);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState(initialClassFilter);
  const [transportFilter, setTransportFilter] = useState("All");
  const [genderFilter, setGenderFilter] = useState("All");

  const [editing, setEditing] = useState<StudentRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (classFilter !== "All" && s.currentClass !== classFilter) return false;
      if (transportFilter !== "All" && s.transportMode !== transportFilter)
        return false;
      if (genderFilter !== "All" && s.gender !== genderFilter) return false;
      if (!q) return true;
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.referenceId.toLowerCase().includes(q) ||
        s.fatherName.toLowerCase().includes(q) ||
        s.mobileNumber.includes(q) ||
        s.address.toLowerCase().includes(q)
      );
    });
  }, [students, search, classFilter, transportFilter, genderFilter]);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/students/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editing),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Unable to update student record.");
        setSaving(false);
        return;
      }
      setStudents((prev) =>
        prev.map((s) => (s.id === editing.id ? data.student : s))
      );
      setEditing(null);
    } catch {
      setError("Network error while saving changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(student: StudentRecord) {
    if (
      !window.confirm(
        `Delete ${student.studentName} (${student.referenceId}) permanently?`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/admin/students/${student.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
    }
  }

  const exportUrl = `/api/admin/students/export?class=${encodeURIComponent(
    classFilter
  )}&transport=${encodeURIComponent(transportFilter)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-[#0F2942]">
            Student Register ({filtered.length})
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Search, filter, edit student corrections, or export records to
            Excel/CSV.
          </p>
        </div>

        <a
          href={exportUrl}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F2942] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#163B5E]"
        >
          <Download className="h-4 w-4 text-amber-400" />
          Export Filtered CSV
        </a>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <Search className="absolute top-3 left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, ID, mobile..."
            className="w-full rounded-xl border border-slate-300 py-2.5 pr-3 pl-9 text-sm outline-none focus:border-[#0F2942]"
          />
        </div>

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0F2942]"
        >
          <option value="All">All Classes</option>
          {CLASS_ORDER.map((cls) => (
            <option key={cls} value={cls}>
              Class: {cls}
            </option>
          ))}
          <option value={PASSED_OUT_STATUS}>Passed Out</option>
        </select>

        <select
          value={transportFilter}
          onChange={(e) => setTransportFilter(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0F2942]"
        >
          <option value="All">All Transport Modes</option>
          <option value="Local">Local</option>
          <option value="School Transport">School Transport</option>
        </select>

        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#0F2942]"
        >
          <option value="All">All Genders</option>
          {GENDER_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>

      {/* Students List: Mobile Cards + Desktop Table */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
          No students match the selected filters.
        </div>
      ) : (
        <>
          {/* Mobile Cards View */}
          <div className="space-y-3 md:hidden">
            {filtered.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
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
                      <p className="mt-1 text-sm font-bold text-[#0F2942]">
                        {s.studentName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing({ ...s });
                        setError("");
                      }}
                      className="rounded-lg border border-slate-200 p-2 text-slate-600"
                      title="Edit Student"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(s)}
                      className="rounded-lg border border-slate-200 p-2 text-rose-600"
                      title="Delete Student"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 text-xs text-slate-600">
                  <p>F: {s.fatherName}</p>
                  <p>M: {s.motherName}</p>
                  <p className="font-semibold text-[#0F2942]">{s.mobileNumber}</p>
                  <p>DOB: {s.dateOfBirth}</p>
                  <p className="col-span-2">
                    {s.address} •{" "}
                    {s.transportMode === "School Transport"
                      ? s.vehicleRoute
                      : "Local"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold tracking-wider text-slate-500 uppercase">
                <tr>
                  <th className="px-4 py-3.5">Student</th>
                  <th className="px-4 py-3.5">Class</th>
                  <th className="px-4 py-3.5">Parents</th>
                  <th className="px-4 py-3.5">Mobile &amp; DOB</th>
                  <th className="px-4 py-3.5">Address &amp; Transport</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 text-slate-400">
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
                          <p className="font-bold text-[#0F2942]">
                            {s.studentName}
                          </p>
                          <p className="whitespace-nowrap text-xs font-semibold text-amber-700">
                            {s.referenceId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex rounded-lg bg-[#0F2942]/10 px-2.5 py-1 text-xs font-bold text-[#0F2942]">
                        {s.currentClass}
                      </span>
                      <p className="mt-1 text-xs text-slate-500">{s.gender}</p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">
                      <p>
                        <span className="text-slate-400">F:</span> {s.fatherName}
                      </p>
                      <p className="mt-0.5">
                        <span className="text-slate-400">M:</span> {s.motherName}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">
                      <p className="font-semibold">{s.mobileNumber}</p>
                      <p className="mt-0.5 whitespace-nowrap text-slate-500">
                        DOB: {s.dateOfBirth}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-700">
                      <p className="font-medium">{s.address}</p>
                      <p className="mt-0.5 text-slate-500">
                        {s.transportMode === "School Transport"
                          ? `Transport: ${s.vehicleRoute}`
                          : "Local"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditing({ ...s });
                            setError("");
                          }}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 hover:text-[#0F2942]"
                          title="Edit Student"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s)}
                          className="rounded-lg border border-slate-200 p-2 text-rose-600 hover:bg-rose-50"
                          title="Delete Student"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
      )}

      {/* Edit Student Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading text-lg font-extrabold text-[#0F2942]">
                  Edit Student Record
                </h3>
                <p className="text-xs font-semibold text-amber-700">
                  {editing.referenceId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-3.5 text-sm">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Student Name
                </label>
                <input
                  type="text"
                  value={editing.studentName}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      studentName: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 outline-none focus:border-[#0F2942]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Class
                  </label>
                  <select
                    value={editing.currentClass}
                    onChange={(e) =>
                      setEditing({ ...editing, currentClass: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-[#0F2942]"
                  >
                    {CLASS_ORDER.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value={PASSED_OUT_STATUS}>Passed Out</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Gender
                  </label>
                  <select
                    value={editing.gender}
                    onChange={(e) =>
                      setEditing({ ...editing, gender: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-[#0F2942]"
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={editing.dateOfBirth}
                    onChange={(e) =>
                      setEditing({ ...editing, dateOfBirth: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-[#0F2942]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={editing.mobileNumber}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        mobileNumber: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-[#0F2942]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Father&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={editing.fatherName}
                    onChange={(e) =>
                      setEditing({ ...editing, fatherName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-[#0F2942]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Mother&apos;s Name
                  </label>
                  <input
                    type="text"
                    value={editing.motherName}
                    onChange={(e) =>
                      setEditing({ ...editing, motherName: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-[#0F2942]"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-700">
                  Village / Address
                </label>
                <input
                  type="text"
                  value={editing.address}
                  onChange={(e) =>
                    setEditing({ ...editing, address: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-[#0F2942]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700">
                    Transport Mode
                  </label>
                  <select
                    value={editing.transportMode}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        transportMode: e.target.value,
                        vehicleRoute:
                          e.target.value === "Local" ? "" : editing.vehicleRoute,
                      })
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-[#0F2942]"
                  >
                    <option value="Local">Local</option>
                    <option value="School Transport">School Transport</option>
                  </select>
                </div>
                {editing.transportMode === "School Transport" && (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-700">
                      Vehicle / Route
                    </label>
                    <input
                      type="text"
                      value={editing.vehicleRoute ?? ""}
                      onChange={(e) =>
                        setEditing({
                          ...editing,
                          vehicleRoute: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-[#0F2942]"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0F2942] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#163B5E] disabled:opacity-60"
                >
                  {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

const DAYS = Array.from({ length: 31 }, (_, i) =>
  String(i + 1).padStart(2, "0")
);

const MONTHS = [
  { value: "01", label: "Jan" },
  { value: "02", label: "Feb" },
  { value: "03", label: "Mar" },
  { value: "04", label: "Apr" },
  { value: "05", label: "May" },
  { value: "06", label: "Jun" },
  { value: "07", label: "Jul" },
  { value: "08", label: "Aug" },
  { value: "09", label: "Sep" },
  { value: "10", label: "Oct" },
  { value: "11", label: "Nov" },
  { value: "12", label: "Dec" },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 32 }, (_, i) =>
  String(CURRENT_YEAR - 2 - i)
);

export function DobPicker({
  value,
  onChange,
  compact = false,
}: {
  value: string; // YYYY-MM-DD
  onChange: (newVal: string) => void;
  compact?: boolean;
}) {
  const [y = "", m = "", d = ""] = value ? value.split("-") : [];

  function update(nextD: string, nextM: string, nextY: string) {
    if (nextD && nextM && nextY) {
      onChange(`${nextY}-${nextM}-${nextD}`);
    } else if (!nextD && !nextM && !nextY) {
      onChange("");
    } else {
      // Partial selection preserved cleanly so user can pick in any order
      onChange(`${nextY || ""}-${nextM || ""}-${nextD || ""}`);
    }
  }

  const selectClass = compact
    ? "w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2.5 text-sm text-slate-900 outline-none focus:border-[#0F2942]"
    : "w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm sm:text-base text-slate-900 outline-none transition-all focus:border-[#0F2942] focus:ring-2 focus:ring-[#0F2942]/15";

  return (
    <div className="grid grid-cols-3 gap-2">
      <select
        aria-label="Birth Day"
        value={d}
        onChange={(e) => update(e.target.value, m, y)}
        className={selectClass}
      >
        <option value="">Day</option>
        {DAYS.map((day) => (
          <option key={day} value={day}>
            {day}
          </option>
        ))}
      </select>

      <select
        aria-label="Birth Month"
        value={m}
        onChange={(e) => update(d, e.target.value, y)}
        className={selectClass}
      >
        <option value="">Month</option>
        {MONTHS.map((mon) => (
          <option key={mon.value} value={mon.value}>
            {mon.label}
          </option>
        ))}
      </select>

      <select
        aria-label="Birth Year"
        value={y}
        onChange={(e) => update(d, m, e.target.value)}
        className={selectClass}
      >
        <option value="">Year</option>
        {YEARS.map((yr) => (
          <option key={yr} value={yr}>
            {yr}
          </option>
        ))}
      </select>
    </div>
  );
}

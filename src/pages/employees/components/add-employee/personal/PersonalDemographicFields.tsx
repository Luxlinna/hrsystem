import { memo, useMemo } from "react";
import type { PersonalSectionProps } from "./types";

const MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export const PersonalDemographicFields = memo(function PersonalDemographicFields({
  form,
  onChange,
}: PersonalSectionProps) {
  const [dobYear, dobMonth, dobDay] = useMemo(() => {
    if (!form.date_of_birth) return ["", "", ""];
    const parts = form.date_of_birth.split("-");
    if (parts.length === 3) return [parts[0], parts[1], parts[2]];
    return ["", "", ""];
  }, [form.date_of_birth]);

  const handleDobPartChange = (type: "year" | "month" | "day", value: string) => {
    let y = dobYear || "2000";
    let m = dobMonth || "01";
    let d = dobDay || "01";

    if (type === "year") y = value;
    if (type === "month") m = value;
    if (type === "day") d = value.padStart(2, "0");

    if (y && m && d) {
      const fullDate = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
      onChange("date_of_birth", fullDate);
    }
  };

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const arr: number[] = [];
    for (let y = currentYear - 16; y >= currentYear - 80; y--) arr.push(y);
    return arr;
  }, []);

  const days = useMemo(() => {
    const arr: string[] = [];
    for (let i = 1; i <= 31; i++) arr.push(String(i).padStart(2, "0"));
    return arr;
  }, []);

  return (
    <div className="space-y-4 pt-2">
      {/* Date of Birth */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Date of Birth <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-2 grid grid-cols-3 gap-2">
          <select
            value={dobDay}
            onChange={(e) => handleDobPartChange("day", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="">Day</option>
            {days.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={dobMonth}
            onChange={(e) => handleDobPartChange("month", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="">Month</option>
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={dobYear}
            onChange={(e) => handleDobPartChange("year", e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="">Year</option>
            {years.map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Gender <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-2">
          <select
            value={form.gender || "Male"}
            onChange={(e) => onChange("gender", e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Marital Status */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Marital Status <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-2">
          <select
            value={form.marital_status || "Single"}
            onChange={(e) => onChange("marital_status", e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
          </select>
        </div>
      </div>

      {/* Nationality */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <label className="text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
          Nationality <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-2">
          <select
            value={form.nationality || "Khmer"}
            onChange={(e) => onChange("nationality", e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="Khmer">Khmer</option>
            <option value="Chinese">Chinese</option>
            <option value="Vietnamese">Vietnamese</option>
            <option value="Thai">Thai</option>
            <option value="American">American</option>
            <option value="British">British</option>
            <option value="French">French</option>
            <option value="Australian">Australian</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      {/* Resident & Fringe Benefit Checkboxes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
        <div className="sm:text-right sm:pr-4" />
        <div className="sm:col-span-2 flex items-center gap-6">
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.is_resident !== false}
              onChange={(e) => onChange("is_resident", e.target.checked)}
              className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] border-slate-300 cursor-pointer"
            />
            <span>Resident</span>
          </label>
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(form.fringe_benefit)}
              onChange={(e) => onChange("fringe_benefit", e.target.checked)}
              className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] border-slate-300 cursor-pointer"
            />
            <span>Fringe Benefit</span>
          </label>
        </div>
      </div>
    </div>
  );
});


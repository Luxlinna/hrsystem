import { useState } from "react";

export const REVIEW_TYPES = [
  "Annual Review", "Semi-Annual Review", "Quarterly Review",
  "Probation Review", "Confirmation Review", "Special Review",
];

export const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Unsatisfactory", color: "#ef4444" },
  2: { label: "Needs Improvement", color: "#f97316" },
  3: { label: "Meets Expectations", color: "#eab308" },
  4: { label: "Very Good", color: "#3b82f6" },
  5: { label: "Excellent", color: "#22c55e" },
};

export const CRITERIA = [
  { key: "quality_of_work", label: "Quality of Work", icon: "ri-medal-line" },
  { key: "productivity", label: "Productivity", icon: "ri-speed-line" },
  { key: "attendance", label: "Attendance & Punctuality", icon: "ri-calendar-check-line" },
  { key: "communication", label: "Communication", icon: "ri-chat-3-line" },
  { key: "teamwork", label: "Teamwork", icon: "ri-team-line" },
  { key: "problem_solving", label: "Problem Solving", icon: "ri-lightbulb-line" },
  { key: "responsibility", label: "Responsibility", icon: "ri-shield-check-line" },
  { key: "initiative", label: "Initiative", icon: "ri-rocket-line" },
  { key: "technical", label: "Technical Skills", icon: "ri-tools-line" },
  { key: "goal_achievement", label: "Goal Achievement", icon: "ri-trophy-line" },
] as const;

export function StarRating({ value, onChange, showLabel = false }: {
  value: number;
  onChange: (v: number) => void;
  showLabel?: boolean;
}) {
  const [hover, setHover] = useState(0);
  const display = hover || value;
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star} type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="text-[20px] transition-transform hover:scale-115 cursor-pointer leading-none"
          style={{ color: display >= star ? RATING_LABELS[Math.round(display)]?.color ?? "#eab308" : "#e5e7eb" }}
        >★</button>
      ))}
      {showLabel && (
        <span className="ml-2 text-[11px] font-bold px-2 py-0.5 rounded-full"
          style={{ background: (RATING_LABELS[value]?.color ?? "#eab308") + "18", color: RATING_LABELS[value]?.color ?? "#eab308" }}>
          {value} – {RATING_LABELS[value]?.label ?? ""}
        </span>
      )}
    </div>
  );
}

export function SectionHeader({ number, title, icon }: { number: number; title: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 rounded-full bg-[#253C7D] text-white flex items-center justify-center text-[13px] font-bold shrink-0">{number}</div>
      <div className="flex items-center gap-2">
        <i className={`${icon} text-[#253C7D] text-[16px]`} />
        <h3 className="text-[15px] font-bold text-gray-800">{title}</h3>
      </div>
    </div>
  );
}

export function TA({ label, value, onChange, placeholder, rows = 2 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-gray-600 mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] resize-none bg-gray-50 focus:bg-white transition-colors" />
    </div>
  );
}

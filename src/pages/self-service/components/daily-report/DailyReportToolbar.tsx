import React from "react";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const fmtDateLabel = (ymd: string) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

interface DailyReportToolbarProps {
  view: "day" | "week" | "month" | "year";
  setView: (v: "day" | "week" | "month" | "year") => void;
  anchor: Date;
  shift: (delta: number) => void;
  setAnchor: (d: Date) => void;
  weekDays: string[];
  openAdd: () => void;
}

export function DailyReportToolbar({
  view,
  setView,
  anchor,
  shift,
  setAnchor,
  weekDays,
  openAdd,
}: DailyReportToolbarProps) {
  const year = anchor.getFullYear();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {(["day", "week", "month", "year"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-semibold capitalize cursor-pointer ${
                view === v ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shift(-1)}
            className="w-8 h-8 shrink-0 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <i className="ri-arrow-left-s-line" />
          </button>
          <p className="text-[13px] font-semibold text-gray-800 min-w-[140px] sm:min-w-[160px] text-center">
            {view === "day" &&
              anchor.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            {view === "week" && `${fmtDateLabel(weekDays[0])} – ${fmtDateLabel(weekDays[6])}`}
            {view === "month" && `${MONTHS[anchor.getMonth()]} ${year}`}
            {view === "year" && year}
          </p>
          <button
            onClick={() => shift(1)}
            className="w-8 h-8 shrink-0 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <i className="ri-arrow-right-s-line" />
          </button>
        </div>
        <button
          onClick={() => setAnchor(new Date())}
          className="text-[#253C7D] text-[12px] font-medium hover:underline cursor-pointer shrink-0"
        >
          Today
        </button>
      </div>
      <button
        onClick={() => openAdd()}
        className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-[#253C7D] text-white px-4 py-2.5 sm:py-2 rounded-lg text-[12px] font-semibold hover:bg-[#1F336A] cursor-pointer"
      >
        <i className="ri-add-line" /> Add Entry
      </button>
    </div>
  );
}

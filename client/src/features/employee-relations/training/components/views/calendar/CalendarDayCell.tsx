import React from "react";
import type { Course } from "../../../types";
import type { CalendarEvent } from "./CalendarDayModal";

interface CalendarDay {
  date: Date;
  dateStr: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

interface CalendarDayCellProps {
  day: CalendarDay;
  idx: number;
  canManage: boolean;
  onSelectCourse: (c: Course) => void;
  onNewCourse?: (initialDate?: string) => void;
  onOpenMore: (dateStr: string, events: CalendarEvent[]) => void;
}

export function CalendarDayCell({
  day,
  idx,
  canManage,
  onSelectCourse,
  onNewCourse,
  onOpenMore,
}: CalendarDayCellProps) {
  return (
    <div
      key={`${day.dateStr}-${idx}`}
      onClick={(e) => {
        if (e.target === e.currentTarget && canManage && onNewCourse) {
          onNewCourse(day.dateStr);
        }
      }}
      className={`min-h-[115px] p-2 flex flex-col justify-between transition-colors group/day ${
        canManage ? "cursor-pointer hover:bg-slate-50/70" : ""
      } ${day.isCurrentMonth ? "bg-white" : "bg-gray-50/40 opacity-60"} ${
        day.isToday ? "bg-blue-50/30" : ""
      }`}
      title={canManage ? `Click to schedule a training on ${day.dateStr}` : undefined}
    >
      {/* Day Number Header & Add Button */}
      <div className="flex items-center justify-between mb-1.5 pointer-events-auto">
        <span
          className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
            day.isToday
              ? "bg-[#253C7D] text-white shadow-2xs font-extrabold"
              : day.isCurrentMonth
              ? "text-gray-800"
              : "text-gray-400"
          }`}
        >
          {day.dayNum}
        </span>

        <div className="flex items-center gap-1">
          {day.events.length > 0 && (
            <span className="text-[10px] font-bold text-gray-400">
              {day.events.length} {day.events.length === 1 ? "item" : "items"}
            </span>
          )}
          {canManage && onNewCourse && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNewCourse(day.dateStr);
              }}
              title={`Schedule training on ${day.dateStr}`}
              className="opacity-0 group-hover/day:opacity-100 p-0.5 text-[#253C7D] hover:bg-blue-100/70 rounded transition-all cursor-pointer"
            >
              <i className="ri-add-line font-bold text-xs" />
            </button>
          )}
        </div>
      </div>

      {/* Events Stack on this Day */}
      <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-none flex-1">
        {day.events.slice(0, 2).map((ev) => {
          let pillClass = "bg-blue-50 text-blue-800 border-blue-200/60";
          if (ev.type === "due") {
            pillClass = ev.isOverdue
              ? "bg-rose-100 text-rose-800 border-rose-300 font-bold"
              : ev.isDueSoon
              ? "bg-amber-100 text-amber-800 border-amber-300 font-bold"
              : "bg-sky-50 text-sky-800 border-sky-200";
          } else if (ev.type === "completed") {
            pillClass = "bg-emerald-50 text-emerald-800 border-emerald-200";
          }

          return (
            <div
              key={ev.id}
              onClick={(e) => {
                e.stopPropagation();
                if (ev.course) {
                  onSelectCourse({
                    ...ev.course,
                    scheduled_date: ev.course.scheduled_date || ev.date,
                  });
                }
              }}
              className={`p-1 rounded-md text-[10px] border leading-tight truncate cursor-pointer hover:opacity-90 transition-opacity ${pillClass}`}
              title={`${ev.title} — ${ev.subtitle}`}
            >
              <p className="font-bold truncate">{ev.title}</p>
              <p className="text-[9px] opacity-75 truncate">{ev.subtitle}</p>
            </div>
          );
        })}

        {day.events.length > 2 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenMore(day.dateStr, day.events);
            }}
            className="w-full text-center text-[10px] font-bold text-[#253C7D] hover:bg-blue-50 py-0.5 rounded cursor-pointer transition-colors"
          >
            +{day.events.length - 2} more
          </button>
        )}
      </div>
    </div>
  );
}

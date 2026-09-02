import React from "react";
import type { Course, Enrollment } from "../../../types";

export interface CalendarEvent {
  id: string;
  date: string;
  type: "due" | "completed";
  title: string;
  subtitle: string;
  status?: string;
  course?: Course;
  enrollment?: Enrollment;
  isOverdue?: boolean;
  isDueSoon?: boolean;
}

interface CalendarDayModalProps {
  selectedDayEvents: { date: string; events: CalendarEvent[] } | null;
  onClose: () => void;
  onSelectCourse: (c: Course) => void;
  canManage: boolean;
  onNewCourse?: (initialDate?: string) => void;
}

export function CalendarDayModal({
  selectedDayEvents,
  onClose,
  onSelectCourse,
  canManage,
  onNewCourse,
}: CalendarDayModalProps) {
  if (!selectedDayEvents) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-2xs animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">
              Training Schedule &amp; Deadlines
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              {new Date(selectedDayEvents.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {selectedDayEvents.events.map((ev) => (
            <div
              key={ev.id}
              onClick={() => {
                if (ev.course) {
                  onSelectCourse({
                    ...ev.course,
                    scheduled_date: ev.course.scheduled_date || ev.date,
                  });
                  onClose();
                }
              }}
              className="p-3 rounded-xl border border-gray-100 hover:border-[#253C7D]/30 bg-gray-50/60 hover:bg-white transition-all cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">{ev.title}</span>
                {ev.type === "due" && (
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      ev.isOverdue
                        ? "bg-rose-100 text-rose-800"
                        : ev.isDueSoon
                        ? "bg-amber-100 text-amber-800"
                        : "bg-sky-100 text-sky-800"
                    }`}
                  >
                    {ev.isOverdue ? "EXPIRED / OVERDUE" : ev.isDueSoon ? "DUE SOON" : "SCHEDULED"}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">{ev.subtitle}</p>
            </div>
          ))}
        </div>

        {canManage && onNewCourse && (
          <div className="pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => {
                const dateToUse = selectedDayEvents.date;
                onClose();
                onNewCourse(dateToUse);
              }}
              className="w-full py-2.5 bg-[#253C7D] text-white rounded-xl text-xs font-bold hover:bg-[#1E293B] transition-colors shadow-2xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <i className="ri-add-line font-bold text-sm" />
              Schedule Training Course on this Day
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

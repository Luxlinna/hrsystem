import React from "react";
import { Link } from "react-router-dom";
import type { OutsideWorkRecord } from "./OutsideWorkCard";

function fmtDuration(from: string, to: string | null) {
  const ms = (to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime();
  if (ms < 0) return "--";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

interface OutsideWorkActiveBannerProps {
  activeRecord: OutsideWorkRecord;
}

export function OutsideWorkActiveBanner({ activeRecord }: OutsideWorkActiveBannerProps) {
  return (
    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <i className="ri-map-pin-user-fill text-emerald-600 text-lg" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Currently Working Outside</p>
          <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{activeRecord.title}</p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
              <i className="ri-login-circle-line" />
              {(() => {
                if (!activeRecord.work_checked_in_at) return "";
                const d = new Date(activeRecord.work_checked_in_at);
                const isEarlier = d.toLocaleDateString("en-CA") < new Date().toLocaleDateString("en-CA");
                if (isEarlier) {
                  return `Today: 8:00 AM (Started ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
                }
                return `Checked in ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
              })()}
            </span>
            <span className="flex items-center gap-1 text-[11px] text-gray-600 font-semibold">
              <i className="ri-timer-line" />
              {(() => {
                if (!activeRecord.work_checked_in_at) return "--";
                const d = new Date(activeRecord.work_checked_in_at);
                const isEarlier = d.toLocaleDateString("en-CA") < new Date().toLocaleDateString("en-CA");
                if (isEarlier) {
                  const today8am = new Date();
                  today8am.setHours(8, 0, 0, 0);
                  return fmtDuration(today8am.toISOString(), null);
                }
                return fmtDuration(activeRecord.work_checked_in_at, null);
              })()}
            </span>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
          <Link
            to="/tasks"
            className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#253C7D] hover:bg-[#1f3268] px-3 py-1.5 rounded-lg transition-colors"
          >
            <i className="ri-task-line" />
            Go to Tasks
          </Link>
        </div>
      </div>
      {activeRecord.work_address && (
        <p className="text-[11px] text-gray-600 mt-2 ml-13 flex items-center gap-1">
          <i className="ri-map-pin-2-fill text-emerald-500" />
          {activeRecord.work_address}
        </p>
      )}
    </div>
  );
}

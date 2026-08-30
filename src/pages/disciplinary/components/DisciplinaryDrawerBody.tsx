import { memo } from "react";
import type { DisciplinaryRecord } from "../types";

interface DisciplinaryDrawerBodyProps {
  record: DisciplinaryRecord;
  isOverdue: boolean;
}

export const DisciplinaryDrawerBody = memo(function DisciplinaryDrawerBody({
  record,
  isOverdue,
}: DisciplinaryDrawerBodyProps) {
  const emp = record.employees;

  return (
    <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
      {/* Employee Profile Card */}
      {emp && (
        <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-gray-200/80 rounded-2xl">
          {emp.avatar_url ? (
            <img src={emp.avatar_url} alt="" className="w-11 h-11 rounded-2xl object-cover shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center text-sm font-black shrink-0">
              {emp.first_name[0]}{emp.last_name[0]}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-gray-900">{emp.first_name} {emp.last_name}</p>
            <p className="text-xs text-gray-500">{emp.role}</p>
            <p className="text-[10px] text-gray-400 font-medium">{emp.department}</p>
          </div>
        </div>
      )}

      {/* Case Title */}
      <div>
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
          Case Title
        </span>
        <h3 className="text-base font-black text-gray-900">{record.title}</h3>
      </div>

      {/* Incident Description */}
      {record.description && (
        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 space-y-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Incident Summary &amp; Statement:
          </span>
          <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line">
            {record.description}
          </p>
        </div>
      )}

      {/* Metadata Grid */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-gray-100 space-y-2.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Incident Date:</span>
          <span className="font-bold text-gray-800">
            {record.incident_date
              ? new Date(record.incident_date + "T00:00:00").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "—"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Follow-up Target Date:</span>
          <span className={isOverdue ? "text-rose-600 font-black flex items-center gap-1" : "font-bold text-gray-800"}>
            {record.follow_up_date
              ? new Date(record.follow_up_date + "T00:00:00").toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })
              : "None set"}
            {isOverdue && " (Overdue)"}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Logged By:</span>
          <span className="font-bold text-gray-800">{record.created_by}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-medium">Created On:</span>
          <span className="font-bold text-gray-800">
            {new Date(record.created_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>
      </div>
    </div>
  );
});

import { memo } from "react";
import type { StaffWorkloadItem } from "../../types";

interface WorkloadDrawerProps {
  show: boolean;
  onClose: () => void;
  weekDates: Date[];
  staffWorkload: StaffWorkloadItem[];
}

export const WorkloadDrawer = memo(function WorkloadDrawer({
  show,
  onClose,
  weekDates,
  staffWorkload,
}: WorkloadDrawerProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
      <div className="w-full sm:w-[480px] bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <i className="ri-user-star-line text-amber-400" />
              <span>Weekly Staff Workload</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Hours & shift allocation for {weekDates[0]?.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – {weekDates[6]?.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-2.5">
          {staffWorkload.map(({ employee: emp, totalHours, shiftCount, isOvertime, isUnscheduled }) => (
            <div
              key={emp.id}
              className={`p-3 rounded-2xl border transition-all ${
                isOvertime
                  ? "bg-amber-50/60 border-amber-200"
                  : isUnscheduled
                    ? "bg-slate-50/60 border-slate-200/80 opacity-70"
                    : "bg-white border-slate-200 shadow-2xs"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-[#253C7D]/10 text-[#253C7D] text-xs font-bold flex items-center justify-center overflow-hidden shrink-0">
                    {emp.avatar_url ? (
                      <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      `${emp.first_name[0] || ""}${emp.last_name[0] || ""}`
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{emp.first_name} {emp.last_name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{emp.role || "Staff"} &middot; {emp.department}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`text-xs font-extrabold ${isOvertime ? "text-amber-600" : isUnscheduled ? "text-slate-400" : "text-emerald-600"}`}>
                    {totalHours} hrs
                  </span>
                  <span className="text-[10px] text-slate-400 block">{shiftCount} shift{shiftCount === 1 ? "" : "s"}</span>
                </div>
              </div>

              <div className="mt-2.5 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full ${isOvertime ? "bg-amber-500" : totalHours >= 30 ? "bg-emerald-500" : "bg-[#253C7D]"}`}
                  style={{ width: `${Math.min(100, (totalHours / 40) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

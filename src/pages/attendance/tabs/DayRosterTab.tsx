import { memo } from "react";
import { Link } from "react-router-dom";
import type { EmployeeSummaryItem } from "../types";
import { formatTime, calcHours, initials } from "../constants";

interface DayRosterTabProps {
  rosterDate: string;
  setRosterDate: (date: string) => void;
  todayYMD: string;
  filteredSummary: EmployeeSummaryItem[];
  onChangeRosterDate: (offset: number) => void;
}

export const DayRosterTab = memo(function DayRosterTab({
  rosterDate,
  setRosterDate,
  todayYMD,
  filteredSummary,
  onChangeRosterDate,
}: DayRosterTabProps) {
  return (
    <div>
      {/* Historical Date Selector Toolbar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChangeRosterDate(-1)}
            className="w-8 h-8 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
            title="Previous Day"
          >
            <i className="ri-arrow-left-s-line text-base font-bold" />
          </button>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={rosterDate}
              onChange={(e) => setRosterDate(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
            />
            {rosterDate !== todayYMD && (
              <button
                onClick={() => setRosterDate(todayYMD)}
                className="px-3 py-1.5 bg-[#253C7D]/10 text-[#253C7D] hover:bg-[#253C7D]/20 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Jump to Today
              </button>
            )}
          </div>

          <button
            onClick={() => onChangeRosterDate(1)}
            disabled={rosterDate >= todayYMD}
            className="w-8 h-8 rounded-xl border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next Day"
          >
            <i className="ri-arrow-right-s-line text-base font-bold" />
          </button>
        </div>

        <div className="text-xs text-gray-500 font-semibold">
          Viewing Roster for:{" "}
          <span className="font-extrabold text-gray-900">
            {new Date(rosterDate + "T00:00:00").toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Cards for this specific Date */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredSummary.map((emp) => {
          const rRecord = emp.rosterRecord;
          const isLate = rRecord?.status === "late";
          const isWorking = rRecord?.clock_in && !rRecord?.clock_out && rosterDate === todayYMD;
          const isDone = rRecord?.clock_in && rRecord?.clock_out;

          return (
            <div
              key={emp.id}
              className={`bg-white rounded-3xl border p-5 shadow-2xs transition-all relative overflow-hidden flex flex-col justify-between ${
                isWorking
                  ? "border-emerald-300 ring-2 ring-emerald-400/20"
                  : isLate
                  ? "border-amber-300"
                  : isDone
                  ? "border-gray-200/80"
                  : "border-gray-200/60 bg-gray-50/40"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-sm overflow-hidden shadow-xs">
                        {emp.avatar_url ? (
                          <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{initials(emp.first_name, emp.last_name)}</span>
                        )}
                      </div>
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                          isWorking
                            ? "bg-emerald-500 animate-ping"
                            : isDone
                            ? "bg-sky-500"
                            : isLate
                            ? "bg-amber-500"
                            : "bg-gray-300"
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <Link
                        to={`/employees/${emp.id}`}
                        className="font-extrabold text-gray-900 hover:text-[#253C7D] transition-colors truncate text-sm block"
                      >
                        {emp.first_name} {emp.last_name}
                      </Link>
                      <p className="text-[11px] text-gray-400 truncate">{emp.role}</p>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.2 rounded-md inline-block mt-0.5">
                        {emp.department}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status Banner */}
                <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs mb-2">
                  {rRecord ? (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-[11px]">Check In:</span>
                        <span className="font-bold text-gray-900">{formatTime(rRecord.clock_in)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500 text-[11px]">Check Out:</span>
                        <span className="font-bold text-gray-900">
                          {isWorking ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Working Now
                            </span>
                          ) : (
                            formatTime(rRecord.clock_out)
                          )}
                        </span>
                      </div>
                      {rRecord.clock_in && rRecord.clock_out && (
                        <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
                          <span className="text-gray-500 text-[11px]">Worked:</span>
                          <span className="font-bold text-[#253C7D]">
                            {calcHours(rRecord.clock_in, rRecord.clock_out)}
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center text-[11px] font-medium py-1">
                      No record on this date
                    </p>
                  )}
                </div>
              </div>

              {/* Bottom Stats */}
              <div className="flex items-center justify-between text-[11px] pt-3 border-t border-gray-100 text-gray-400">
                <span>Attendance: {emp.attendanceRate}%</span>
                <span className="text-[#253C7D] font-bold">{emp.totalHours}h logged</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

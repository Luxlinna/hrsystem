import { keyLabels, ATTENDANCE_SCHEDULE_KEYS } from "../constants";

interface AttendanceScheduleCardProps {
  getVal: (key: string) => string;
  updateValue: (key: string, value: string) => void;
}

export function AttendanceScheduleCard({
  getVal,
  updateValue,
}: AttendanceScheduleCardProps) {
  return (
    <div className="w-full border border-[#253C7D]/30 bg-white rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-start gap-3 bg-[#253C7D] text-white p-5 sm:p-6">
        <div className="w-10 h-10 rounded-lg bg-white text-[#253C7D] flex items-center justify-center shrink-0">
          <i className="ri-calendar-schedule-line text-lg" />
        </div>
        <div>
          <h3 className="text-[15px] font-semibold">Attendance Schedule</h3>
          <p className="text-[12px] text-white/75 mt-0.5">
            Control working days, shift hours, late arrival, early checkout,
            and reminder timing.
          </p>
        </div>
      </div>
      <div className="p-5 sm:p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ATTENDANCE_SCHEDULE_KEYS.map((key) => (
            <div key={key} className="min-w-0">
              <label className="text-[12px] font-semibold text-gray-800">
                {keyLabels[key]}
              </label>
              <div className="flex gap-2 mt-1">
                <input
                  type={
                    key.includes("time")
                      ? "time"
                      : key === "working_days"
                        ? "text"
                        : "number"
                  }
                  value={getVal(key)}
                  onChange={(e) => updateValue(key, e.target.value)}
                  className="min-w-0 flex-1 px-4 py-2.5 bg-white border-2 border-gray-200 rounded-lg text-[13px] text-gray-900 focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-500 border-t border-gray-200 pt-4">
          Working days use day numbers: Sunday 0, Monday 1 through Saturday
          6. Example:{" "}
          <span className="font-semibold text-gray-700">1,2,3,4,5</span> for
          Monday–Friday, or{" "}
          <span className="font-semibold text-gray-700">1,2,3,4,5,6</span> to
          add a Saturday half day (Saturday uses its own start/end times
          above). The break window (unpaid) is deducted from worked hours —
          e.g. an 08:00–17:00 weekday with a 12:00–13:00 break logs 8
          hours.
        </p>
      </div>
    </div>
  );
}

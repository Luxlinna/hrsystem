import { useState, memo } from "react";
import type { ManagedShift, ShiftTimeTableRow } from "./types";

interface CreateShiftManagerFormProps {
  initialData?: ManagedShift | null;
  onBack: () => void;
  onSave: (shift: ManagedShift) => void;
}

export const CreateShiftManagerForm = memo(function CreateShiftManagerForm({
  initialData,
  onBack,
  onSave,
}: CreateShiftManagerFormProps) {
  const isEditing = Boolean(initialData);

  const [code, setCode] = useState(initialData?.code || "");
  const [color, setColor] = useState(initialData?.color || "#2563EB");
  const [name, setName] = useState(initialData?.name || "");
  const [mustCheckIn, setMustCheckIn] = useState(initialData?.must_mark_check_in ?? true);
  const [mustCheckOut, setMustCheckOut] = useState(initialData?.must_mark_check_out ?? true);

  // Time table rows
  const [timeTable, setTimeTable] = useState<ShiftTimeTableRow[]>(
    initialData?.time_table || [
      { id: "1", time_in: "09:00", time_out: "18:00", break_minutes: 60, total_work_hours: 8 },
    ]
  );

  const [remark, setRemark] = useState(initialData?.remark || "");

  // Helpers to add rows
  const handleAddTimeTableRow = () => {
    setTimeTable((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        time_in: "09:00",
        time_out: "18:00",
        break_minutes: 0,
        total_work_hours: 8,
      },
    ]);
  };

  const handleRemoveTimeTableRow = (id: string) => {
    setTimeTable((prev) => prev.filter((r) => r.id !== id));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      alert("Please provide both Shift Code and Shift Name.");
      return;
    }

    const calculatedTotalHours = timeTable.reduce((acc, row) => acc + (row.total_work_hours || 0), 0);

    const shiftData: ManagedShift = {
      id: initialData?.id || `shift-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim(),
      color,
      time_display: timeTable.map((t) => `${t.time_in} - ${t.time_out}`).join(" / ") || "Flexible",
      total_work_hours: calculatedTotalHours || 8,
      must_mark_check_in: mustCheckIn,
      must_mark_check_out: mustCheckOut,
      time_table: timeTable,
      remark: remark.trim(),
    };

    setIsSubmitting(true);
    try {
      await onSave(shiftData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="attendance-hub min-h-screen bg-[#F8F9FB] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 font-sans space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">
            <span>Workforce Operations</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span>Time &amp; Attendance</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] dark:text-sky-400 font-bold">Shifts</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
            {isEditing ? "Edit Shift" : "Create Shift"}
          </h1>
        </div>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200/80 dark:border-slate-800 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <i className="ri-arrow-left-line text-sm text-[#253C7D] dark:text-sky-400" />
          <span>Back</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CARD 1: SHIFT INFO */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider pb-3 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
            <i className="ri-information-line text-base text-[#253C7D] dark:text-sky-400" />
            Shift Info
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Shift Code */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Shift Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FAI1, 1704, 2005"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              {/* Shift Color */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                  Shift Color <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-12 h-9 p-0.5 rounded-xl border border-gray-200 dark:border-slate-700 cursor-pointer bg-white dark:bg-slate-800"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>
            </div>

            {/* Shift Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Shift Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 07:00AM - 11:00PM & 06:30PM - 10:30PM"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            {/* Checkboxes: Must Mark Check In & Out */}
            <div className="flex items-center gap-6 pt-1">
              <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mustCheckIn}
                  onChange={(e) => setMustCheckIn(e.target.checked)}
                  className="rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                />
                <span>Must Mark Check In</span>
              </label>

              <label className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={mustCheckOut}
                  onChange={(e) => setMustCheckOut(e.target.checked)}
                  className="rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                />
                <span>Must Mark Check Out</span>
              </label>
            </div>
          </div>
        </div>

        {/* CARD 2: TIME TABLE */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <i className="ri-time-line text-base text-[#253C7D] dark:text-sky-400" />
              Time Table
            </h3>
            <button
              type="button"
              onClick={handleAddTimeTableRow}
              className="text-xs font-bold text-[#253C7D] dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <i className="ri-add-circle-line" />
              <span>Add Shift Window</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200/80 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-slate-800/60 text-gray-500 dark:text-slate-400 font-bold border-b border-gray-200/80 dark:border-slate-800">
                  <th className="py-2.5 px-3 w-10 text-center">No.</th>
                  <th className="py-2.5 px-3">Time In</th>
                  <th className="py-2.5 px-3">Time Out</th>
                  <th className="py-2.5 px-3">Allow Break Min</th>
                  <th className="py-2.5 px-3">Total Work Hours</th>
                  <th className="py-2.5 px-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {timeTable.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-gray-400">
                      No records found
                    </td>
                  </tr>
                ) : (
                  timeTable.map((row, idx) => (
                    <tr key={row.id}>
                      <td className="py-2.5 px-3 text-center font-bold text-gray-400">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="time"
                          value={row.time_in}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTimeTable((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, time_in: val } : r))
                            );
                          }}
                          className="px-2 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="time"
                          value={row.time_out}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTimeTable((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, time_out: val } : r))
                            );
                          }}
                          className="px-2 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          value={row.break_minutes}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setTimeTable((prev) =>
                              prev.map((r) => (r.id === row.id ? { ...r, break_minutes: val } : r))
                            );
                          }}
                          className="w-20 px-2 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-semibold"
                        />
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          type="number"
                          step="0.5"
                          value={row.total_work_hours}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            setTimeTable((prev) =>
                              prev.map((r) =>
                                r.id === row.id ? { ...r, total_work_hours: val } : r
                              )
                            );
                          }}
                          className="w-20 px-2 py-1 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveTimeTableRow(row.id)}
                          className="text-gray-400 hover:text-rose-500 cursor-pointer"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Remark */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-slate-800 shadow-2xs space-y-2">
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300">
            Remark
          </label>
          <textarea
            rows={3}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Remark"
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] transition-all resize-y shadow-2xs"
          />
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 flex items-center gap-3 border-t border-gray-200 dark:border-slate-800">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-2 transition-all"
          >
            <i className={isSubmitting ? "ri-loader-4-line animate-spin text-sm" : "ri-save-3-line text-sm"} />
            <span>{isSubmitting ? "Saving..." : "Save Shift"}</span>
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onBack}
            className="px-4 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 disabled:opacity-50 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <i className="ri-close-line text-sm text-gray-400" />
            <span>Discard</span>
          </button>
        </div>
      </form>
    </div>
  );
});

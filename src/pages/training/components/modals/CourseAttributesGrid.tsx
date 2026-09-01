import { memo } from "react";
import type { CourseFormState } from "../../types";

interface CourseAttributesGridProps {
  form: CourseFormState;
  setForm: React.Dispatch<React.SetStateAction<CourseFormState>>;
  isTimeBasedDuration: boolean;
}

export const CourseAttributesGrid = memo(function CourseAttributesGrid({
  form,
  setForm,
  isTimeBasedDuration,
}: CourseAttributesGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      <div>
        <label className="block font-bold text-gray-800 text-xs mb-1.5">Category</label>
        <input
          type="text"
          value={form.category}
          onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
          placeholder="e.g. Compliance, Tech, Leadership"
          className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:border-[#253C7D]"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block font-bold text-gray-800 text-xs">Duration (Hours)</label>
          {isTimeBasedDuration && (
            <span className="text-[10px] font-extrabold text-[#253C7D] bg-blue-100/80 px-1.5 py-0.5 rounded flex items-center gap-0.5">
              <i className="ri-flashlight-line text-[10px]" /> Auto
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="number"
            step="0.1"
            min="0"
            readOnly={isTimeBasedDuration}
            value={form.duration_hours}
            onChange={(e) =>
              !isTimeBasedDuration &&
              setForm((prev) => ({ ...prev, duration_hours: e.target.value }))
            }
            placeholder="e.g. 2"
            className={`w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all ${
              isTimeBasedDuration
                ? "bg-slate-100/90 border-gray-200 text-gray-800 cursor-not-allowed select-none pr-8"
                : "bg-gray-50/80 border-gray-200 text-gray-900 focus:outline-none focus:bg-white focus:border-[#253C7D]"
            }`}
          />
          {isTimeBasedDuration && (
            <div
              className="absolute right-2.5 top-2.5 text-gray-400"
              title="Auto-calculated from Start Time and End Time"
            >
              <i className="ri-lock-line text-sm" />
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block font-bold text-gray-800 text-xs mb-1.5">Instructor / Host</label>
        <input
          type="text"
          value={form.instructor}
          onChange={(e) => setForm((prev) => ({ ...prev, instructor: e.target.value }))}
          placeholder="e.g. Internal Lead or External Trainer"
          className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:border-[#253C7D]"
        />
      </div>

      <div>
        <label className="block font-bold text-gray-800 text-xs mb-1.5">Format</label>
        <select
          value={form.format}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              format: e.target.value as CourseFormState["format"],
            }))
          }
          className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:bg-white focus:border-[#253C7D] cursor-pointer"
        >
          <option value="in_person">In-Person Classroom</option>
          <option value="online">Online / Self-Paced</option>
          <option value="hybrid">Hybrid (Online + Live)</option>
        </select>
      </div>
    </div>
  );
});

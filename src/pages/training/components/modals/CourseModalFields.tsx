import { memo, useState } from "react";
import type { CourseFormState, Employee } from "../../types";

interface CourseModalFieldsProps {
  form: CourseFormState;
  setForm: React.Dispatch<React.SetStateAction<CourseFormState>>;
  employees?: Employee[];
}

export const CourseModalFields = memo(function CourseModalFields({
  form,
  setForm,
  employees = [],
}: CourseModalFieldsProps) {
  const [empSearch, setEmpSearch] = useState("");

  const filteredEmployees = employees.filter((e) => {
    if (!empSearch) return true;
    const name = `${e.first_name} ${e.last_name} ${e.department || ""}`.toLowerCase();
    return name.includes(empSearch.toLowerCase());
  });

  const toggleEmployee = (empId: string) => {
    const list = form.invited_employee_ids || [];
    if (list.includes(empId)) {
      setForm({ ...form, invited_employee_ids: list.filter((id) => id !== empId) });
    } else {
      setForm({ ...form, invited_employee_ids: [...list, empId] });
    }
  };

  const handleSelectAll = () => {
    if (form.invited_employee_ids?.length === filteredEmployees.length) {
      setForm({ ...form, invited_employee_ids: [] });
    } else {
      setForm({ ...form, invited_employee_ids: filteredEmployees.map((e) => e.id) });
    }
  };

  return (
    <>
      <div>
        <label className="block font-bold text-gray-700 mb-1">
          Course / Session Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="e.g. Workplace Safety & Compliance 2026"
          className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none focus:border-[#253C7D]"
        />
      </div>

      {/* Schedule: Specific Date & Time */}
      <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-100/80 space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-extrabold text-[#253C7D]">
          <i className="ri-calendar-event-line text-sm" />
          <span>Specific Date, Time &amp; Location</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div>
            <label className="block font-bold text-gray-700 text-[11px] mb-1">Session Date</label>
            <input
              type="date"
              value={form.scheduled_date}
              onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 text-[11px] mb-1">Start Time</label>
            <input
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-gray-700 text-[11px] mb-1">End Time</label>
            <input
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-gray-700 text-[11px] mb-1">Location / Meeting Link</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. Executive Meeting Room A, or Google Meet URL"
            className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Category</label>
          <input
            type="text"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="e.g. Compliance, Tech, Soft Skills"
            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">Duration (Hours)</label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={form.duration_hours}
            onChange={(e) => setForm({ ...form, duration_hours: e.target.value })}
            placeholder="e.g. 4.5"
            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-bold text-gray-700 mb-1">Instructor / Host</label>
          <input
            type="text"
            value={form.instructor}
            onChange={(e) => setForm({ ...form, instructor: e.target.value })}
            placeholder="e.g. Internal Lead or External Trainer"
            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none"
          />
        </div>
        <div>
          <label className="block font-bold text-gray-700 mb-1">Format</label>
          <select
            value={form.format}
            onChange={(e) => setForm({ ...form, format: e.target.value as CourseFormState["format"] })}
            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none cursor-pointer"
          >
            <option value="in_person">In-Person Classroom</option>
            <option value="online">Online / Self-Paced</option>
            <option value="hybrid">Hybrid (Online + Live)</option>
          </select>
        </div>
      </div>

      {/* Invite Employees Section */}
      {employees.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <label className="block font-bold text-gray-700 text-xs">
              Invite Employees ({form.invited_employee_ids?.length || 0} selected)
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-[11px] font-bold text-[#253C7D] hover:underline cursor-pointer"
            >
              {form.invited_employee_ids?.length === filteredEmployees.length ? "Deselect All" : "Select All"}
            </button>
          </div>

          <div className="relative">
            <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={empSearch}
              onChange={(e) => setEmpSearch(e.target.value)}
              placeholder="Search staff to invite..."
              className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none"
            />
          </div>

          <div className="max-h-36 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-1.5 bg-gray-50/40">
            {filteredEmployees.map((emp) => {
              const isSelected = form.invited_employee_ids?.includes(emp.id);
              return (
                <div
                  key={emp.id}
                  onClick={() => toggleEmployee(emp.id)}
                  className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors text-xs ${
                    isSelected ? "bg-blue-50/90 text-[#253C7D] font-bold" : "hover:bg-gray-100 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded text-[#253C7D] focus:ring-0 cursor-pointer pointer-events-none"
                    />
                    <span className="truncate">{emp.first_name} {emp.last_name}</span>
                    <span className="text-[10px] text-gray-400 font-normal truncate">({emp.department})</span>
                  </div>
                  {isSelected && <i className="ri-check-line text-[#253C7D]" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <label className="block font-bold text-gray-700 mb-1">Description / Syllabus</label>
        <textarea
          rows={2}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of training objectives, target audience, prerequisites..."
          className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none resize-none"
        />
      </div>
    </>
  );
});

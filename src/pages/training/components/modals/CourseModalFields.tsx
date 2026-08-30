import { memo } from "react";
import type { CourseFormState } from "../../types";

interface CourseModalFieldsProps {
  form: CourseFormState;
  setForm: React.Dispatch<React.SetStateAction<CourseFormState>>;
}

export const CourseModalFields = memo(function CourseModalFields({
  form,
  setForm,
}: CourseModalFieldsProps) {
  return (
    <>
      <div>
        <label className="block font-bold text-gray-700 mb-1">
          Course Title <span className="text-rose-500">*</span>
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
          <label className="block font-bold text-gray-700 mb-1">Instructor / Provider</label>
          <input
            type="text"
            value={form.instructor}
            onChange={(e) => setForm({ ...form, instructor: e.target.value })}
            placeholder="e.g. internal or External Trainer"
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
            <option value="online">Online / Self-Paced</option>
            <option value="in_person">In-Person Classroom</option>
            <option value="hybrid">Hybrid (Online + Live)</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block font-bold text-gray-700 mb-1">Description / Syllabus</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Brief description of training objectives, target audience, prerequisites..."
          className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200 rounded-xl focus:outline-none resize-none"
        />
      </div>
    </>
  );
});

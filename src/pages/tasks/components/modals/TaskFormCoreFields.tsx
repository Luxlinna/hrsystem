import { memo } from "react";
import type { FormState } from "../../types";

interface TaskFormCoreFieldsProps {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  setDueDateOffset: (days: number) => void;
}

export const TaskFormCoreFields = memo(function TaskFormCoreFields({
  form,
  setForm,
  setDueDateOffset,
}: TaskFormCoreFieldsProps) {
  return (
    <>
      <div>
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
          Task Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="What needs to be done? e.g. Finalize Q3 Employee Review"
          className="w-full px-3.5 py-2.5 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#253C7D] transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Status
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as FormState["status"] })}
            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#253C7D]"
          >
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div>
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
            Priority
          </label>
          <select
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value as FormState["priority"] })}
            className="w-full px-3 py-2 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#253C7D]"
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
            <option value="urgent">Urgent Priority</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Due Date
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setDueDateOffset(0)}
              className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setDueDateOffset(1)}
              className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg cursor-pointer"
            >
              Tomorrow
            </button>
            <button
              type="button"
              onClick={() => setDueDateOffset(7)}
              className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg cursor-pointer"
            >
              +1 Week
            </button>
          </div>
        </div>
        <input
          type="date"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          className="w-full px-3.5 py-2 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#253C7D]"
        />
      </div>

      <div>
        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
          Description
        </label>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Add detailed context, links, or expectations for this task..."
          className="w-full px-3.5 py-2 bg-gray-50/80 border border-gray-200/80 rounded-2xl text-xs font-semibold focus:bg-white focus:outline-none focus:border-[#253C7D] transition-colors resize-none"
        />
      </div>
    </>
  );
});

import { memo } from "react";
import type { NewHiringRequestFormState } from "../../types";
import { BU_DEFAULT_POSITIONS } from "@/features/workforce/employees/constants";
import { PositionSearchSelect } from "./PositionSearchSelect";
import { ModernSearchSelect } from "./ModernSearchSelect";

interface Props {
  form: NewHiringRequestFormState;
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>;
  orgPositions: Array<{ id: string; name: string }>;
}

export const CreateHiringRequestPositionFields = memo(function CreateHiringRequestPositionFields({
  form,
  setForm,
  orgPositions,
}: Props) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-2.5 sm:p-3 shadow-2xs">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start">
        <div className="sm:col-span-6">
          <label className="flex items-center gap-1 text-[11px] font-semibold text-slate-700 mb-0.5">
            <i className="ri-building-line text-blue-600 text-xs" />
            <span>Position / Job Title</span>
            <span className="text-rose-500 font-bold">*</span>
          </label>
          <PositionSearchSelect
            positions={
              orgPositions.length > 0
                ? orgPositions
                : BU_DEFAULT_POSITIONS.map((name, i) => ({ id: `default-pos-${i}`, name, status: "active" }))
            }
            value={form.title || form.position || ""}
            onChange={(val) => setForm((prev) => ({ ...prev, title: val, position: val }))}
            placeholder="Select position from Org..."
            required
          />
        </div>

        <div className="sm:col-span-3">
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
            Headcount <span className="text-rose-500 font-bold">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400 text-xs">
              <i className="ri-user-line" />
            </div>
            <input
              type="number"
              min="1"
              max="100"
              required
              value={form.headcount}
              onChange={(e) => setForm((prev) => ({ ...prev, headcount: Math.max(1, parseInt(e.target.value) || 1) }))}
              className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Priority</label>
          <ModernSearchSelect
            options={[
              { id: "low", name: "Low" },
              { id: "medium", name: "Medium" },
              { id: "high", name: "High" },
              { id: "urgent", name: "Urgent" },
            ]}
            value={
              form.urgency === "urgent"
                ? "Urgent"
                : form.urgency === "high"
                ? "High"
                : form.urgency === "medium"
                ? "Medium"
                : "Low"
            }
            onChange={(val) => {
              const lower = val.toLowerCase();
              const matched = lower.includes("urgent")
                ? "urgent"
                : lower.includes("high")
                ? "high"
                : lower.includes("medium")
                ? "medium"
                : "low";
              setForm((prev) => ({ ...prev, urgency: matched as any }));
            }}
            icon="ri-flag-line"
            placeholder="Priority"
            searchable={false}
            headerTitle="Urgency / Priority"
          />
        </div>
      </div>
    </div>
  );
});

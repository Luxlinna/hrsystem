import { memo } from "react";
import type { EmployeeFieldSetting } from "../types";

interface EmployeeFieldsTabProps {
  fields: EmployeeFieldSetting[];
  loading: boolean;
  onToggleRequired: (id: string, current: boolean) => void;
  onToggleEnabled: (id: string, current: boolean) => void;
}

export const EmployeeFieldsTab = memo(function EmployeeFieldsTab({
  fields,
  loading,
  onToggleRequired,
  onToggleEnabled,
}: EmployeeFieldsTabProps) {
  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-400">
        <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Loading field settings...
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Customizable Employee Fields</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure which employee fields are visible and required during onboarding & profile editing.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
              <th className="px-4 py-3">Field Label</th>
              <th className="px-4 py-3">Identifier</th>
              <th className="px-4 py-3 text-center">Required</th>
              <th className="px-4 py-3 text-center">Enabled</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fields.map((field) => (
              <tr key={field.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="px-4 py-3 font-semibold text-slate-800">{field.field_label}</td>
                <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">{field.field_key}</td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={field.is_required}
                    onChange={() => onToggleRequired(field.id, field.is_required)}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={field.is_enabled}
                    onChange={() => onToggleEnabled(field.id, field.is_enabled)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

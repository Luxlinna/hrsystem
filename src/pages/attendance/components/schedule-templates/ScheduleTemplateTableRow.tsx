import { memo } from "react";
import type { ScheduleTemplate } from "./types";

interface Props {
  item: ScheduleTemplate;
  idx: number;
  actionMenuId: string | null;
  setActionMenuId: (id: string | null) => void;
  onEdit: (template: ScheduleTemplate) => void;
  onToggleStatus: (id: string) => void;
  onDuplicate: (template: ScheduleTemplate) => void;
  onDelete: (id: string) => void;
}

const DAYS_HEADER = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
  { key: "sat", label: "Sat" },
  { key: "sun", label: "Sun" },
] as const;

export const ScheduleTemplateTableRow = memo(function ScheduleTemplateTableRow({
  item,
  idx,
  actionMenuId,
  setActionMenuId,
  onEdit,
  onToggleStatus,
  onDuplicate,
  onDelete,
}: Props) {
  const isMenuOpen = actionMenuId === item.id;

  return (
    <tr className="hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors">
      <td className="py-4 px-4 text-center font-bold text-gray-400">{idx + 1}</td>
      <td className="py-4 px-4">
        <div className="font-bold text-gray-900 dark:text-slate-100">{item.title}</div>
        {item.site_name && (
          <span className="text-[10px] text-gray-400 font-medium mt-0.5 block">
            Site / BU: {item.site_name}
          </span>
        )}
      </td>
      <td className="py-4 px-4">
        <div className="flex flex-col items-center">
          <div className="grid grid-cols-7 gap-1 w-full max-w-[280px]">
            {DAYS_HEADER.map((d) => (
              <div key={d.key} className="text-center py-0.5 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300 text-[10px] font-bold rounded">
                {d.label}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 w-full max-w-[280px] mt-1">
            {DAYS_HEADER.map((d) => {
              const val = item.days[d.key] || "OFF";
              const isOff = val.toUpperCase() === "OFF";
              return (
                <div
                  key={d.key}
                  className={`text-center py-1 text-[10px] font-mono font-bold rounded border ${
                    isOff
                      ? "bg-gray-50 text-gray-400 border-gray-200 dark:bg-slate-800 dark:border-slate-700"
                      : "bg-white text-gray-900 border-gray-300 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-600 shadow-2xs"
                  }`}
                  title={`${d.label}: ${val}`}
                >
                  {val}
                </div>
              );
            })}
          </div>
        </div>
      </td>
      <td className="py-4 px-4 text-center font-bold text-gray-800 dark:text-slate-200">{item.total_employee}</td>
      <td className="py-4 px-4 text-gray-600 dark:text-slate-300 text-xs">{item.remark || "—"}</td>
      <td className="py-4 px-4 text-center">
        <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${item.status === "Active" ? "bg-emerald-500 text-white" : "bg-amber-400 text-white"}`}>
          {item.status}
        </span>
      </td>
      <td className="py-4 px-4 text-center relative">
        <div className="inline-block relative">
          <button
            type="button"
            onClick={() => setActionMenuId(isMenuOpen ? null : item.id)}
            className="w-7 h-7 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg text-gray-500 hover:text-[#253C7D] dark:hover:text-sky-400 hover:border-[#253C7D] flex items-center justify-center cursor-pointer shadow-2xs transition-colors"
            title="Actions"
          >
            <i className="ri-settings-4-line text-sm" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-30 text-xs">
              <button
                type="button"
                onClick={() => { setActionMenuId(null); onEdit(item); }}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
              >
                <i className="ri-edit-line text-blue-600" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => { setActionMenuId(null); onToggleStatus(item.id); }}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
              >
                <i className="ri-toggle-line text-amber-600" />
                <span>{item.status === "Active" ? "Disable" : "Activate"}</span>
              </button>
              <button
                type="button"
                onClick={() => { setActionMenuId(null); onDuplicate(item); }}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 flex items-center gap-2 cursor-pointer font-medium"
              >
                <i className="ri-file-copy-line text-indigo-600" />
                <span>Duplicate</span>
              </button>
              <div className="my-1 border-t border-gray-100 dark:border-slate-800" />
              <button
                type="button"
                onClick={() => { setActionMenuId(null); onDelete(item.id); }}
                className="w-full text-left px-3 py-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 flex items-center gap-2 cursor-pointer font-medium"
              >
                <i className="ri-delete-bin-line" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
});

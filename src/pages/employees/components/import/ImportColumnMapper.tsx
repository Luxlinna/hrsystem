import { memo, useState } from "react";
import { SYSTEM_FIELDS, type ColumnMappingState, type SystemFieldCategory } from "./types";

interface ImportColumnMapperProps {
  detectedHeaders: string[];
  sampleValues: Record<string, string>;
  mapping: ColumnMappingState;
  onUpdateMapping: (fieldKey: string, headerName: string) => void;
  onResetAutoMatch: () => void;
}

const CATEGORIES: { id: SystemFieldCategory; label: string; icon: string }[] = [
  { id: "Personal Identity", label: "Personal", icon: "ri-user-line" },
  { id: "Organization & Workplace", label: "Organization", icon: "ri-building-line" },
  { id: "Terms & Schedule", label: "Terms & Schedule", icon: "ri-calendar-todo-line" },
  { id: "Compensation & Payroll", label: "Compensation", icon: "ri-money-dollar-circle-line" },
  { id: "Contacts & Address", label: "Contacts", icon: "ri-contacts-book-line" },
];

export const ImportColumnMapper = memo(function ImportColumnMapper({
  detectedHeaders,
  sampleValues,
  mapping,
  onUpdateMapping,
  onResetAutoMatch,
}: ImportColumnMapperProps) {
  const [activeCategory, setActiveCategory] = useState<SystemFieldCategory | "All">("All");
  const mappedCount = Object.values(mapping).filter(Boolean).length;

  const filteredFields = activeCategory === "All"
    ? SYSTEM_FIELDS
    : SYSTEM_FIELDS.filter((f) => f.category === activeCategory);

  return (
    <div className="space-y-3">
      {/* Top Banner */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
        <div>
          <h4 className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
            Form Field Scanner & Mapping
          </h4>
          <p className="text-[11px] text-slate-500">
            Matched <strong className="text-[#253C7D] dark:text-[#7ba3d4]">{mappedCount}</strong> of {SYSTEM_FIELDS.length} fields matching the system form.
          </p>
        </div>

        <button
          type="button"
          onClick={onResetAutoMatch}
          className="px-2.5 py-1 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded shadow-2xs hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <i className="ri-refresh-line mr-1 text-xs" />
          Reset Auto-match
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setActiveCategory("All")}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
            activeCategory === "All"
              ? "bg-[#253C7D] text-white"
              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
          }`}
        >
          All Fields ({SYSTEM_FIELDS.length})
        </button>
        {CATEGORIES.map((c) => {
          const count = SYSTEM_FIELDS.filter((f) => f.category === c.id).length;
          const mapped = SYSTEM_FIELDS.filter((f) => f.category === c.id && mapping[f.key]).length;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategory(c.id)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeCategory === c.id
                  ? "bg-[#253C7D] text-white"
                  : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
              }`}
            >
              <i className={`${c.icon} text-xs`} />
              <span>{c.label}</span>
              <span className="text-[10px] opacity-75">({mapped}/{count})</span>
            </button>
          );
        })}
      </div>

      {/* Mapping Table */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left border-collapse text-[11px]">
            <thead className="bg-slate-100 dark:bg-slate-700/60 sticky top-0 z-10 text-slate-700 dark:text-slate-200 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="p-2.5 w-2/5 whitespace-nowrap">System Form Field</th>
                <th className="p-2.5 w-2/5 whitespace-nowrap">File Column (From Spreadsheet)</th>
                <th className="p-2.5 w-1/5 whitespace-nowrap">Sample Preview</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
              {filteredFields.map((field) => {
                const selectedHeader = mapping[field.key] || "";
                const sample = selectedHeader ? sampleValues[selectedHeader] || "—" : "—";
                const isMapped = Boolean(selectedHeader);

                return (
                  <tr
                    key={field.key}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors ${
                      field.required && !isMapped ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                    }`}
                  >
                    <td className="p-2.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{field.label}</span>
                        {field.required && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-semibold bg-rose-50 text-rose-600 border border-rose-200">
                            Required
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">({field.category})</span>
                      </div>
                    </td>

                    <td className="p-2.5">
                      <select
                        value={selectedHeader}
                        onChange={(e) => onUpdateMapping(field.key, e.target.value)}
                        className={`w-full h-7 px-2 text-xs rounded border transition-colors focus:outline-none focus:border-[#253C7D] bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 ${
                          isMapped
                            ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/20"
                            : field.required
                            ? "border-amber-400 bg-amber-50/30"
                            : "border-slate-300 dark:border-slate-600"
                        }`}
                      >
                        <option value="">-- Do Not Import / Skip --</option>
                        {detectedHeaders.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="p-2.5 text-slate-600 dark:text-slate-300 font-mono text-[11px] truncate max-w-xs">
                      {isMapped ? (
                        <span className="text-slate-700 dark:text-slate-200 font-medium">{sample}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unmapped</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

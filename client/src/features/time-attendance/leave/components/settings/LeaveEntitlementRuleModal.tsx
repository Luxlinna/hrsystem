import React, { useState } from "react";
import type { LeaveEntitlementRule } from "../../services/leaveEntitlementRuleService";

interface LeaveEntitlementRuleModalProps {
  isOpen?: boolean;
  mode: "view" | "edit" | "create";
  rule: LeaveEntitlementRule | null;
  availableLeaveCodes: string[];
  totalEmployeesCount?: number;
  onClose: () => void;
  onSave?: (rule: Omit<LeaveEntitlementRule, "id"> & { id?: string }) => Promise<void>;
  onToggleStatus?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export const LeaveEntitlementRuleModal: React.FC<LeaveEntitlementRuleModalProps> = ({
  isOpen = true,
  mode,
  rule,
  availableLeaveCodes,
  totalEmployeesCount = 0,
  onClose,
  onSave,
}) => {
  if (isOpen === false) return null;

  const [code, setCode] = useState(rule?.code || "");
  const [name, setName] = useState(rule?.name || "");
  const [remark, setRemark] = useState(rule?.remark || "");
  const [selectedCodes, setSelectedCodes] = useState<string[]>(
    rule?.leave_type_codes || ["AL", "SL", "SP", "ML", "CL"]
  );
  const [status, setStatus] = useState<"Active" | "Disabled">(rule?.status || "Active");
  const [saving, setSaving] = useState(false);

  const isView = mode === "view";

  const handleToggleCode = (c: string) => {
    if (isView) return;
    setSelectedCodes((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave({
        id: rule?.id,
        code: code.trim(),
        name: name.trim() || `${code.trim()} Entitlement Rule`,
        leave_type_codes: selectedCodes,
        total_employee: rule?.total_employee ?? 0,
        remark: remark.trim(),
        status,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded bg-[#253C7D] text-white font-mono font-bold text-xs">
              {isView ? "VIEW RULE" : mode === "create" ? "NEW RULE" : "EDIT RULE"}
            </span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {isView
                ? `${rule?.code || "Leave"} Entitlement Rule`
                : mode === "create"
                ? "Create Entitlement Rule"
                : `Edit ${rule?.code || ""} Entitlement Rule`}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Code & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">
                Rule Code <span className="text-rose-500">*</span>
              </label>
              {isView ? (
                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-slate-900 dark:text-white">
                  {rule?.code}
                </div>
              ) : (
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. Expat, Local, Executive"
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#253C7D]"
                />
              )}
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">
                Status
              </label>
              {isView ? (
                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10.5px] ${
                      rule?.status === "Active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {rule?.status}
                  </span>
                </div>
              ) : (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as "Active" | "Disabled")}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-semibold text-slate-900 dark:text-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              )}
            </div>
          </div>

          {/* Applicable Leave Types */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">
              Applicable Leave Type Codes <span className="text-rose-500">*</span>
            </label>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-wrap gap-2">
              {availableLeaveCodes.map((c) => {
                const isSelected = selectedCodes.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    disabled={isView}
                    onClick={() => handleToggleCode(c)}
                    className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#253C7D] text-white shadow-2xs"
                        : "bg-white dark:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-600"
                    } ${!isView ? "cursor-pointer hover:scale-102" : "cursor-default"}`}
                  >
                    <i
                      className={
                        isSelected ? "ri-checkbox-circle-fill text-xs" : "ri-checkbox-blank-circle-line text-xs"
                      }
                    />
                    <span>{c}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400">
              Selected codes: {selectedCodes.join(", ") || "None"}
            </p>
          </div>

          {/* Remark */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200">
              Remark / Description
            </label>
            {isView ? (
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium">
                {rule?.remark || "No remark provided."}
              </div>
            ) : (
              <textarea
                rows={2}
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder="e.g. For expatriates only / Applicable for all Cambodian employees"
                className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-[#253C7D]"
              />
            )}
          </div>

          {/* Total Employees */}
          {isView && rule && (
            <div className="p-2.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-xl flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#253C7D] dark:text-blue-300">
                Assigned Employees:
              </span>
              <span className="font-mono font-extrabold text-sm text-[#253C7D] dark:text-blue-300">
                {rule.total_employee ?? 0} Employees
              </span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              {isView ? "Close" : "Cancel"}
            </button>
            {!isView && (
              <button
                type="submit"
                disabled={saving || !code.trim() || selectedCodes.length === 0}
                className="px-4 py-1.5 rounded-xl bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
              >
                {saving ? "Saving..." : mode === "create" ? "Create Rule" : "Save Changes"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

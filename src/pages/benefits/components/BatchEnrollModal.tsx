import React, { memo, useRef, useEffect, useState } from "react";
import type { BenefitPlan, Employee } from "../types";
import { initials } from "../constants";

interface BatchEnrollModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: BenefitPlan[];
  employees: Employee[];
  enrollForm: { plan_id: string };
  setEnrollForm: React.Dispatch<React.SetStateAction<{ plan_id: string }>>;
  enrollEmployeeIds: string[];
  setEnrollEmployeeIds: React.Dispatch<React.SetStateAction<string[]>>;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const BatchEnrollModal = memo(function BatchEnrollModal({
  isOpen,
  onClose,
  plans,
  employees,
  enrollForm,
  setEnrollForm,
  enrollEmployeeIds,
  setEnrollEmployeeIds,
  saving,
  onSubmit,
}: BatchEnrollModalProps) {
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [enrollModalSearch, setEnrollModalSearch] = useState("");
  const enrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (enrollRef.current && !enrollRef.current.contains(e.target as Node)) {
        setEnrollOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setEnrollOpen(false);
      setEnrollModalSearch("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredEmployees = employees.filter((emp) => {
    const q = enrollModalSearch.trim().toLowerCase();
    if (!q) return true;
    return `${emp.first_name} ${emp.last_name} ${emp.role || ""}`.toLowerCase().includes(q);
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
              <i className="ri-user-add-line" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">Enroll Employees in Benefits</h3>
              <p className="text-[11px] text-gray-400 mt-0.5">Select plan and staff participants</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {/* Plan Selector */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Select Benefit Plan <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={enrollForm.plan_id}
              onChange={(e) => setEnrollForm({ ...enrollForm, plan_id: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
            >
              <option value="">Choose a Benefit Plan...</option>
              {plans
                .filter((p) => p.status === "active")
                .map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} ({plan.provider} · {plan.type})
                  </option>
                ))}
            </select>
          </div>

          {/* Employee Multi-Select Combobox */}
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
              Select Employees <span className="text-rose-500">*</span>
            </label>
            <div className="relative" ref={enrollRef}>
              <div className="relative">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                <input
                  type="text"
                  role="combobox"
                  aria-expanded={enrollOpen}
                  value={
                    enrollOpen
                      ? enrollModalSearch
                      : enrollEmployeeIds.length > 0
                      ? `${enrollEmployeeIds.length} employee${enrollEmployeeIds.length === 1 ? "" : "s"} selected`
                      : enrollModalSearch
                  }
                  onChange={(e) => {
                    setEnrollModalSearch(e.target.value);
                    setEnrollOpen(true);
                  }}
                  onFocus={() => setEnrollOpen(true)}
                  placeholder="Search employee by name or role..."
                  className="w-full pl-8 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {enrollOpen && (
                <div className="absolute z-30 mt-1.5 w-full bg-white border border-gray-100 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-1.5">
                  {/* Select All */}
                  <button
                    type="button"
                    onClick={() => {
                      const matchingIds = filteredEmployees.map((e) => e.id);
                      const allSelected =
                        matchingIds.length > 0 && matchingIds.every((id) => enrollEmployeeIds.includes(id));
                      setEnrollEmployeeIds(allSelected ? [] : matchingIds);
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-[#253C7D] hover:bg-slate-50 border-b border-gray-100 transition-colors cursor-pointer"
                  >
                    <i className="ri-checkbox-multiple-line text-sm" />
                    Select All ({employees.length})
                  </button>

                  {filteredEmployees.map((emp) => {
                    const checked = enrollEmployeeIds.includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className={`w-full flex items-center gap-2.5 px-3.5 py-2 hover:bg-slate-50 transition-colors cursor-pointer ${
                          checked ? "bg-[#253C7D]/5" : ""
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => {
                            setEnrollEmployeeIds((prev) =>
                              prev.includes(emp.id) ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                            );
                          }}
                          className="rounded text-[#253C7D] focus:ring-[#253C7D]"
                        />
                        <div className="w-6 h-6 rounded-full bg-[#253C7D] text-white flex items-center justify-center font-bold text-[9px] shrink-0">
                          {initials(emp.first_name, emp.last_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-xs font-bold text-gray-900 truncate">
                            {emp.first_name} {emp.last_name}
                          </span>
                          <span className="block text-[10px] text-gray-400 truncate">
                            {emp.role} · {emp.department}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || enrollEmployeeIds.length === 0 || !enrollForm.plan_id}
              className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving
                ? "Enrolling..."
                : enrollEmployeeIds.length > 1
                ? `Enroll ${enrollEmployeeIds.length} Staff`
                : "Enroll Staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

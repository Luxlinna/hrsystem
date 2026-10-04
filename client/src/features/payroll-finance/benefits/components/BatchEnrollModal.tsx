import React, { memo, useState } from "react";
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
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const selectedPlan = plans.find((p) => p.id === enrollForm.plan_id);
  const activePlans = plans.filter((p) => p.status === "active");
  const allSelected = enrollEmployeeIds.length === employees.length && employees.length > 0;

  const filtered = employees.filter((emp) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${emp.first_name} ${emp.last_name} ${emp.role || ""} ${emp.department || ""}`.toLowerCase().includes(q);
  });

  const toggle = (id: string) =>
    setEnrollEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(6px)" }}
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Gradient Header ── */}
        <div
          className="px-8 pt-6 pb-5 relative overflow-hidden rounded-t-3xl flex-shrink-0"
          style={{ background: "linear-gradient(135deg,#1a2e5e 0%,#253C7D 60%,#3554a5 100%)" }}
        >
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-10 pointer-events-none"
            style={{ background: "radial-gradient(circle,white,transparent)", transform: "translate(30%,-30%)" }} />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.15)" }}>
                <i className="ri-user-add-line text-white text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">Enroll Employees</h3>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Assign staff to a benefit plan
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center cursor-pointer"
              style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          <div className="relative flex items-center gap-3 mt-4">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white"
              style={{ background: "rgba(255,255,255,0.12)" }}>
              <i className="ri-heart-pulse-line" />{activePlans.length} Active Plans
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-white"
              style={{ background: "rgba(255,255,255,0.12)" }}>
              <i className="ri-team-line" />{employees.length} Eligible Staff
            </span>
            {enrollEmployeeIds.length > 0 && (
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold text-white"
                style={{ background: "rgba(255,255,255,0.22)" }}>
                <i className="ri-checkbox-circle-fill text-green-300" />{enrollEmployeeIds.length} Selected
              </span>
            )}
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <form onSubmit={onSubmit} className="flex flex-col overflow-hidden flex-1">
          <div className="overflow-y-auto flex-1 px-8 py-6 space-y-5">

            {/* Plan Select */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                Benefit Plan <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <i className="ri-heart-pulse-line absolute left-4 top-1/2 -translate-y-1/2 text-[#253C7D] text-base pointer-events-none" />
                <select
                  required
                  value={enrollForm.plan_id}
                  onChange={(e) => setEnrollForm({ ...enrollForm, plan_id: e.target.value })}
                  className="w-full pl-10 pr-10 py-3 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer transition-all appearance-none"
                >
                  <option value="">Choose a benefit plan…</option>
                  {activePlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.provider} — ${Number(p.coverage_amount).toLocaleString()}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-lg" />
              </div>

              {selectedPlan && (
                <div className="mt-2.5 flex items-center gap-3 px-4 py-3 rounded-2xl bg-[#253C7D]/5 border border-[#253C7D]/15">
                  <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 flex items-center justify-center flex-shrink-0">
                    <i className="ri-shield-check-line text-[#253C7D] text-sm" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 truncate">{selectedPlan.name}</p>
                    <p className="text-[11px] text-gray-400">{selectedPlan.provider} · ${Number(selectedPlan.employee_contribution).toFixed(0)}/mo employee cost</p>
                  </div>
                  <span className="text-[11px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Active</span>
                </div>
              )}
            </div>

            {/* Employee Picker — Inline */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                  Select Employees <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEnrollEmployeeIds(allSelected ? [] : employees.map((e) => e.id))}
                    className="text-xs font-bold text-[#253C7D] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <i className={allSelected ? "ri-checkbox-indeterminate-line" : "ri-checkbox-multiple-line"} />
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>
                  {enrollEmployeeIds.length > 0 && (
                    <button type="button" onClick={() => setEnrollEmployeeIds([])}
                      className="text-xs font-bold text-rose-400 hover:underline cursor-pointer">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Search */}
              <div className="relative mb-2.5">
                <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, role, or department…"
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#253C7D] focus:bg-white transition-all"
                />
              </div>

              {/* Inline employee list (no dropdown) */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden">
                {filtered.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 text-sm">No staff found</div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
                    {filtered.map((emp) => {
                      const sel = enrollEmployeeIds.includes(emp.id);
                      return (
                        <div
                          key={emp.id}
                          onClick={() => toggle(emp.id)}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors select-none ${
                            sel ? "bg-[#253C7D]/5" : "hover:bg-gray-50"
                          }`}
                        >
                          {/* Avatar */}
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden"
                            style={{ background: sel ? "#253C7D" : "#e5e7eb", color: sel ? "#fff" : "#374151" }}
                          >
                            {emp.avatar_url
                              ? <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                              : <span>{initials(emp.first_name, emp.last_name)}</span>}
                          </div>

                          {/* Name + role */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-bold truncate ${sel ? "text-[#253C7D]" : "text-gray-900"}`}>
                              {emp.first_name} {emp.last_name}
                            </p>
                            <p className="text-[11px] text-gray-400 truncate">
                              {[emp.role, emp.department].filter(Boolean).join(" · ") || "—"}
                            </p>
                          </div>

                          {/* Checkbox */}
                          <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 flex-shrink-0 transition-all ${
                            sel ? "bg-[#253C7D] border-[#253C7D]" : "border-gray-300 bg-white"
                          }`}>
                            {sel && <i className="ri-check-line text-white text-xs" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <p className="text-[11px] text-gray-400 mt-1.5 px-1">
                {filtered.length} of {employees.length} staff shown
                {enrollEmployeeIds.length > 0 && ` · ${enrollEmployeeIds.length} selected`}
              </p>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="flex items-center justify-between px-8 py-4 border-t border-gray-100 bg-gray-50/60 rounded-b-3xl flex-shrink-0">
            <p className="text-xs text-gray-400">
              {enrollEmployeeIds.length === 0
                ? "Select a plan and staff to continue"
                : `${enrollEmployeeIds.length} staff member${enrollEmployeeIds.length > 1 ? "s" : ""} will be enrolled`}
            </p>
            <div className="flex items-center gap-3">
              <button type="button" onClick={onClose} disabled={saving}
                className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !enrollForm.plan_id || enrollEmployeeIds.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 text-white text-sm font-bold rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
                style={{ background: "linear-gradient(135deg,#253C7D,#3554a5)" }}
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enrolling…
                  </>
                ) : (
                  <>
                    <i className="ri-user-add-line" />
                    {enrollEmployeeIds.length > 0 ? `Enroll ${enrollEmployeeIds.length} Staff` : "Enroll Staff"}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
});

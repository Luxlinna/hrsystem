import React, { memo } from "react";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import type { Employee, NewRecord } from "../types";
import { TYPE_CONFIG, SEVERITY_CONFIG } from "../constants";

interface DisciplinaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  newRecord: NewRecord;
  setNewRecord: React.Dispatch<React.SetStateAction<NewRecord>>;
  saving: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const DisciplinaryModal = memo(function DisciplinaryModal({
  isOpen,
  onClose,
  employees,
  newRecord,
  setNewRecord,
  saving,
  onSubmit,
}: DisciplinaryModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/50 backdrop-blur-xs overflow-y-auto no-scrollbar"
      onClick={() => !saving && onClose()}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-gray-100/90 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-slate-50 via-gray-50/50 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#253C7D] text-white flex items-center justify-center font-bold text-xl shrink-0 shadow-xs">
              <i className="ri-file-shield-line" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                Log Disciplinary Record / PIP
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Document a warning, policy violation, workplace incident, or performance plan
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {/* Employee Selector */}
          <div>
            <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
              Select Employee <span className="text-rose-500">*</span>
            </label>
            <EmployeeSearchSelect
              employees={employees}
              value={newRecord.employee_id}
              onChange={(id) => setNewRecord({ ...newRecord, employee_id: id })}
            />
          </div>

          {/* Case Type Cards */}
          <div>
            <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
              Incident Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(TYPE_CONFIG).map(([k, v]) => {
                const isSelected = newRecord.type === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setNewRecord({ ...newRecord, type: k })}
                    className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? `${v.bg} ${v.color} border-current ring-2 ring-current/20 shadow-xs scale-[1.02]`
                        : "bg-white border-gray-200/80 text-gray-700 hover:bg-slate-50"
                    }`}
                  >
                    <i className={`${v.icon} text-base mb-1`} />
                    <p className="text-xs font-bold truncate">{v.label}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Severity & Incident Date Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                Severity Level <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {Object.entries(SEVERITY_CONFIG).map(([k, v]) => {
                  const isSelected = newRecord.severity === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setNewRecord({ ...newRecord, severity: k as any })}
                      className={`py-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
                        isSelected
                          ? `${v.bg} ${v.color} border-current ring-2 ring-current/20 font-black shadow-xs`
                          : "bg-white border-gray-200 text-gray-600 hover:bg-slate-50"
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                Incident Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={newRecord.incident_date}
                onChange={(e) => setNewRecord({ ...newRecord, incident_date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* Case Title */}
          <div>
            <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
              Case Headline Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newRecord.title}
              onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
              placeholder="e.g. Unexcused absence on shift Q3 / Code of conduct review"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* Description Body */}
          <div>
            <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
              Detailed Statement &amp; Facts
            </label>
            <textarea
              rows={3}
              value={newRecord.description}
              onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
              placeholder="Provide objective documentation of what occurred, impact on operations..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] leading-relaxed"
            />
          </div>

          {/* Follow-up & Witnesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                Follow-Up Review Target Date
              </label>
              <input
                type="date"
                value={newRecord.follow_up_date}
                onChange={(e) => setNewRecord({ ...newRecord, follow_up_date: e.target.value })}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            <div>
              <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
                Witnesses Present
              </label>
              <input
                type="text"
                value={newRecord.witnesses}
                onChange={(e) => setNewRecord({ ...newRecord, witnesses: e.target.value })}
                placeholder="e.g. John Doe, Operations Lead"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* Action Taken */}
          <div>
            <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
              Action Taken / Next Steps
            </label>
            <textarea
              rows={2}
              value={newRecord.action_taken}
              onChange={(e) => setNewRecord({ ...newRecord, action_taken: e.target.value })}
              placeholder="Summary of corrective coaching or disciplinary decisions made..."
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          {/* PIP Configuration Section (Expands if type === 'pip') */}
          {newRecord.type === "pip" && (
            <div className="border border-[#253C7D]/25 rounded-2xl p-4 bg-[#253C7D]/5 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <i className="ri-focus-3-line text-[#253C7D] text-lg" />
                <div>
                  <p className="text-xs font-black text-[#253C7D]">Performance Improvement Plan Details</p>
                  <p className="text-[10px] text-[#253C7D]/80">Establish measurable performance milestones</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-extrabold text-[#253C7D] uppercase tracking-wider block mb-1">
                    PIP Start Date
                  </label>
                  <input
                    type="date"
                    value={newRecord.pip_start_date}
                    onChange={(e) => setNewRecord({ ...newRecord, pip_start_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold text-[#253C7D] bg-white border border-[#253C7D]/25 rounded-xl focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-extrabold text-[#253C7D] uppercase tracking-wider block mb-1">
                    PIP End / Review Date
                  </label>
                  <input
                    type="date"
                    value={newRecord.pip_end_date}
                    onChange={(e) => setNewRecord({ ...newRecord, pip_end_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold text-[#253C7D] bg-white border border-[#253C7D]/25 rounded-xl focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-[#253C7D] uppercase tracking-wider block mb-1">
                  Measurable Objectives &amp; Goals
                </label>
                <textarea
                  rows={3}
                  value={newRecord.pip_goals}
                  onChange={(e) => setNewRecord({ ...newRecord, pip_goals: e.target.value })}
                  placeholder="1. Maintain on-time arrival rate above 95%&#10;2. Complete weekly sprint deliverables&#10;3. Bi-weekly check-in with supervisor"
                  className="w-full px-3.5 py-2 text-xs text-[#253C7D] bg-white border border-[#253C7D]/25 rounded-xl focus:outline-none focus:border-[#253C7D] leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="pt-3 flex gap-2.5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !newRecord.employee_id || !newRecord.title.trim()}
              className="flex-1 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <i className="ri-checkbox-circle-fill text-sm" />
              <span>{saving ? "Filing Record..." : "Log Disciplinary Record"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

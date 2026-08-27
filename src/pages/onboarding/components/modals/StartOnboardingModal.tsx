import { memo } from "react";
import type { EmployeeOption } from "../../types";
import { initials } from "../../onboardingUtils";

interface StartOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  startEmployeeId: string;
  setStartEmployeeId: (id: string) => void;
  empSearch: string;
  setEmpSearch: (q: string) => void;
  filteredEligibleEmployees: EmployeeOption[];
  eligibleCount: number;
  starting: boolean;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export const StartOnboardingModal = memo(function StartOnboardingModal({
  isOpen,
  onClose,
  startEmployeeId,
  setStartEmployeeId,
  empSearch,
  setEmpSearch,
  filteredEligibleEmployees,
  eligibleCount,
  starting,
  onSubmit,
}: StartOnboardingModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900">Start New Hire Onboarding</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Select an employee to initiate the 4-stage onboarding checklist workflow
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
              Search New Hire Employee *
            </label>
            <div className="relative mb-2">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                placeholder="Filter by name, role, department..."
                className="w-full pl-8 pr-7 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>

            {/* Eligible Employees Picker List */}
            <div className="border border-gray-200 rounded-2xl max-h-56 overflow-y-auto divide-y divide-gray-100 bg-gray-50/50">
              {filteredEligibleEmployees.map((emp) => {
                const isSelected = startEmployeeId === emp.id;
                return (
                  <div
                    key={emp.id}
                    onClick={() => setStartEmployeeId(emp.id)}
                    className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                      isSelected ? "bg-[#253C7D]/10 text-[#253C7D]" : "hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white border border-gray-200 text-[#253C7D] font-bold text-xs flex items-center justify-center shrink-0">
                        {initials(emp.first_name, emp.last_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-xs text-gray-900 truncate">
                          {emp.first_name} {emp.last_name}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {emp.role || "Team Member"} &middot; {emp.department || "General"}
                        </p>
                      </div>
                    </div>
                    {isSelected && <i className="ri-checkbox-circle-fill text-[#253C7D] text-base" />}
                  </div>
                );
              })}

              {filteredEligibleEmployees.length === 0 && (
                <div className="p-6 text-center text-xs text-gray-400">
                  {eligibleCount === 0
                    ? "All employees already have onboarding journeys initialized."
                    : "No eligible new hires match your search query."}
                </div>
              )}
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-500 space-y-1">
            <p className="font-bold text-gray-800 flex items-center gap-1.5">
              <i className="ri-magic-line text-[#253C7D]" />
              Automatic Setup
            </p>
            <p className="text-[11px] leading-relaxed">
              Upon starting, standard checklist items and departmental task assignments (Docs, IT hardware, orientation training) will be generated automatically.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!startEmployeeId || starting}
              className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {starting ? "Starting..." : "Start Onboarding Journey"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

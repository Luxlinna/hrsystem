import { memo, useMemo } from "react";
import type { PayrollRun, EmployeeItemRecord } from "../../types";
import { initials } from "../../payrollApprovalUtils";

interface BatchItemizedDrilldownModalProps {
  isOpen: boolean;
  onClose: () => void;
  run: PayrollRun | null;
  itemizedRecords: EmployeeItemRecord[];
}

export const BatchItemizedDrilldownModal = memo(function BatchItemizedDrilldownModal({
  isOpen,
  onClose,
  run,
  itemizedRecords,
}: BatchItemizedDrilldownModalProps) {
  // All hooks must be called before early returns
  const batchRecords = useMemo(
    () =>
      run
        ? itemizedRecords.filter(
            (r) =>
              r.month === run.period &&
              (run.department === "All Departments" || r.employees?.department === run.department)
          )
        : [],
    [itemizedRecords, run]
  );

  if (!isOpen || !run) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">
              {run.department} &middot; Batch Drilldown
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Period: {run.period} &middot; {batchRecords.length} Employee Record(s) matched
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {batchRecords.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-400">
            No itemized payslip records linked to this exact department and period.
          </div>
        ) : (
          <div className="divide-y divide-gray-100 text-xs">
            {batchRecords.map((r) => {
              const emp = r.employees;
              return (
                <div key={r.id} className="py-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    {emp?.avatar_url ? (
                      <img
                        src={emp.avatar_url}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-extrabold flex items-center justify-center text-[10px] shrink-0">
                        {initials(emp?.first_name, emp?.last_name)}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-gray-900">
                        {emp ? `${emp.first_name} ${emp.last_name}` : "Employee"}
                      </p>
                      <p className="text-[10px] text-gray-400">{emp?.role || "Staff"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-gray-400 block">Base / Bonus</span>
                      <span className="font-medium text-gray-600">
                        ${Number(r.base_salary).toLocaleString()} + ${Number(r.bonus).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 block">Net Pay</span>
                      <span className="font-black text-[#253C7D] text-sm">
                        ${Number(r.net_pay).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close Drilldown
          </button>
        </div>
      </div>
    </div>
  );
});

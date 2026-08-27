import { memo, useState } from "react";
import type { Employee, LeaveTypePolicy } from "../../types";
import { LEAVE_TYPE_CONFIG } from "../../constants";

interface LeaveBalancesTabContentProps {
  employees: Employee[];
  myEmployee: Employee | null;
  canViewAll: boolean;
  canViewOwnBranch: boolean;
  leaveTypePolicies: LeaveTypePolicy[];
  getEntitlement: (empId: string, type: string) => number | null;
  getUsedDays: (empId: string, type: string) => number;
  getPendingDays: (empId: string, type: string) => number;
  getRemaining: (empId: string, type: string) => number | null;
  onRequestLeaveForEmp: (empId: string) => void;
}

export const LeaveBalancesTabContent = memo(function LeaveBalancesTabContent({
  employees,
  myEmployee,
  canViewAll,
  canViewOwnBranch,
  leaveTypePolicies,
  getEntitlement,
  getUsedDays,
  getPendingDays,
  getRemaining,
  onRequestLeaveForEmp,
}: LeaveBalancesTabContentProps) {
  const [balanceSearch, setBalanceSearch] = useState("");
  const [balanceDept, setBalanceDept] = useState("all");

  const depts = Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort();

  const displayEmployees = employees.filter((e) => {
    if (balanceDept !== "all" && e.department !== balanceDept) return false;
    if (balanceSearch.trim()) {
      const q = balanceSearch.toLowerCase().trim();
      const name = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
      const role = (e.role || "").toLowerCase();
      const dept = (e.department || "").toLowerCase();
      if (!name.includes(q) && !role.includes(q) && !dept.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      {(canViewAll || canViewOwnBranch) && (
        <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={balanceSearch}
              onChange={(e) => setBalanceSearch(e.target.value)}
              placeholder="Search employee balances by name, role, department..."
              className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
            />
          </div>

          {depts.length > 0 && (
            <select
              value={balanceDept}
              onChange={(e) => setBalanceDept(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none focus:border-[#253C7D] cursor-pointer w-full sm:w-auto"
            >
              <option value="all">All Departments</option>
              {depts.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* Employee Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayEmployees.map((emp) => {
          const isMe = emp.id === myEmployee?.id;
          const annualEntitlement = getEntitlement(emp.id, "annual") ?? 18;
          const annualUsed = getUsedDays(emp.id, "annual");
          const annualPending = getPendingDays(emp.id, "annual");
          const annualRemaining = getRemaining(emp.id, "annual") ?? annualEntitlement;
          const usedPct = Math.min(100, Math.round((annualUsed / Math.max(1, annualEntitlement)) * 100));

          return (
            <div
              key={emp.id}
              className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] font-extrabold text-sm flex items-center justify-center shrink-0">
                      {emp.first_name?.[0]}
                      {emp.last_name?.[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm text-gray-900 truncate">
                        {emp.first_name} {emp.last_name}
                        {isMe && (
                          <span className="ml-1.5 text-[9px] font-extrabold bg-[#253C7D] text-white px-1.5 py-0.5 rounded-full uppercase">
                            You
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-gray-400 font-medium truncate">
                        {emp.role || "Staff"} &middot; {emp.department}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => onRequestLeaveForEmp(emp.id)}
                    className="p-1.5 text-gray-400 hover:text-[#253C7D] hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Book Leave"
                  >
                    <i className="ri-add-line text-base font-bold" />
                  </button>
                </div>

                {/* Annual Leave Progress Gauge */}
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-bold text-gray-700">Annual Leave Allowance</span>
                    <span className="font-extrabold text-[#253C7D]">
                      {annualRemaining} days left
                    </span>
                  </div>

                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-[#253C7D] rounded-full transition-all duration-500"
                      style={{ width: `${usedPct}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>{annualUsed} used</span>
                    <span>{annualPending} pending</span>
                    <span>{annualEntitlement} total</span>
                  </div>
                </div>

                {/* Other Leave Allowances */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {["sick", "maternity", "paternity", "study", "bereavement"].map((t) => {
                    const cfg = LEAVE_TYPE_CONFIG[t];
                    const used = getUsedDays(emp.id, t);
                    const ent = getEntitlement(emp.id, t);
                    return (
                      <div key={t} className="p-2 rounded-xl bg-gray-50/70 border border-gray-100 flex items-center justify-between">
                        <span className="text-[11px] text-gray-500 font-medium truncate">{cfg?.label || t}</span>
                        <span className="text-[11px] font-bold text-gray-900 shrink-0">
                          {used} {ent !== null ? `/ ${ent}` : "days"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

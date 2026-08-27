import { memo } from "react";
import { Link } from "react-router-dom";
import type { BenefitPlan, Enrollment } from "../types";
import { initials } from "../constants";

interface EnrollmentTabProps {
  enrollments: Enrollment[];
  filteredEnrollments: Enrollment[];
  plans: BenefitPlan[];
  departments: string[];
  canManage: boolean;
  enrollSearchQuery: string;
  setEnrollSearchQuery: (q: string) => void;
  enrollPlanFilter: string;
  setEnrollPlanFilter: (p: string) => void;
  enrollStatusFilter: string;
  setEnrollStatusFilter: (s: string) => void;
  enrollDeptFilter: string;
  setEnrollDeptFilter: (d: string) => void;
  onToggleEnrollmentStatus: (enrollment: Enrollment) => void;
  onOpenEnrollModal: () => void;
}

export const EnrollmentTab = memo(function EnrollmentTab({
  filteredEnrollments,
  plans,
  departments,
  canManage,
  enrollSearchQuery,
  setEnrollSearchQuery,
  enrollPlanFilter,
  setEnrollPlanFilter,
  enrollStatusFilter,
  setEnrollStatusFilter,
  enrollDeptFilter,
  setEnrollDeptFilter,
  onToggleEnrollmentStatus,
  onOpenEnrollModal,
}: EnrollmentTabProps) {
  const isFiltered =
    enrollSearchQuery ||
    enrollPlanFilter !== "all" ||
    enrollStatusFilter !== "all" ||
    enrollDeptFilter !== "all";

  return (
    <div className="space-y-6">
      {/* Enrollment Filter Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        <div className="relative w-full sm:w-64">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={enrollSearchQuery}
            onChange={(e) => setEnrollSearchQuery(e.target.value)}
            placeholder="Search staff, role, plan..."
            className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
          />
          {enrollSearchQuery && (
            <button
              onClick={() => setEnrollSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-circle-fill text-xs" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Plan Filter */}
          <select
            value={enrollPlanFilter}
            onChange={(e) => setEnrollPlanFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold max-w-[150px] truncate"
          >
            <option value="all">All Benefit Plans</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={enrollStatusFilter}
            onChange={(e) => setEnrollStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="enrolled">Enrolled Active</option>
            <option value="opted_out">Opted Out</option>
          </select>

          {/* Department Filter */}
          <select
            value={enrollDeptFilter}
            onChange={(e) => setEnrollDeptFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[130px] truncate font-medium"
          >
            {departments.map((d) => (
              <option key={d} value={d === "All Departments" ? "all" : d}>
                {d}
              </option>
            ))}
          </select>

          {/* Reset */}
          {isFiltered && (
            <button
              onClick={() => {
                setEnrollSearchQuery("");
                setEnrollPlanFilter("all");
                setEnrollStatusFilter("all");
                setEnrollDeptFilter("all");
              }}
              title="Reset Filters"
              className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <i className="ri-refresh-line text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* Enrollments Table */}
      {filteredEnrollments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
            <i className="ri-user-unfollow-line" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Enrollment Records Found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            No staff members match the selected filters or search query.
          </p>
          <button
            onClick={onOpenEnrollModal}
            className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
          >
            + Enroll Staff Member
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Employee Name</th>
                  <th className="px-5 py-3.5">Department / Role</th>
                  <th className="px-5 py-3.5">Benefit Plan</th>
                  <th className="px-5 py-3.5">Provider</th>
                  <th className="px-5 py-3.5">Employee Contrib</th>
                  <th className="px-5 py-3.5">Enrollment Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEnrollments.map((e) => {
                  const emp = e.employees;
                  const plan = e.benefit_plans;

                  return (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <Link
                          to={`/employees/${e.employee_id}`}
                          className="flex items-center gap-3 group cursor-pointer"
                        >
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                            {emp?.avatar_url ? (
                              <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span>{initials(emp?.first_name, emp?.last_name)}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors">
                              {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                            </p>
                          </div>
                        </Link>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-gray-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                          {emp?.department || "General"}
                        </span>
                        <span className="text-[11px] text-gray-400 ml-2">{emp?.role || "Staff"}</span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-900">
                        {plan?.name || "—"}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-600">
                        {plan?.provider || "Forte"}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-[#253C7D]">
                        ${Number(plan?.employee_contribution || 0).toLocaleString()}/mo
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                            e.status === "enrolled"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          ● {e.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        {canManage && (
                          <button
                            onClick={() => onToggleEnrollmentStatus(e)}
                            title={e.status === "enrolled" ? "Click to opt-out" : "Click to re-enroll"}
                            className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                              e.status === "enrolled"
                                ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                            }`}
                          >
                            {e.status === "enrolled" ? "Opt Out" : "Re-Enroll"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
});

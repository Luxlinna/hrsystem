import { memo } from "react";
import { Link } from "react-router-dom";
import type { Enrollment } from "../types";
import { initials } from "../constants";

interface EnrollmentTableViewProps {
  enrollments: Enrollment[];
  canManage: boolean;
  onToggleEnrollmentStatus: (enrollment: Enrollment) => void;
}

export const EnrollmentTableView = memo(function EnrollmentTableView({
  enrollments,
  canManage,
  onToggleEnrollmentStatus,
}: EnrollmentTableViewProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3.5">Employee Name</th>
              <th className="px-5 py-3.5">Department / Role</th>
              <th className="px-5 py-3.5">Enrolled Plan</th>
              <th className="px-5 py-3.5">Provider</th>
              <th className="px-5 py-3.5">Enrollment Date</th>
              <th className="px-5 py-3.5">Coverage Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {enrollments.map((enr) => {
              const emp = enr.employees;
              const plan = enr.benefit_plans;

              return (
                <tr key={enr.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#17254E] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden shadow-xs">
                        {emp?.avatar_url ? (
                          <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>{initials(emp?.first_name, emp?.last_name)}</span>
                        )}
                      </div>
                      <div>
                        <Link
                          to={`/employees/${emp?.id}`}
                          className="font-extrabold text-gray-900 hover:text-[#253C7D] transition-colors"
                        >
                          {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                        </Link>
                        <p className="text-[11px] text-gray-400 font-medium">{emp?.role}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="font-semibold text-gray-700 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                      {emp?.department || "General"}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="font-extrabold text-gray-900">{plan?.name || "—"}</span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className="font-bold text-gray-700">{plan?.provider || "—"}</span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-600">
                    {enr.enrolled_date
                      ? new Date(enr.enrolled_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${enr.status === "enrolled" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${enr.status === "enrolled" ? "bg-emerald-500" : "bg-rose-500"}`} />
                      {enr.status === "enrolled" ? "Enrolled Active" : "Opted Out"}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => onToggleEnrollmentStatus(enr)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer border shadow-2xs ${enr.status === "enrolled" ? "bg-white hover:bg-rose-50 text-rose-600 border-rose-200" : "bg-[#253C7D] hover:bg-[#1E3064] text-white border-transparent"}`}
                      >
                        {enr.status === "enrolled" ? "Opt Out" : "Re-enroll"}
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
  );
});

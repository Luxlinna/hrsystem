import { memo } from "react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import type { BenefitEnrollment, BenefitPlan, Employee } from "../types";

interface BenefitsTabProps {
  benefitPlans: BenefitPlan[];
  benefitEnrollments: BenefitEnrollment[];
  employees: Employee[];
  benefitEnrollmentByPlan: { name: string; enrolled: number; total: number }[];
}

export const BenefitsTab = memo(function BenefitsTab({
  benefitPlans,
  benefitEnrollments,
  employees,
  benefitEnrollmentByPlan,
}: BenefitsTabProps) {
  const uniqueEnrolledEmployeesCount = new Set(benefitEnrollments.map((e) => e.employee_id)).size;
  const enrollmentRate = employees.length > 0
    ? `${Math.round((uniqueEnrolledEmployeesCount / employees.length) * 100)}%`
    : "0%";

  const stats = [
    { label: "Active Plans", value: benefitPlans.length, color: "bg-[#253C7D]/10 text-[#253C7D]" },
    { label: "Total Enrolled", value: benefitEnrollments.filter((e) => e.status === "active").length, color: "bg-emerald-50 text-emerald-700" },
    { label: "Enrollment Rate", value: enrollmentRate, color: "bg-sky-50 text-sky-700" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:col-span-2">
        {stats.map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-4`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-[12px] font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="border border-gray-100 rounded-xl p-5 lg:col-span-2">
        <h3 className="text-[14px] font-semibold text-gray-900 mb-4">Enrollment by Plan</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={benefitEnrollmentByPlan}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "8px", border: "none" }} />
              <Bar dataKey="enrolled" fill="#253C7D" radius={[6, 6, 0, 0]} name="Enrolled" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden lg:col-span-2">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-[14px] font-semibold text-gray-900">Plan-Level Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                {["Plan", "Type", "Enrolled", "Enrollment Rate"].map((h) => (
                  <th key={h} className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {benefitPlans.map((plan) => {
                const enrolled = benefitEnrollments.filter((e) => e.plan_id === plan.id && e.status === "active").length;
                const rate = employees.length > 0 ? Math.round((enrolled / employees.length) * 100) : 0;
                return (
                  <tr key={plan.id} className="border-t border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 text-[13px] font-medium text-gray-900">{plan.name}</td>
                    <td className="px-5 py-3 text-[13px] text-gray-600 capitalize">{plan.type}</td>
                    <td className="px-5 py-3 text-[13px] text-[#253C7D] font-semibold">{enrolled}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#253C7D] rounded-full" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-[12px] text-gray-600">{rate}%</span>
                      </div>
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

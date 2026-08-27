import { memo, Fragment } from "react";
import { Link } from "react-router-dom";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";

interface LeaveAndPayrollSectionProps {
  showLeave: boolean;
  showPayroll: boolean;
  leaveRequests: any[];
  payroll: any[];
  statsPayrollTotal: number;
  statsPayrollProcessed: number;
  currentMonthLabel: string;
}

export const LeaveAndPayrollSection = memo(function LeaveAndPayrollSection({
  showLeave,
  showPayroll,
  leaveRequests,
  payroll,
  statsPayrollTotal,
  statsPayrollProcessed,
  currentMonthLabel,
}: LeaveAndPayrollSectionProps) {
  if (!showLeave && !showPayroll) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-4 mb-6">
      {/* Left: Leave Requests */}
      {showLeave && (
        <div
          className={`bg-white border border-gray-200/80 rounded-2xl shadow-2xs p-5 sm:p-6 ${
            showPayroll ? "lg:w-[55%]" : "lg:w-full"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">Recent Leave Requests</h2>
            <Link to="/leave" className="text-[11px] text-[#253C7D] font-bold hover:underline">
              View All
            </Link>
          </div>
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            {/* Desktop table header */}
            <div className="hidden sm:grid grid-cols-4 bg-gray-50 px-4 py-2.5 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              <span>Employee</span>
              <span>Type</span>
              <span>Dates</span>
              <span>Status</span>
            </div>
            {leaveRequests.length > 0 ? (
              leaveRequests.map((l) => (
                <Fragment key={l.id}>
                  {/* Desktop row */}
                  <div className="hidden sm:grid grid-cols-4 px-4 py-3 border-t border-gray-50 text-[13px]">
                    <span className="text-gray-900 font-medium truncate">
                      {l.employees ? `${l.employees.first_name} ${l.employees.last_name}` : "Unknown"}
                    </span>
                    <span className="text-gray-600 capitalize">{l.leave_type}</span>
                    <span className="text-gray-500">
                      {l.start_date?.slice(5)} - {l.end_date?.slice(5)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          l.status === "approved"
                            ? "bg-emerald-500"
                            : l.status === "pending"
                            ? "bg-amber-500"
                            : "bg-rose-500"
                        }`}
                      />
                      <span className="text-gray-600 capitalize">{l.status}</span>
                    </span>
                  </div>
                  {/* Mobile card */}
                  <div className="sm:hidden flex items-center justify-between px-4 py-3 border-t border-gray-50">
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">
                        {l.employees ? `${l.employees.first_name} ${l.employees.last_name}` : "Unknown"}
                      </p>
                      <p className="text-[11px] text-gray-500 capitalize mt-0.5">
                        {l.leave_type} &middot; {l.start_date?.slice(5)} – {l.end_date?.slice(5)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-semibold px-2.5 py-1 rounded-full capitalize ml-2 ${
                        l.status === "approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : l.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {l.status}
                    </span>
                  </div>
                </Fragment>
              ))
            ) : (
              <p className="text-center py-8 text-[13px] text-gray-400">No leave requests yet</p>
            )}
          </div>
        </div>
      )}

      {/* Right: Payroll Overview */}
      {showPayroll && (
        <div
          className={`bg-white border border-gray-200/80 rounded-2xl shadow-2xs p-5 sm:p-6 ${
            showLeave ? "lg:w-[45%]" : "lg:w-full"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900">{currentMonthLabel} Payroll</h2>
            <Link to="/payroll-module" className="text-[11px] text-[#253C7D] font-bold hover:underline">
              View All
            </Link>
          </div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[12px] text-gray-500">Total Net Pay</span>
            <span className="text-base font-bold text-gray-900">
              ${(statsPayrollTotal / 1000).toFixed(1)}k
            </span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12px] text-gray-500">Processed</span>
            <span className="text-[12px] font-semibold text-gray-900">
              {statsPayrollProcessed} / {payroll.length} employees
            </span>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={payroll.map((p, i) => ({
                  name: `E${i + 1}`,
                  net: Number(p.net_pay / 1000).toFixed(1),
                  status: p.status,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                  formatter={(value: any) => [`$${value}k`, "Net Pay"]}
                />
                <Bar dataKey="net" fill="#253C7D" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
});

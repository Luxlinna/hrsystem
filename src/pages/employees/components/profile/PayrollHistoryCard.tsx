import { memo } from "react";
import type { Employee, EmployeeRateItem, EmployeePayrollAttachment } from "../../types";

interface PayrollHistoryCardProps {
  employee?: Employee | null;
  payrollRecords: any[];
}

export const PayrollHistoryCard = memo(function PayrollHistoryCard({
  employee,
  payrollRecords = [],
}: PayrollHistoryCardProps) {
  const bankAccount =
    employee?.bank_accounts?.[0] || {
      payment_method: employee?.bank_name || "Bank Transfer",
      account_number: employee?.bank_account_number || "—",
    };

  const rateItems: EmployeeRateItem[] = (employee?.rate_items as EmployeeRateItem[]) || [];
  const payrollAttachments: EmployeePayrollAttachment[] =
    (employee?.payroll_attachments as EmployeePayrollAttachment[]) || [];

  const baseRate = employee?.contract_rate ?? employee?.basic_salary ?? 0;
  const baseCurrency = employee?.contract_rate_currency || "USD";
  const baseFrequency = employee?.contract_rate_frequency || "Monthly";

  const rateAfter = employee?.contract_rate_after;
  const rateAfterCurrency = employee?.contract_rate_after_currency || baseCurrency;
  const rateAfterFrequency = employee?.contract_rate_after_frequency || baseFrequency;

  return (
    <div className="space-y-6">
      {/* 1. Compensation & Salary Package */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-5">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xl shadow-2xs">
              <i className="ri-money-dollar-circle-line" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                Compensation &amp; Payroll Structure
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Contract rates, allowances, and banking details configured during hiring setup
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            {employee?.payroll_structure || "Standard Monthly"}
          </span>
        </div>

        {/* Salary & Contract Rates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Base / Contract Rate */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Base Contract Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-slate-900 font-mono">
                {baseCurrency === "USD" ? "$" : ""}
                {Number(baseRate || 0).toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-500">
                {baseCurrency} / {baseFrequency}
              </span>
            </div>
            {employee?.contract_type && (
              <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#253C7D] border border-blue-200">
                {employee.contract_type} {employee.contract_remark ? `(${employee.contract_remark})` : ""}
              </span>
            )}
          </div>

          {/* Rate After Probation */}
          <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40">
            <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider block mb-1">
              Post-Probation Rate
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-indigo-950 font-mono">
                {rateAfterCurrency === "USD" ? "$" : ""}
                {rateAfter ? Number(rateAfter).toLocaleString() : "—"}
              </span>
              {rateAfter ? (
                <span className="text-xs font-bold text-indigo-700">
                  {rateAfterCurrency} / {rateAfterFrequency}
                </span>
              ) : null}
            </div>
            <p className="text-[10px] text-indigo-600 mt-2 font-medium">
              Effective upon probation evaluation
            </p>
          </div>

          {/* Bank / Disbursement Method */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              Payment / Bank Method
            </span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-sm">
              <i className="ri-bank-card-line text-[#253C7D]" />
              <span>{bankAccount.payment_method || "ABA Bank"}</span>
            </div>
            <p className="text-xs font-mono font-bold text-[#253C7D] mt-2 truncate">
              {bankAccount.account_number || employee?.bank_account_number || "No account set"}
            </p>
          </div>

          {/* NSSF Status */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
              NSSF Status
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  employee?.register_nssf ? "bg-emerald-500" : "bg-amber-400"
                }`}
              />
              <span className="text-sm font-bold text-slate-800">
                {employee?.register_nssf ? "Enrolled" : "Excluded / Non-NSSF"}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 font-mono">
              {employee?.nssf_number ? `ID: ${employee.nssf_number}` : "No NSSF card required"}
            </p>
          </div>
        </div>

        {/* 2. Rate Items & Allowances Breakdown */}
        {rateItems.length > 0 && (
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <i className="ri-list-check-2 text-[#253C7D]" />
                <span>Standard Allowances &amp; Rate Items ({rateItems.length})</span>
              </h4>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">No.</th>
                    <th className="py-2.5 px-3">Item Name</th>
                    <th className="py-2.5 px-3 w-32 text-right">Standard Amount</th>
                    <th className="py-2.5 px-3">Remark / Coverage Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {rateItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-semibold">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 flex items-center gap-1.5">
                        <i className="ri-checkbox-circle-fill text-emerald-600 text-xs" />
                        <span>{item.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-700">
                        {Number(item.amount || 0) > 0
                          ? `$${Number(item.amount).toLocaleString()}`
                          : "$0.00"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 italic">
                        {item.remark || "Standard employee hiring rate item"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Payroll Attachments (AWS S3) */}
        {payrollAttachments.length > 0 && (
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <i className="ri-attachment-line text-[#253C7D]" />
              <span>Compensation Attachments</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {payrollAttachments.map((att, idx) => (
                <a
                  key={idx}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-300 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#253C7D] shrink-0">
                      <i className="ri-file-pdf-line text-sm" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#253C7D]">
                        {att.name}
                      </p>
                      <span className="text-[10px] text-slate-400">Payroll document</span>
                    </div>
                  </div>
                  <i className="ri-external-link-line text-slate-400 group-hover:text-[#253C7D] text-sm shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 4. Historical Monthly Payslips */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
        <h3 className="text-sm font-bold text-[#1A1A1A] mb-4">Historical Monthly Payslips</h3>
        {payrollRecords.length > 0 ? (
          <div className="border border-gray-200 rounded-xl overflow-x-auto">
            <div className="min-w-[520px]">
              <div className="grid grid-cols-5 bg-gray-50 px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <span>Month</span>
                <span className="text-right">Gross</span>
                <span className="text-right">Deductions</span>
                <span className="text-right">Net Pay</span>
                <span>Status</span>
              </div>
              {payrollRecords.map((p) => (
                <div key={p.id} className="grid grid-cols-5 px-4 py-3 border-t border-gray-100 text-[13px]">
                  <span className="text-gray-900 font-medium">{p.month}</span>
                  <span className="text-right text-gray-700">
                    ${Number(p.gross_pay || 0).toLocaleString()}
                  </span>
                  <span className="text-right text-gray-700">
                    ${Number(p.deductions || 0).toLocaleString()}
                  </span>
                  <span className="text-right font-semibold text-[#253C7D]">
                    ${Number(p.net_pay || 0).toLocaleString()}
                  </span>
                  <span
                    className={`capitalize text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit ${
                      p.status === "processed"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-gray-400">
            No processed monthly payslips yet for this employee. Monthly payslips will populate upon payroll cycle closure.
          </p>
        )}
      </div>
    </div>
  );
});

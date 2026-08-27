import { memo } from "react";

interface PayrollHistoryCardProps {
  payrollRecords: any[];
}

export const PayrollHistoryCard = memo(function PayrollHistoryCard({
  payrollRecords,
}: PayrollHistoryCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">Payroll History</h2>
      {payrollRecords.length > 0 ? (
        <div className="border border-gray-100 rounded-xl overflow-x-auto">
          <div className="min-w-[520px]">
            <div className="grid grid-cols-5 bg-gray-50 px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <span>Month</span>
              <span className="text-right">Gross</span>
              <span className="text-right">Deductions</span>
              <span className="text-right">Net Pay</span>
              <span>Status</span>
            </div>
            {payrollRecords.map((p) => (
              <div key={p.id} className="grid grid-cols-5 px-4 py-3 border-t border-gray-50 text-[13px]">
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
        <p className="text-[13px] text-gray-400">No payroll records on file.</p>
      )}
    </div>
  );
});

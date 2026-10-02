import { memo } from "react";
import type { Employee, EmployeeRateItem } from "../../../types";

// Default rate items matching the screenshot
const DEFAULT_RATE_ITEMS: EmployeeRateItem[] = [
  { name: "Gasoline", amount: 0, remark: "" },
  { name: "Attendance", amount: 0, remark: "" },
  { name: "Accommodation", amount: 0, remark: "" },
  { name: "Transportation", amount: 0, remark: "Covering on transportation fees and maintenance." },
  { name: "Parking", amount: 0, remark: "For staff at store PP0003 only - 6.5 USD!" },
  { name: "Phone", amount: 0, remark: "" },
  { name: "13th month salary", amount: 0, remark: "Offer to specific employees with latest basic salary every anniversary." },
  { name: "N.OT Allowance", amount: 0, remark: "An allowance is provided to an employee for 1 time normal OT." },
  { name: "Position", amount: 0, remark: "" },
];

interface Props {
  employee: Employee;
}

export const PayrollRateItemSection = memo(function PayrollRateItemSection({ employee }: Props) {
  const rateItems: EmployeeRateItem[] =
    employee.rate_items && (employee.rate_items as EmployeeRateItem[]).length > 0
      ? (employee.rate_items as EmployeeRateItem[])
      : DEFAULT_RATE_ITEMS;

  return (
    <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
      <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
        RATE ITEM INFO
      </h3>

      <div className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-x-auto">
        <table className="w-full text-[13px] text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            <tr>
              <th className="py-2 px-3 w-12 text-center">No.</th>
              <th className="py-2 px-4">Rate Item Name</th>
              <th className="py-2 px-4">Amount</th>
              <th className="py-2 px-4">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rateItems.map((item, idx) => (
              <tr
                key={idx}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-800 dark:text-slate-200"
              >
                <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-300">
                  {idx + 1}
                </td>
                <td className="py-2 px-4 text-sky-600 dark:text-sky-400 font-medium">
                  {item.name}
                </td>
                <td className="py-2 px-4 text-sky-600 dark:text-sky-400">
                  {Number(item.amount || 0)}
                </td>
                <td className="py-2 px-4 text-slate-600 dark:text-slate-400">
                  {item.remark || ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

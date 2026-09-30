import { memo } from "react";
import type { Employee, EmployeeAssetBookingItem } from "../../../types";

interface Props {
  employee: Employee;
}

export const JoiningAssetAndAccountSection = memo(function JoiningAssetAndAccountSection({
  employee,
}: Props) {
  const assetBookings = (employee.asset_bookings || []) as (EmployeeAssetBookingItem & {
    issue_date?: string;
    item_description?: string;
    qty?: number;
    attachment?: string;
  })[];

  const userAccount = employee.email || "None";

  return (
    <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
      {/* 1. Asset Info */}
      <div>
        <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-2.5">
          ASSET INFO
        </h3>

        <div className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-x-auto">
          <table className="w-full text-[13px] text-left min-w-[600px]">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-2 px-3 w-12 text-center">No.</th>
                <th className="py-2 px-4">Issue Date</th>
                <th className="py-2 px-4">Item Description</th>
                <th className="py-2 px-4">Qty</th>
                <th className="py-2 px-4">Remark</th>
                <th className="py-2 px-4">Attachment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {assetBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-3 text-center text-[13px] text-slate-500">
                    Empty Employee Assets
                  </td>
                </tr>
              ) : (
                assetBookings.map((asset, idx) => (
                  <tr key={asset.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-center">{idx + 1}</td>
                    <td className="py-2 px-4">{asset.issue_date || asset.from_date || "-"}</td>
                    <td className="py-2 px-4">{asset.item_description || asset.name || asset.tag || "-"}</td>
                    <td className="py-2 px-4">{asset.qty || 1}</td>
                    <td className="py-2 px-4">{asset.remark || "-"}</td>
                    <td className="py-2 px-4">{asset.attachment || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Account User Info */}
      <div className="space-y-3">
        <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
          ACCOUNT USER INFO
        </h3>

        <div className="space-y-1.5 text-[13px]">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-y-1">
            <span className="sm:col-span-3 text-slate-700 dark:text-slate-300">User Account</span>
            <span className="sm:col-span-9 text-slate-900 dark:text-slate-100">{userAccount}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

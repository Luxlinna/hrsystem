import { memo, useState } from "react";
import type { Employee } from "../../../types";
import { formatDMY } from "../../../dateUtils";

interface Props {
  employee: Employee;
}

export const ProfileBankAndIdSection = memo(function ProfileBankAndIdSection({
  employee,
}: Props) {
  const [showBankPrivacy, setShowBankPrivacy] = useState(false);

  const bankAccounts = employee.bank_accounts && employee.bank_accounts.length > 0
    ? employee.bank_accounts
    : employee.bank_account_number
    ? [
        {
          payment_method: employee.bank_name || "ABA Payment",
          account_number: employee.bank_account_number,
        },
      ]
    : [];

  const identifications = employee.identifications && employee.identifications.length > 0
    ? employee.identifications
    : employee.national_id_number
    ? [
        {
          identification_type: "Identity Card",
          identification_number: employee.national_id_number,
          expiration_date: "-",
        },
      ]
    : [];

  return (
    <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
      {/* 1. Employee Bank Account */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            EMPLOYEE BANK ACCOUNT
          </h3>
          <button
            type="button"
            onClick={() => setShowBankPrivacy((prev) => !prev)}
            className="border border-sky-400 text-sky-600 dark:text-sky-400 text-xs px-3 py-0.5 rounded-full font-medium hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer"
          >
            {showBankPrivacy ? "Hide Privacy" : "Show Privacy"}
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-2 px-3 w-12 text-center">No.</th>
                <th className="py-2 px-4">Payment Method</th>
                <th className="py-2 px-4">Bank Account Number</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {bankAccounts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-3 text-center text-[13px] text-slate-500">
                    Empty Bank Accounts
                  </td>
                </tr>
              ) : (
                bankAccounts.map((b, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-center">{idx + 1}</td>
                    <td className="py-2 px-4">{b.payment_method || "-"}</td>
                    <td className="py-2 px-4">
                      {showBankPrivacy ? b.account_number || "-" : "*****"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Identification Info */}
      <div>
        <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-2.5">
          IDENTIFICATION INFO
        </h3>

        <div className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-2 px-3 w-12 text-center">No.</th>
                <th className="py-2 px-4">Identification Type</th>
                <th className="py-2 px-4">Identification Number</th>
                <th className="py-2 px-4">Expiration Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {identifications.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 text-center text-[13px] text-slate-500">
                    Empty Identifications
                  </td>
                </tr>
              ) : (
                identifications.map((idItem, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-center">{idx + 1}</td>
                    <td className="py-2 px-4">{idItem.identification_type || "-"}</td>
                    <td className="py-2 px-4">{idItem.identification_number || "-"}</td>
                    <td className="py-2 px-4">{formatDMY(idItem.expiration_date)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});

import { memo } from "react";
import type { PersonalSectionProps } from "./types";

export const PersonalBankAccountsSection = memo(function PersonalBankAccountsSection({
  form,
  onChange,
}: PersonalSectionProps) {
  const handleAdd = () => {
    const current = form.bank_accounts || [];
    onChange("bank_accounts", [
      ...current,
      { payment_method: "Bank Transfer", account_number: "" },
    ]);
  };

  const handleRemove = (idx: number) => {
    const updated = [...(form.bank_accounts || [])];
    updated.splice(idx, 1);
    onChange("bank_accounts", updated);
  };

  return (
    <div className="pt-6 border-t border-slate-200 w-full">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
          Employee Bank Account
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          className="w-7 h-7 rounded-full border border-sky-400 text-sky-600 hover:bg-sky-50 flex items-center justify-center text-base transition-colors cursor-pointer"
          title="Add Bank Account"
        >
          <i className="ri-add-line" />
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
            <tr>
              <th className="py-2 px-3 w-12">No.</th>
              <th className="py-2 px-3">Payment Method</th>
              <th className="py-2 px-3">Bank Account Number</th>
              <th className="py-2 px-3 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {form.bank_accounts && form.bank_accounts.length > 0 ? (
              form.bank_accounts.map((acc, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-3 text-slate-500 font-medium">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <select
                      value={acc.payment_method}
                      onChange={(e) => {
                        const updated = [...(form.bank_accounts || [])];
                        updated[idx] = { ...updated[idx], payment_method: e.target.value };
                        onChange("bank_accounts", updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold focus:outline-none focus:border-[#253C7D]"
                    >
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="ABA Bank">ABA Bank</option>
                      <option value="ACLEDA Bank">ACLEDA Bank</option>
                      <option value="Canadia Bank">Canadia Bank</option>
                      <option value="Wing Bank">Wing Bank</option>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                    </select>
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={acc.account_number}
                      onChange={(e) => {
                        const updated = [...(form.bank_accounts || [])];
                        updated[idx] = { ...updated[idx], account_number: e.target.value };
                        onChange("bank_accounts", updated);
                        if (idx === 0) {
                          onChange("bank_account_number", e.target.value);
                        }
                      }}
                      placeholder="e.g. 001 234 567"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-mono font-bold focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-6 text-center text-slate-400 font-medium">
                  No records found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

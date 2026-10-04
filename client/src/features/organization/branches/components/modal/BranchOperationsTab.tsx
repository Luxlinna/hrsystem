import React from "react";
import type { BranchFormState } from "../../types";

interface BranchOperationsTabProps {
  form: BranchFormState;
  setForm: React.Dispatch<React.SetStateAction<BranchFormState>>;
}

export function BranchOperationsTab({ form, setForm }: BranchOperationsTabProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">
            Business Unit (BU) Display Name *
          </label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => {
              const val = e.target.value;
              setForm({
                ...form,
                name: val,
                company_name: form.company_name ? form.company_name : val,
              });
            }}
            placeholder="e.g., Head Office or Business Unit Name"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Location / City *</label>
          <input
            type="text"
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g., Phnom Penh, Cambodia"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">BU Manager *</label>
          <input
            type="text"
            required
            value={form.manager_name}
            onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
            placeholder="Manager Name"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc]"
          />
        </div>
        <div>
          <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Operational Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0088cc] cursor-pointer bg-white"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
    </div>
  );
}

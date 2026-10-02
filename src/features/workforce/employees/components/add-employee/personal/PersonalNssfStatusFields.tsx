import { memo } from "react";
import type { EmployeeNssfInfo } from "../../../types";

interface PersonalNssfStatusFieldsProps {
  nssf: EmployeeNssfInfo;
  updateNssf: (field: keyof EmployeeNssfInfo, value: any) => void;
}

export const PersonalNssfStatusFields = memo(function PersonalNssfStatusFields({
  nssf,
  updateNssf,
}: PersonalNssfStatusFieldsProps) {
  return (
    <div className="space-y-3 pt-2">
      <h3 className="text-xs font-bold text-[#253C7D] uppercase tracking-wide">
        STATUS INFO
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-2 max-w-4xl">
        <label className="md:col-span-4 text-xs font-medium text-slate-700 md:text-right md:pr-4">
          Status
        </label>
        <div className="md:col-span-8 flex items-center gap-6">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="nssf_status"
              value="Active"
              checked={(nssf.status || "Active") === "Active"}
              onChange={() => updateNssf("status", "Active")}
              className="text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
            />
            <span className="text-xs text-slate-800 font-medium">Active</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="nssf_status"
              value="Inactive"
              checked={nssf.status === "Inactive"}
              onChange={() => updateNssf("status", "Inactive")}
              className="text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
            />
            <span className="text-xs text-slate-800 font-medium">Inactive</span>
          </label>
        </div>
      </div>
    </div>
  );
});

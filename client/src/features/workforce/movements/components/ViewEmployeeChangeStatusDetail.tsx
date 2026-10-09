import React, { useState } from "react";
import type { EmployeeMovement } from "../types";
import { formatKhmerFullName } from "@/features/workforce/employees/nameUtils";
import { DetailEmployeeInfo } from "./detail/DetailEmployeeInfo";
import { DetailContractAndRateItems } from "./detail/DetailContractAndRateItems";
import { MovementHistoryGridCard } from "./detail/MovementHistoryGridCard";
import { DEFAULT_PAYROLL_RATE_ITEMS } from "@/features/workforce/employees/constants";

interface ViewEmployeeChangeStatusDetailProps {
  movement: EmployeeMovement;
  onBack: () => void;
}

const formatDate = (d?: string | null) => {
  if (!d) return "—";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  } catch {
    return d;
  }
};

const resolveSalaryNum = (...candidates: any[]): string => {
  for (const c of candidates) {
    if (c !== null && c !== undefined && c !== "" && c !== "—" && !String(c).includes("*")) {
      const match = String(c).match(/[\d,.]+/);
      if (match) {
        const parsed = parseFloat(match[0].replace(/,/g, ""));
        if (!isNaN(parsed) && parsed > 0) {
          return parsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      }
    }
  }
  return "1,300.00";
};

export const ViewEmployeeChangeStatusDetail: React.FC<ViewEmployeeChangeStatusDetailProps> = ({
  movement,
  onBack,
}) => {
  const [showRate, setShowRate] = useState(false);
  const emp = movement.employees;
  const fullName = formatKhmerFullName(emp);

  const employeeCode = (emp as any)?.employee_code || (emp as any)?.candidate_code || (emp as any)?.id?.slice(0, 8) || movement.employee_id?.slice(0, 8) || "1116";
  const designation = (emp as any)?.position || emp?.role || "Staff";
  const department = (emp?.department || "—").toUpperCase();
  const supervisorName = (emp as any)?.line_manager || (emp as any)?.supervisor || (emp as any)?.reports_to || "—";
  const employmentType = (emp as any)?.employment_type || "FULL-TIME";
  const contractType = (emp as any)?.contract_type || "PERMANENT (UDC)";
  const siteName = (emp as any)?.work_locations?.name || (emp as any)?.site || "—";
  const joiningDate = formatDate((emp as any)?.join_date || (emp as any)?.start_date);

  const salary = resolveSalaryNum(
    movement.new_values?.salary,
    movement.new_values?.new_salary,
    movement.new_values?.rate,
    (emp as any)?.contract_rate,
    (emp as any)?.basic_salary
  );

  const rateItems = (emp as any)?.rate_items && (emp as any).rate_items.length > 0
    ? (emp as any).rate_items
    : DEFAULT_PAYROLL_RATE_ITEMS;

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 font-sans space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <h1 className="text-xl font-normal text-slate-700 tracking-tight">
          View Employee Change Status Detail
        </h1>
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1 rounded-sm bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
        >
          <i className="ri-arrow-left-line text-xs" />
          <span>Back</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200/80 p-6 sm:p-8 space-y-8 rounded-none shadow-2xs">
        <DetailEmployeeInfo
          emp={emp}
          fullName={fullName}
          employeeCode={employeeCode}
          designation={designation}
          department={department}
          supervisorName={supervisorName}
          employmentType={employmentType}
          contractType={contractType}
          siteName={siteName}
          joiningDate={joiningDate}
          salary={salary}
          showRate={showRate}
          onToggleRate={() => setShowRate(!showRate)}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h2 className="text-xs font-bold text-[#29ABE2] uppercase tracking-wider">
              CHANGE STATUS INFO
            </h2>
          </div>

          <MovementHistoryGridCard
            movement={movement}
            isCurrent={true}
          />
        </div>

        <DetailContractAndRateItems
          contractType={contractType}
          contractPeriod={`${formatDate((emp as any)?.start_date)} - Ongoing`}
          rateItems={rateItems}
          documentUrl={movement.document_url}
          documentName={movement.document_name}
        />
      </div>
    </div>
  );
};

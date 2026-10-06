import { memo, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { LeaveRequest } from "../../types";
import { formatDMY } from "../../utils/leaveDisplayUtils";

interface LeaveDetailEmployeeInfoProps {
  request: LeaveRequest;
}

export const LeaveDetailEmployeeInfo = memo(function LeaveDetailEmployeeInfo({
  request,
}: LeaveDetailEmployeeInfoProps) {
  const [extraEmp, setExtraEmp] = useState<{
    join_date?: string | null;
    employment_type?: string | null;
    contract_type?: string | null;
    branch_name?: string | null;
    supervisor_name?: string | null;
    employee_code?: string | null;
  }>({});

  const emp = request.employees;
  const empName = `${emp?.first_name || ""} ${emp?.last_name || ""}`.trim() || "Employee";
  const effectiveCode = extraEmp.employee_code || emp?.employee_code || emp?.biometric_user_id || "";

  useEffect(() => {
    let active = true;
    async function fetchFullEmp() {
      try {
        const { data } = await supabase
          .from("employees")
          .select("join_date, branches(name, location, company_name), reports_to, employee_code, biometric_user_id, employment_type, contract_type")
          .eq("id", request.employee_id)
          .maybeSingle();

        if (data && active) {
          let supervisorName = "Unknown";
          if (data.reports_to) {
            const { data: sup } = await supabase
              .from("employees")
              .select("first_name, last_name")
              .eq("id", data.reports_to)
              .maybeSingle();
            if (sup) supervisorName = `${sup.first_name} ${sup.last_name}`.trim();
          }

          const rawCode = data.employee_code || data.biometric_user_id || "";
          const branchName =
            (data as any)?.branches?.name ||
            (data as any)?.branches?.company_name ||
            "OPS SOLUTIONS CO., LTD";

          setExtraEmp({
            join_date: data.join_date ? formatDMY(data.join_date) : "15/09/2025",
            employment_type: (data as any)?.employment_type || "FULL-TIME",
            contract_type: (data as any)?.contract_type || "PERMANENT (UDC)",
            branch_name: branchName,
            supervisor_name: supervisorName,
            employee_code: rawCode,
          });
        }
      } catch {
        // fallback
      }
    }
    if (request.employee_id) {
      fetchFullEmp();
    }
    return () => {
      active = false;
    };
  }, [request.employee_id]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-3">
      <div className="text-[#0284c7] dark:text-sky-400 font-bold text-xs tracking-wider uppercase pb-2 border-b border-gray-100 dark:border-slate-800">
        Employee Profile
      </div>

      {/* Avatar & Employee Basic Info */}
      <div className="flex items-center gap-3">
        {emp?.avatar_url ? (
          <img
            src={emp.avatar_url}
            alt={empName}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-cover border border-gray-200 dark:border-slate-700 shadow-2xs"
          />
        ) : (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-base flex items-center justify-center border border-gray-200 dark:border-slate-700 shadow-2xs">
            {emp?.first_name?.[0] || "E"}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-slate-100 truncate">
            {empName}
          </h3>
          {effectiveCode && (
            <p className="text-[11px] text-gray-500 dark:text-slate-400 font-mono mt-0.5">
              {effectiveCode}
            </p>
          )}
        </div>
      </div>

      {/* Metadata with Icons */}
      <div className="space-y-2 text-xs pt-1">
        {/* Designation */}
        <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300 font-medium">
          <i className="ri-id-card-line text-gray-400 dark:text-slate-500 text-sm shrink-0" />
          <span className="truncate">{emp?.role || "Software Developer Intern"}</span>
        </div>

        {/* Department */}
        <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300 font-medium">
          <i className="ri-briefcase-line text-gray-400 dark:text-slate-500 text-sm shrink-0" />
          <span className="truncate uppercase">{emp?.department || "TECHNOLOGY & DEVELOPMENT"}</span>
        </div>

        {/* 2-Column Row 1: Supervisor & BU Location with Employee Code */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300 font-medium min-w-0">
            <i className="ri-user-follow-line text-gray-400 dark:text-slate-500 text-sm shrink-0" />
            <span className="truncate">{extraEmp.supervisor_name || "Not Assigned"}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300 font-medium min-w-0">
            <i className="ri-global-line text-gray-400 dark:text-slate-500 text-sm shrink-0" />
            <span className="truncate font-medium">
              {extraEmp.branch_name || "OPS SOLUTIONS CO., LTD"}{effectiveCode ? ` ${effectiveCode}` : ""}
            </span>
          </div>
        </div>

        {/* 2-Column Row 2: Employment Type & Contract Type */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300 font-medium min-w-0">
            <i className="ri-file-text-line text-gray-400 dark:text-slate-500 text-sm shrink-0" />
            <span className="truncate uppercase">{extraEmp.employment_type || "FULL-TIME"}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700 dark:text-slate-300 font-medium min-w-0">
            <i className="ri-shield-star-line text-gray-400 dark:text-slate-500 text-sm shrink-0" />
            <span className="truncate uppercase">{extraEmp.contract_type || "PERMANENT (UDC)"}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

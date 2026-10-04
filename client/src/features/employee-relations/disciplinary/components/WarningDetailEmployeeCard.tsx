import { memo, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { DisciplinaryRecord } from "../types";
import { formatDateDMY } from "../utils/formatters";

interface WarningDetailEmployeeCardProps {
  record: DisciplinaryRecord;
}

export const WarningDetailEmployeeCard = memo(function WarningDetailEmployeeCard({
  record,
}: WarningDetailEmployeeCardProps) {
  const [profile, setProfile] = useState<any>(null);
  const [showSalary, setShowSalary] = useState(false);

  useEffect(() => {
    if (!record.employee_id) return;
    let active = true;
    supabase
      .from("employees")
      .select("*, branches(name), work_locations:default_work_location_id(name), manager:reports_to(first_name, last_name, role)")
      .eq("id", record.employee_id)
      .maybeSingle()
      .then(({ data }) => {
        if (active && data) setProfile(data);
      });
    return () => {
      active = false;
    };
  }, [record.employee_id]);

  const emp = profile || record.employees;
  const empName = emp ? `${emp.first_name || ""} ${emp.last_name || ""}`.trim() : "—";
  const avatarUrl = profile?.avatar_url || record.employees?.avatar_url;
  const empCode = profile?.employee_code || profile?.biometric_user_id || record.employees?.employee_id || "3783";

  const rawRole = profile?.position || profile?.role || record.employees?.role || "Staff";
  const designation = rawRole.toLowerCase().startsWith("staff") ? rawRole : `Staff, ${rawRole}`;

  const department = profile?.department || profile?.division || record.employees?.department || "General";
  const supervisor =
    profile?.line_manager ||
    (profile?.manager ? `${profile.manager.first_name} ${profile.manager.last_name}` : "Unknown");

  const empType = profile?.employment_type ? profile.employment_type.toUpperCase() : "FULL-TIME";
  const contractType = profile?.contract_type ? profile.contract_type.toUpperCase() : "PERMANENT (UDC)";

  const site = profile?.site || profile?.work_locations?.name || profile?.branches?.name || record.branches?.name || "8887";
  const rawJoinDate = profile?.join_date || profile?.start_date || (record.employees as any)?.join_date || "2025-07-28";
  const joiningDate = formatDateDMY(rawJoinDate);

  const currency = profile?.contract_rate_currency || "USD";
  const frequency = profile?.contract_rate_frequency || "Monthly";
  const salaryText = showSalary ? String(profile?.basic_salary || profile?.contract_rate || "500") : "*****";

  const statusLabel =
    profile?.status && profile.status.toLowerCase() !== "active"
      ? profile.status.replace(/_/g, " ").toUpperCase()
      : "Employed";

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col sm:flex-row items-start gap-6">
      {/* Avatar & Status Badge */}
      <div className="w-16 flex flex-col items-center shrink-0 pt-0.5">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt=""
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover shrink-0 border border-slate-200"
            style={{ width: 64, height: 64 }}
          />
        ) : (
          <div
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#253C7D] text-white font-bold text-sm flex items-center justify-center shrink-0"
            style={{ width: 64, height: 64 }}
          >
            {emp ? emp.first_name[0] + emp.last_name[0] : "EM"}
          </div>
        )}
        <span className="mt-2 px-2.5 py-0.5 text-[10px] font-bold text-white bg-[#14b8a6] rounded shadow-2xs text-center whitespace-nowrap">
          {statusLabel}
        </span>
      </div>

      {/* Details Grid */}
      <div className="flex-1 w-full">
        <h4 className="text-sm font-bold text-slate-800 mb-3">{empName}</h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-3.5 gap-x-8 text-xs">
          {/* Col 1 */}
          <div className="space-y-3">
            <div>
              <p className="font-normal text-slate-700">{empCode}</p>
              <p className="text-[11px] text-slate-400 font-normal">Employee Code</p>
            </div>
            <div>
              <p className="font-normal text-slate-700">{designation}</p>
              <p className="text-[11px] text-slate-400 font-normal">Designation</p>
            </div>
            <div>
              <p className="font-normal text-slate-700 uppercase">{department}</p>
              <p className="text-[11px] text-slate-400 font-normal">Department</p>
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <div>
              <p className="font-normal text-slate-700">{supervisor}</p>
              <p className="text-[11px] text-slate-400 font-normal">Supervisor</p>
            </div>
            <div>
              <p className="font-normal text-slate-700">{empType}</p>
              <p className="text-[11px] text-slate-400 font-normal">Employee Type</p>
            </div>
            <div>
              <p className="font-normal text-slate-700">{contractType}</p>
              <p className="text-[11px] text-slate-400 font-normal">Contract Type</p>
            </div>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <div>
              <p className="font-normal text-slate-700">{site}</p>
              <p className="text-[11px] text-slate-400 font-normal">Site</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-normal text-slate-700">{currency} {salaryText}</span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#3b82f6] text-white rounded">
                  {frequency}
                </span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold bg-[#60a5fa] text-white rounded">
                  Gross
                </span>
                <button
                  type="button"
                  onClick={() => setShowSalary(!showSalary)}
                  title={showSalary ? "Hide salary" : "Show salary"}
                  className="cursor-pointer text-slate-400 hover:text-slate-600 ml-0.5"
                >
                  <i className={showSalary ? "ri-eye-off-line text-xs" : "ri-eye-line text-xs"} />
                </button>
              </div>
              <p className="text-[11px] text-slate-400 font-normal mt-0.5">Rate</p>
            </div>
            <div>
              <p className="font-normal text-slate-700">{joiningDate}</p>
              <p className="text-[11px] text-slate-400 font-normal">Joining Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

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
  }>({});

  const emp = request.employees;
  const empName = `${emp?.first_name || ""} ${emp?.last_name || ""}`.trim() || "Employee";
  const empCode = emp?.employee_code || emp?.biometric_user_id || request.employee_id.slice(0, 5);

  useEffect(() => {
    let active = true;
    async function fetchFullEmp() {
      try {
        const { data } = await supabase
          .from("employees")
          .select("join_date, branches(name, location), reports_to")
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

          setExtraEmp({
            join_date: data.join_date ? formatDMY(data.join_date) : "15/09/2025",
            employment_type: "FULL-TIME",
            contract_type: "PERMANENT (UDC)",
            branch_name: (data as any)?.branches?.name || "KD00001",
            supervisor_name: supervisorName,
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
    <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs">
      <div className="text-[#0284c7] font-semibold text-xs tracking-wider uppercase pb-3 border-b border-gray-100">
        EMPLOYEE INFO
      </div>

      <div className="mt-4 flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar & Employed Badge */}
        <div className="flex flex-col items-center gap-2 shrink-0">
          {emp?.avatar_url ? (
            <img
              src={emp.avatar_url}
              alt={empName}
              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 shadow-2xs"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-600 font-bold text-lg flex items-center justify-center border-2 border-gray-200">
              {emp?.first_name?.[0] || "E"}
            </div>
          )}
          <span className="px-2.5 py-0.5 bg-[#14b8a6] text-white text-[10px] font-semibold rounded-full shadow-2xs">
            Employed
          </span>
        </div>

        {/* Info Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3.5 gap-x-6 text-xs">
          {/* Column 1 */}
          <div>
            <div className="font-bold text-gray-900 text-sm">{empName}</div>
            <div className="mt-2">
              <div className="font-semibold text-gray-800">{empCode}</div>
              <div className="text-[11px] text-gray-400">Employee Code</div>
            </div>
            <div className="mt-2">
              <div className="font-semibold text-gray-800">{emp?.role || "Shift Leader 3"}</div>
              <div className="text-[11px] text-gray-400">Designation</div>
            </div>
            <div className="mt-2">
              <div className="font-semibold text-gray-800 uppercase">{emp?.department || "OPERATIONS"}</div>
              <div className="text-[11px] text-gray-400">Department</div>
            </div>
          </div>

          {/* Column 2 */}
          <div className="space-y-2">
            <div>
              <div className="font-semibold text-gray-800">{extraEmp.supervisor_name || "Unknown"}</div>
              <div className="text-[11px] text-gray-400">Supervisor</div>
            </div>
            <div>
              <div className="font-semibold text-gray-800 uppercase">{extraEmp.employment_type || "FULL-TIME"}</div>
              <div className="text-[11px] text-gray-400">Employee Type</div>
            </div>
            <div>
              <div className="font-semibold text-gray-800 uppercase">{extraEmp.contract_type || "PERMANENT (UDC)"}</div>
              <div className="text-[11px] text-gray-400">Contract Type</div>
            </div>
          </div>

          {/* Column 3 */}
          <div className="space-y-2">
            <div>
              <div className="font-semibold text-gray-800">{extraEmp.branch_name || "KD00001"}</div>
              <div className="text-[11px] text-gray-400">Site</div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-semibold text-gray-800">USD ******</span>
                <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 text-[10px] rounded font-medium">Monthly</span>
                <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[10px] rounded font-medium">Basic (C)</span>
              </div>
              <div className="text-[11px] text-gray-400 mt-0.5">Rate</div>
            </div>
            <div>
              <div className="font-semibold text-gray-800">{extraEmp.join_date || "15/09/2025"}</div>
              <div className="text-[11px] text-gray-400">Joining Date</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

import { useState, useEffect, memo } from "react";
import type { AttendanceRecord } from "../types";
import { formatTime, initials } from "../constants";
import { supabase } from "@/lib/supabase";
import { formatBiometricId } from "@/lib/biometricUtils";

interface ViewTimeLogDetailViewProps {
  record: AttendanceRecord;
  onBack: () => void;
  onEdit?: (record: AttendanceRecord) => void;
  onDelete?: (id: number) => void;
}

function formatDMY(dateStr?: string | null): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export const ViewTimeLogDetailView = memo(function ViewTimeLogDetailView({
  record: r,
  onBack,
  onEdit,
  onDelete,
}: ViewTimeLogDetailViewProps) {
  const [showSalary, setShowSalary] = useState(false);
  const [empDetail, setEmpDetail] = useState<any>(null);

  const emp = r.employees;

  useEffect(() => {
    let isMounted = true;
    if (r.employee_id) {
      supabase
        .from("employees")
        .select("*")
        .eq("id", r.employee_id)
        .maybeSingle()
        .then(({ data }) => {
          if (isMounted && data) {
            setEmpDetail(data);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [r.employee_id]);

  const fullName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown Employee";
  const empBioId = formatBiometricId(
    (empDetail as any)?.biometric_user_id || (emp as any)?.biometric_user_id,
    (empDetail as any)?.branches?.name || (emp as any)?.branches?.name
  );
  const empCode = empBioId || empDetail?.employee_code || emp?.employee_code || "3603";
  const designation = empDetail?.role || empDetail?.position || emp?.role || "Supply Chain Officer";
  const department = (empDetail?.department || emp?.department || "SUPPLY CHAIN").toUpperCase();

  const supervisor =
    empDetail?.line_manager ||
    empDetail?.supervisor ||
    empDetail?.reports_to ||
    "Unknown";

  const employeeType = (empDetail?.employment_type || "FULL-TIME").toUpperCase();
  const contractType = (empDetail?.contract_type || "PERMANENT (UDC)").toUpperCase();

  const site =
    r.work_location?.name ||
    empDetail?.site ||
    empDetail?.working_location ||
    emp?.branches?.name ||
    "HBPP2024";

  const rateValue = empDetail?.basic_salary || empDetail?.contract_rate || "500";
  const joiningDate = formatDMY(empDetail?.join_date || empDetail?.start_date || "2024-12-26");

  const formattedLogDate = formatDMY(r.date);
  const punchInTime = r.clock_in ? formatTime(r.clock_in) : "07:47 AM";
  const punchOutTime = r.clock_out ? formatTime(r.clock_out) : null;

  const deviceName = r.work_location?.name || (r as any).device_name || site;

  return (
    <div className="attendance-hub min-h-screen bg-[#F8F9FB] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 font-sans space-y-6">
      {/* Top Header Row */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200/80 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-slate-100 tracking-tight">
          View Time Log Detail
        </h1>

        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-line text-xs" />
          <span>Back</span>
        </button>
      </div>

      {/* SECTION 1: EMPLOYEE INFO */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#253C7D] dark:text-sky-400 uppercase tracking-wider">
          EMPLOYEE INFO
        </h3>

        <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar & Employed Badge */}
            <div className="flex flex-col items-center shrink-0">
              <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-blue-500 overflow-hidden shadow-xs flex items-center justify-center">
                {emp?.avatar_url ? (
                  <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-slate-500 dark:text-slate-300">
                    {initials(emp?.first_name, emp?.last_name)}
                  </span>
                )}
              </div>
              <span className="mt-2.5 px-3 py-0.5 rounded-md bg-emerald-400 text-white text-[10px] font-bold shadow-2xs uppercase">
                Employed
              </span>
            </div>

            {/* 3 Columns of Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-8 flex-1 w-full text-xs">
              {/* Column 1 */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-slate-100 mb-4">
                  {fullName}
                </h4>

                <div className="mb-3">
                  <p className="font-bold text-gray-800 dark:text-slate-200">{empCode}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                    Employee Code
                  </p>
                </div>

                <div className="mb-3">
                  <p className="font-bold text-gray-800 dark:text-slate-200">{designation}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                    Designation
                  </p>
                </div>

                <div>
                  <p className="font-bold text-gray-800 dark:text-slate-200">{department}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                    Department
                  </p>
                </div>
              </div>

              {/* Column 2 */}
              <div className="sm:pt-8">
                <div className="mb-3">
                  <p className="font-bold text-gray-800 dark:text-slate-200">{supervisor}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                    Supervisor
                  </p>
                </div>

                <div className="mb-3">
                  <p className="font-bold text-gray-800 dark:text-slate-200">{employeeType}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                    Employee Type
                  </p>
                </div>

                <div>
                  <p className="font-bold text-gray-800 dark:text-slate-200">{contractType}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                    Contract Type
                  </p>
                </div>
              </div>

              {/* Column 3 */}
              <div className="sm:pt-8">
                <div className="mb-3">
                  <p className="font-bold text-gray-800 dark:text-slate-200">{site}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Site</p>
                </div>

                <div className="mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-gray-800 dark:text-slate-200">
                      {showSalary ? `USD ${rateValue}` : "USD *****"}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#2563EB] text-white">
                      Monthly
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#0284C7] text-white">
                      Gross
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSalary((p) => !p)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer text-xs"
                      title={showSalary ? "Hide Rate" : "Show Rate"}
                    >
                      <i className={showSalary ? "ri-eye-off-line" : "ri-eye-line"} />
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">Rate</p>
                </div>

                <div>
                  <p className="font-bold text-gray-800 dark:text-slate-200">{joiningDate}</p>
                  <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                    Joining Date
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: TIME LOG INFO */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-[#253C7D] dark:text-sky-400 uppercase tracking-wider">
          TIME LOG INFO
        </h3>

        <div className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-2xs">
          <div className="divide-y divide-gray-100 dark:divide-slate-800 text-xs">
            <div className="py-2.5 flex items-center">
              <span className="w-36 text-gray-500 dark:text-slate-400 font-medium">Device Name</span>
              <span className="font-semibold text-gray-800 dark:text-slate-200">{deviceName}</span>
            </div>

            <div className="py-2.5 flex items-center">
              <span className="w-36 text-gray-500 dark:text-slate-400 font-medium">Log Type</span>
              <span className="font-semibold text-gray-800 dark:text-slate-200">
                Standalone Terminal
              </span>
            </div>

            <div className="py-2.5 flex items-center">
              <span className="w-36 text-gray-500 dark:text-slate-400 font-medium">Log Site</span>
              <span className="font-semibold text-gray-800 dark:text-slate-200">{site}</span>
            </div>

            <div className="py-2.5 flex items-center">
              <span className="w-36 text-gray-500 dark:text-slate-400 font-medium">Date</span>
              <span className="font-semibold text-gray-800 dark:text-slate-200">
                {formattedLogDate}
              </span>
            </div>

            <div className="py-2.5 flex items-center">
              <span className="w-36 text-gray-500 dark:text-slate-400 font-medium">Time Log</span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-gray-800 dark:text-slate-200">{punchInTime}</span>
                  <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-[10px] rounded font-semibold">
                    Time In
                  </span>
                </div>

                {punchOutTime && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-800 dark:text-slate-200">
                      {punchOutTime}
                    </span>
                    <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 text-[10px] rounded font-semibold">
                      Time Out
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="py-2.5 flex items-center">
              <span className="w-36 text-gray-500 dark:text-slate-400 font-medium">Remark</span>
              <span className="font-medium text-gray-600 dark:text-slate-300">
                {r.notes || "—"}
              </span>
            </div>

            <div className="py-2.5 flex items-center">
              <span className="w-36 text-gray-500 dark:text-slate-400 font-medium">Status</span>
              <span className="px-2 py-0.5 rounded bg-emerald-400 text-white font-bold text-[10px] shadow-2xs uppercase">
                Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

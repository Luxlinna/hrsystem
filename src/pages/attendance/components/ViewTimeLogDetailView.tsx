import { useState, useEffect, memo } from "react";
import type { AttendanceRecord } from "../types";
import { formatTime } from "../constants";
import { supabase } from "@/lib/supabase";
import { TimeLogEmployeeInfoSection } from "./TimeLogEmployeeInfoSection";
import { TimeLogRecordInfoSection } from "./TimeLogRecordInfoSection";

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

  const site =
    r.work_location?.name ||
    empDetail?.site ||
    empDetail?.working_location ||
    emp?.site ||
    (emp?.branches as any)?.name ||
    "HBHQ";

  const joiningDate = formatDMY(empDetail?.join_date || empDetail?.start_date || (emp as any)?.join_date || "2024-12-26");
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
          <i className="ri-arrow-left-line text-sm" />
          <span>Back</span>
        </button>
      </div>

      {/* SECTION 1: EMPLOYEE INFO */}
      <TimeLogEmployeeInfoSection
        empDetail={empDetail}
        emp={emp}
        site={site}
        joiningDate={joiningDate}
        showSalary={showSalary}
        setShowSalary={setShowSalary}
      />

      {/* SECTION 2: TIME LOG INFO */}
      <TimeLogRecordInfoSection
        record={r}
        deviceName={deviceName}
        site={site}
        formattedLogDate={formattedLogDate}
        punchInTime={punchInTime}
        punchOutTime={punchOutTime}
      />
    </div>
  );
});

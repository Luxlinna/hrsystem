import { useMemo, memo } from "react";
import type { Employee, Task } from "../../types";
import { CellLeaveEmployeeCard } from "@/features/time-attendance/attendance/components/schedule-matrix/CellLeaveEmployeeCard";
import { MissionOtherEmployeesTable } from "@/features/time-attendance/attendance/components/schedule-matrix/MissionOtherEmployeesTable";
import { CellLeaveAttachment } from "@/features/time-attendance/attendance/components/schedule-matrix/CellLeaveAttachment";
import { TaskMissionWorkFields } from "./TaskMissionWorkFields";

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
}

interface TaskOutsideWorkMissionFormProps {
  employees: Employee[];
  primaryEmpId: string;
  setPrimaryEmpId: (id: string) => void;
  missionType: string;
  setMissionType: (t: string) => void;
  missionFor: "daily" | "hourly" | "half_day";
  setMissionFor: (m: "daily" | "hourly" | "half_day") => void;
  subject: string;
  setSubject: (s: string) => void;
  fromDate: string;
  setFromDate: (d: string) => void;
  toDate: string;
  setToDate: (d: string) => void;
  totalDays: number;
  setTotalDays: (v: number | ((prev: number) => number)) => void;
  priority: Task["priority"];
  setPriority: (p: Task["priority"]) => void;
  location: LocationData | null;
  setLocation: (loc: LocationData | null) => void;
  detail: string;
  setDetail: (d: string) => void;
  remark: string;
  setRemark: (r: string) => void;
  otherTeamMembers: Employee[];
  setOtherTeamMembers: React.Dispatch<React.SetStateAction<Employee[]>>;
  attachmentFile: File | null;
  setAttachmentFile: (f: File | null) => void;
}

export const TaskOutsideWorkMissionForm = memo(function TaskOutsideWorkMissionForm({
  employees,
  primaryEmpId,
  setPrimaryEmpId,
  missionType,
  setMissionType,
  missionFor,
  setMissionFor,
  subject,
  setSubject,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  totalDays,
  setTotalDays,
  priority,
  setPriority,
  location,
  setLocation,
  detail,
  setDetail,
  remark,
  setRemark,
  otherTeamMembers,
  setOtherTeamMembers,
  attachmentFile,
  setAttachmentFile,
}: TaskOutsideWorkMissionFormProps) {
  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === primaryEmpId) || null,
    [employees, primaryEmpId]
  );

  const empCode =
    (selectedEmployee as any)?.employee_code ||
    (selectedEmployee as any)?.biometric_user_id ||
    "1116";

  const supervisorName = useMemo(() => {
    if (!selectedEmployee?.reports_to) return "Taing Mey";
    const sup = employees.find((e) => e.id === selectedEmployee.reports_to);
    return sup ? `${sup.first_name || ""} ${sup.last_name || ""}`.trim() : "Taing Mey";
  }, [selectedEmployee, employees]);

  const siteName =
    (selectedEmployee as any)?.site ||
    (selectedEmployee as any)?.work_locations?.name ||
    (selectedEmployee as any)?.branches?.name ||
    "HBHQ";

  const joinDateDisplay = useMemo(() => {
    const jd = (selectedEmployee as any)?.join_date;
    if (!jd) return "04/05/2020";
    try {
      const parts = jd.split("-");
      if (parts.length === 3) {
        return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
      }
    } catch {
      // fallback
    }
    return jd;
  }, [selectedEmployee]);

  return (
    <div className="space-y-6 text-xs text-gray-700 dark:text-slate-300">
      {/* SECTION 1: EMPLOYEE INFO */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-[#0284c7] uppercase tracking-wider">
          EMPLOYEE INFO
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
            Employee Name <span className="text-rose-500">*</span>
          </label>
          <div className="sm:col-span-9">
            <select
              value={primaryEmpId}
              onChange={(e) => setPrimaryEmpId(e.target.value)}
              required
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="">Select Employee...</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name} ({(e as any).employee_code || (e as any).biometric_user_id || "No Code"})
                </option>
              ))}
            </select>
          </div>
        </div>

        <CellLeaveEmployeeCard
          employee={selectedEmployee as any}
          fallbackName={
            selectedEmployee
              ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
              : "Select Employee"
          }
          empCode={empCode}
          supervisorName={supervisorName}
          siteName={siteName}
          joinDateDisplay={joinDateDisplay}
        />
      </div>

      {/* SECTION 2: MISSION / OUTSIDE WORK INFO */}
      <TaskMissionWorkFields
        missionType={missionType}
        setMissionType={setMissionType}
        missionFor={missionFor}
        setMissionFor={setMissionFor}
        subject={subject}
        setSubject={setSubject}
        fromDate={fromDate}
        setFromDate={setFromDate}
        toDate={toDate}
        setToDate={setToDate}
        totalDays={totalDays}
        setTotalDays={setTotalDays}
        priority={priority}
        setPriority={setPriority}
        location={location}
        setLocation={setLocation}
        detail={detail}
        setDetail={setDetail}
        remark={remark}
        setRemark={setRemark}
      />

      {/* SECTION 3: OTHER EMPLOYEES ON MISSION */}
      <MissionOtherEmployeesTable
        allEmployees={employees as any}
        mainEmployeeId={primaryEmpId}
        selectedOthers={otherTeamMembers as any}
        onAddEmployee={(emp) => setOtherTeamMembers((prev) => [...prev, emp as any])}
        onRemoveEmployee={(id) => setOtherTeamMembers((prev) => prev.filter((o) => o.id !== id))}
      />

      {/* SECTION 4: ATTACHMENT INFO */}
      <CellLeaveAttachment
        attachmentFile={attachmentFile}
        setAttachmentFile={setAttachmentFile}
      />
    </div>
  );
});

import { useState, useEffect, useMemo, memo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { ContextMenuTarget } from "./ScheduleMatrixContextMenu";
import { CellLeaveEmployeeCard, type FullEmployee } from "./CellLeaveEmployeeCard";
import { CellLeaveFields } from "./CellLeaveFields";

interface CreateCellLeaveModalProps {
  target: ContextMenuTarget | null;
  formMode: "self" | "for_employee";
  onClose: () => void;
  onSaved?: () => void;
}

const formatDateInput = (d: string) => (!d ? new Date().toISOString().split("T")[0] : d.includes("/") ? `${d.split("/")[2]}-${d.split("/")[1]?.padStart(2, "0")}-${d.split("/")[0]?.padStart(2, "0")}` : d);
const formatDMY = (ymd: string) => (!ymd ? "—" : `${ymd.split("-")[2]?.padStart(2, "0")}/${ymd.split("-")[1]?.padStart(2, "0")}/${ymd.split("-")[0]}`);

export const CreateCellLeaveModal = memo(function CreateCellLeaveModal({
  target,
  onClose,
  onSaved,
}: CreateCellLeaveModalProps) {
  const [employees, setEmployees] = useState<FullEmployee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(target?.empId || "");
  const [supervisorsMap, setSupervisorsMap] = useState<Record<string, string>>({});
  const [leaveType, setLeaveType] = useState("annual");
  const [fromDate, setFromDate] = useState(() => formatDateInput(target?.dateString || ""));
  const [toDate, setToDate] = useState(() => formatDateInput(target?.dateString || ""));
  const [reason, setReason] = useState("");
  const [remark, setRemark] = useState("");
  const [showDeductionPeriod, setShowDeductionPeriod] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (target) {
      setSelectedEmpId(target.empId);
      const f = formatDateInput(target.dateString);
      setFromDate(f);
      setToDate(f);
    }
  }, [target]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data } = await supabase
          .from("employees")
          .select("id, first_name, last_name, employee_code, biometric_user_id, role, department, avatar_url, join_date, reports_to, branch_id, status, branches(name), work_locations:default_work_location_id(name)")
          .is("deleted_at", null)
          .order("first_name");

        if (data && active) {
          setEmployees(data as any[]);
          const sm: Record<string, string> = {};
          data.forEach((e: any) => { sm[e.id] = `${e.first_name || ""} ${e.last_name || ""}`.trim(); });
          setSupervisorsMap(sm);
        }
      } catch (err) {
        console.warn("Error loading employees for leave modal:", err);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const selectedEmployee = useMemo(() => employees.find((e) => e.id === selectedEmpId) || null, [employees, selectedEmpId]);
  const supervisorName = useMemo(() => (!selectedEmployee?.reports_to ? "Taing Mey" : supervisorsMap[selectedEmployee.reports_to] || "Taing Mey"), [selectedEmployee, supervisorsMap]);
  const empCode = selectedEmployee?.employee_code || selectedEmployee?.biometric_user_id || (target?.employeeCode ? target.employeeCode.replace(/\D/g, "") : "1038") || "1038";
  const siteName = selectedEmployee?.work_locations?.name || selectedEmployee?.branches?.name || "HBHQ";
  const joinDateDisplay = selectedEmployee?.join_date ? formatDMY(selectedEmployee.join_date) : "06/04/2020";

  const totalDays = useMemo(() => {
    if (!fromDate || !toDate) return 1;
    const diff = Math.round((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? diff : 1;
  }, [fromDate, toDate]);

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || !selectedEmpId) {
      toast("Validation", "Please select employee and provide a reason", "error");
      return;
    }
    setSubmitting(true);
    try {
      let fullReason = reason.trim();
      if (remark.trim()) fullReason += `\n[Remark: ${remark.trim()}]`;
      if (attachmentFile) fullReason += `\n[Attachment: ${attachmentFile.name}]`;

      const { error } = await supabase.from("leave_requests").insert([{
        employee_id: selectedEmpId,
        leave_type: leaveType,
        start_date: fromDate,
        end_date: toDate,
        days: totalDays,
        status: "pending",
        reason: fullReason,
      }]);
      if (error) throw error;

      toast("Success", `Leave request created successfully (${totalDays} ${totalDays === 1 ? "day" : "days"})`, "success");
      onSaved?.();
      onClose();
    } catch (err: any) {
      toast("Error", err.message || "Failed to create leave request", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 w-full max-w-3xl my-6 animate-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
          <h2 className="text-base font-semibold text-gray-700 dark:text-slate-200">Create Leave</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer">
            <i className="ri-close-line text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-6 overflow-y-auto text-xs flex-1">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#0284c7] uppercase tracking-wider">EMPLOYEE INFO</h3>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
                Employee Name <span className="text-rose-500">*</span>
              </label>
              <div className="sm:col-span-9 relative">
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="w-full px-3.5 py-2 pr-10 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-md text-xs font-medium text-gray-800 dark:text-slate-100 focus:outline-none focus:border-[#0284c7] cursor-pointer appearance-none"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none text-gray-400">
                  <i className="ri-close-line text-sm" /><i className="ri-arrow-down-s-fill text-xs" />
                </div>
              </div>
            </div>

            <CellLeaveEmployeeCard
              employee={selectedEmployee}
              fallbackName={target.empName}
              empCode={empCode}
              supervisorName={supervisorName}
              siteName={siteName}
              joinDateDisplay={joinDateDisplay}
            />
          </div>

          <CellLeaveFields
            leaveType={leaveType}
            setLeaveType={setLeaveType}
            fromDate={fromDate}
            setFromDate={setFromDate}
            toDate={toDate}
            setToDate={setToDate}
            reason={reason}
            setReason={setReason}
            remark={remark}
            setRemark={setRemark}
            showDeductionPeriod={showDeductionPeriod}
            setShowDeductionPeriod={setShowDeductionPeriod}
            totalDays={totalDays}
            attachmentFile={attachmentFile}
            setAttachmentFile={setAttachmentFile}
          />

          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 hover:bg-gray-50 text-gray-700 dark:text-slate-300 rounded-md text-xs font-semibold cursor-pointer">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-md text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50 flex items-center gap-1.5">
              {submitting && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              <span>Create Leave</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

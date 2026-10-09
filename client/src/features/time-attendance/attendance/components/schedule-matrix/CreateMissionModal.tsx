import { useState, useEffect, useMemo, memo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import type { ContextMenuTarget } from "./ScheduleMatrixContextMenu";
import { CellLeaveEmployeeCard, type FullEmployee } from "./CellLeaveEmployeeCard";
import { CellLeaveAttachment } from "./CellLeaveAttachment";
import { MissionInfoFields } from "./MissionInfoFields";
import { MissionOtherEmployeesTable } from "./MissionOtherEmployeesTable";
import { submitMissionTask } from "./missionTaskSubmit";

interface CreateMissionModalProps {
  target: ContextMenuTarget | null;
  formMode: "self" | "for_employee";
  onClose: () => void;
  onSaved?: () => void;
}

const formatDateInput = (d: string) => (!d ? new Date().toISOString().split("T")[0] : d.includes("/") ? `${d.split("/")[2]}-${d.split("/")[1]?.padStart(2, "0")}-${d.split("/")[0]?.padStart(2, "0")}` : d);
const formatDMY = (ymd: string) => (!ymd ? "—" : `${ymd.split("-")[2]?.padStart(2, "0")}/${ymd.split("-")[1]?.padStart(2, "0")}/${ymd.split("-")[0]}`);

export const CreateMissionModal = memo(function CreateMissionModal({
  target,
  onClose,
  onSaved,
}: CreateMissionModalProps) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<FullEmployee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>(target?.empId || "");
  const [supervisorsMap, setSupervisorsMap] = useState<Record<string, string>>({});
  const [missionType, setMissionType] = useState("Official Mission");
  const [missionFor, setMissionFor] = useState<"daily" | "hourly" | "half_day">("daily");
  const [subject, setSubject] = useState("");
  const [fromDate, setFromDate] = useState(() => formatDateInput(target?.dateString || ""));
  const [toDate, setToDate] = useState(() => formatDateInput(target?.dateString || ""));
  const [totalDays, setTotalDays] = useState(1);
  const [detail, setDetail] = useState("");
  const [remark, setRemark] = useState("");
  const [selectedOthers, setSelectedOthers] = useState<FullEmployee[]>([]);
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
          .select("id, first_name, last_name, display_name, full_name, employee_code, biometric_user_id, role, department, avatar_url, join_date, reports_to, branch_id, status, basic_salary, contract_rate, contract_rate_currency, contract_rate_frequency, tax_method, contract_type, employment_type, site, branches(name), work_locations:default_work_location_id(name)")
          .is("deleted_at", null)
          .order("first_name");
        if (data && active) {
          setEmployees(data as any[]);
          const sm: Record<string, string> = {};
          data.forEach((e: any) => {
            sm[e.id] = (e.display_name?.trim() || e.full_name?.trim() || `${e.last_name || ""} ${e.first_name || ""}`).trim();
          });
          setSupervisorsMap(sm);
        }
      } catch (err) {
        console.warn("Error loading employees for mission modal:", err);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const selectedEmployee = useMemo(() => employees.find((e) => e.id === selectedEmpId) || null, [employees, selectedEmpId]);
  const supervisorName = useMemo(() => (!selectedEmployee?.reports_to ? "Taing Mey" : supervisorsMap[selectedEmployee.reports_to] || "Taing Mey"), [selectedEmployee, supervisorsMap]);
  const empCode = selectedEmployee?.employee_code || selectedEmployee?.biometric_user_id || (target?.employeeCode ? target.employeeCode.replace(/\D/g, "") : "1116") || "1116";
  const siteName = selectedEmployee?.site || selectedEmployee?.work_locations?.name || selectedEmployee?.branches?.name || "HBHQ";
  const joinDateDisplay = selectedEmployee?.join_date ? formatDMY(selectedEmployee.join_date) : "04/05/2020";

  if (!target) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !detail.trim() || !selectedEmpId) {
      toast("Validation", "Please provide Mission Subject and Mission Detail", "error");
      return;
    }
    setSubmitting(true);
    try {
      await submitMissionTask({
        userEmail: user?.email,
        selectedEmpId,
        primaryEmployee: selectedEmployee,
        selectedOthers,
        missionType,
        missionFor,
        subject,
        detail,
        remark,
        fromDate,
        toDate,
        totalDays,
        attachmentFile,
      });

      const empLabel = selectedEmployee?.display_name || selectedEmployee?.full_name || selectedEmployee?.first_name || target.empName;
      toast("Success", `Mission created successfully and added to Tasks for ${empLabel}`, "success");
      onSaved?.();
      onClose();
    } catch (err: any) {
      toast("Error", err.message || "Failed to create mission", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 max-w-4xl w-full my-auto overflow-hidden animate-in zoom-in-95 duration-100 flex flex-col max-h-[92vh]">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">Create Mission</h2>
          <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 text-xs flex-1">
          {/* Section 1: EMPLOYEE INFO */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[#0284c7] uppercase tracking-wider">EMPLOYEE INFO</h3>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">Employee Name <span className="text-rose-500">*</span></label>
              <div className="sm:col-span-9">
                <select value={selectedEmpId} onChange={(e) => setSelectedEmpId(e.target.value)} required className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500 cursor-pointer">
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.display_name?.trim() || e.full_name?.trim() || `${e.last_name} ${e.first_name}`} ({e.employee_code || e.biometric_user_id || "No Code"})
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <CellLeaveEmployeeCard employee={selectedEmployee} fallbackName={target.empName} empCode={empCode} supervisorName={supervisorName} siteName={siteName} joinDateDisplay={joinDateDisplay} />
          </div>

          {/* Section 2: MISSION INFO */}
          <MissionInfoFields missionType={missionType} setMissionType={setMissionType} missionFor={missionFor} setMissionFor={setMissionFor} subject={subject} setSubject={setSubject} fromDate={fromDate} setFromDate={setFromDate} toDate={toDate} setToDate={setToDate} totalDays={totalDays} setTotalDays={setTotalDays} detail={detail} setDetail={setDetail} remark={remark} setRemark={setRemark} />

          {/* Section 3: OTHER EMPLOYEE ON MISSION */}
          <MissionOtherEmployeesTable allEmployees={employees} mainEmployeeId={selectedEmpId} selectedOthers={selectedOthers} onAddEmployee={(e) => setSelectedOthers((prev) => [...prev, e])} onRemoveEmployee={(id) => setSelectedOthers((prev) => prev.filter((o) => o.id !== id))} />

          {/* Section 4: ATTACHMENT INFO */}
          <CellLeaveAttachment attachmentFile={attachmentFile} setAttachmentFile={setAttachmentFile} />

          {/* Footer Action */}
          <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-md text-xs font-semibold cursor-pointer shadow-xs disabled:opacity-50 transition-colors">
              <i className={submitting ? "ri-loader-4-line animate-spin text-sm" : "ri-save-line text-sm"} />
              <span>{submitting ? "Saving..." : "Save"}</span>
              <i className="ri-arrow-down-s-line text-xs ml-0.5" />
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-slate-400 cursor-pointer">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

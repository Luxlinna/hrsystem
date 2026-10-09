import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/lib/supabase";
import type { Employee } from "../../../types";
import type { EmployeeMovement } from "@/features/workforce/movements/types";
import { saveMovementInfo } from "./editMovementService";
import { toast } from "@/components/Toast";
import { ChangeStatusInfoSection } from "../../change-status/ChangeStatusInfoSection";
import { ChangeStatusAttachmentSection } from "../../change-status/ChangeStatusAttachmentSection";
import type { BranchOption } from "../../change-status/types";

interface Props {
  open: boolean;
  onClose: () => void;
  employee: Employee;
  movement: EmployeeMovement | null;
  onSaved: (m: EmployeeMovement) => void;
}

export const EditMovementInfoModal: React.FC<Props> = ({
  open,
  onClose,
  employee,
  movement,
  onSaved,
}) => {
  const [statusType, setStatusType] = useState<string>("Promotion");
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [bu, setBu] = useState<string>("");
  const [site, setSite] = useState<string>("");
  const [division, setDivision] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [position, setPosition] = useState<string>("");
  const [employeeType, setEmployeeType] = useState<string>("FULL-TIME");
  const [supervisor, setSupervisor] = useState<string>("");
  const [isSupervisorDropdownOpen, setIsSupervisorDropdownOpen] = useState<boolean>(false);
  const [salaryType, setSalaryType] = useState<string>("Gross");
  const [salary, setSalary] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Master data state
  const [buList, setBuList] = useState<BranchOption[]>([]);
  const [dbDivisions, setDbDivisions] = useState<string[]>([]);
  const [dbDepartments, setDbDepartments] = useState<string[]>([]);
  const [dbPositions, setDbPositions] = useState<string[]>([]);
  const [dbWorkLocations, setDbWorkLocations] = useState<Array<{ id: string; name: string; branch_id: string | null }>>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);

  const supervisorDropdownRef = useRef<HTMLDivElement>(null);

  const reloadBranches = useCallback(() => {
    supabase.from("branches").select("id, name").is("deleted_at", null).order("name")
      .then(({ data }) => { if (data && data.length > 0) setBuList(data as BranchOption[]); });
  }, []);

  const reloadDivisions = useCallback(() => {
    supabase.from("divisions").select("name, status").is("deleted_at", null).order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          const list = Array.from(new Set(
            data.filter((d: any) => !d.status || d.status !== "disabled").map((d: any) => d.name?.trim()).filter(Boolean)
          ));
          setDbDivisions(list);
        }
      });
  }, []);

  const reloadDepartments = useCallback(() => {
    supabase.from("departments").select("name, status").is("deleted_at", null).order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          const list = Array.from(new Set(
            data.filter((d: any) => !d.status || d.status !== "disabled").map((d: any) => d.name?.trim()).filter(Boolean)
          ));
          setDbDepartments(list);
        }
      });
  }, []);

  const reloadPositions = useCallback(() => {
    supabase.from("positions").select("name, status").is("deleted_at", null).order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          const list = Array.from(new Set(
            data.filter((d: any) => !d.status || d.status !== "disabled").map((d: any) => d.name?.trim()).filter(Boolean)
          ));
          setDbPositions(list);
        }
      });
  }, []);

  const reloadWorkLocations = useCallback(() => {
    supabase
      .from("work_locations")
      .select("id, name, description, branch_id, status, is_default")
      .is("deleted_at", null)
      .order("is_default", { ascending: false })
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDbWorkLocations(
            (data as Array<{ id: string; name: string; branch_id: string | null; status?: string }>).filter(
              (w) => !w.status || w.status !== "disabled"
            )
          );
        }
      });
  }, []);

  const reloadEmployees = useCallback(() => {
    supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, avatar_url")
      .is("deleted_at", null)
      .order("first_name")
      .then(({ data }) => {
        if (data) setAllEmployees(data);
      });
  }, []);

  useEffect(() => {
    if (open) {
      reloadBranches();
      reloadDivisions();
      reloadDepartments();
      reloadPositions();
      reloadWorkLocations();
      reloadEmployees();
    }
  }, [open, reloadBranches, reloadDivisions, reloadDepartments, reloadPositions, reloadWorkLocations, reloadEmployees]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (supervisorDropdownRef.current && !supervisorDropdownRef.current.contains(e.target as Node)) {
        setIsSupervisorDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    setAttachmentFile(null);

    const newV = movement?.new_values || {};
    const initTitle = movement?.title || (
      movement?.movement_type === "promote" ? "Promotion" :
      movement?.movement_type === "pass_probation" ? "Pass Probation Confirmation" :
      movement?.movement_type === "salary_adjustment" ? "Salary Adjustment" :
      movement?.movement_type === "change_contract" ? "Contract Renewal / Extension" :
      movement?.movement_type === "demote" ? "Demotion" :
      movement?.movement_type === "transfer" ? "Inter-Branch Transfer" : "Promotion"
    );

    setStatusType(initTitle);
    setEffectiveDate(movement?.effective_date || employee.join_date || new Date().toISOString().split("T")[0]);

    const initialBu =
      newV.branch_name ||
      newV.bu ||
      employee.branches?.name ||
      employee.bu_full_name ||
      (employee as any).company ||
      employee.code_bu ||
      "";
    setBu(initialBu);

    const initialSite = newV.site || employee.work_locations?.name || employee.site || "";
    setSite(initialSite);

    const initialDiv = newV.division || employee.division || "";
    setDivision(initialDiv);

    const initialDept = newV.department || employee.department || "";
    setDepartment(initialDept);

    const initialPos = newV.position || newV.role || newV.designation || employee.position || employee.role || "";
    setPosition(initialPos);

    const initialEmpType = newV.employment_type || newV.employee_type || employee.employment_type || "FULL-TIME";
    setEmployeeType(initialEmpType);

    const initialSup = newV.supervisor || newV.line_manager || employee.line_manager || "";
    setSupervisor(initialSup);

    const initialSalaryType = newV.salary_type || (employee as any).contract_rate_type || "Gross";
    setSalaryType(initialSalaryType);

    const rawSal =
      newV.new_salary != null ? String(newV.new_salary) :
      newV.basic_salary != null ? String(newV.basic_salary) :
      employee.basic_salary != null ? String(employee.basic_salary) :
      employee.contract_rate != null ? String(employee.contract_rate) : "";
    setSalary(rawSal);

    setRemark(movement?.remarks || employee.contract_remark || "");
  }, [open, movement, employee]);

  const allBuOptions: BranchOption[] = useMemo(() => {
    const map = new Map<string, BranchOption>();
    buList.forEach((b) => { if (b.name) map.set(b.name.trim().toLowerCase(), { id: b.id, name: b.name.trim() }); });
    if (employee.branches?.name) map.set(employee.branches.name.trim().toLowerCase(), { id: employee.branches.name, name: employee.branches.name.trim() });
    const empComp = (employee as any).company;
    if (empComp && !map.has(empComp.trim().toLowerCase())) map.set(empComp.trim().toLowerCase(), { id: empComp, name: empComp.trim() });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [buList, employee]);

  const allDivisionOptions = useMemo(() => {
    const set = new Set<string>();
    dbDivisions.forEach((d) => d && set.add(d.trim()));
    allEmployees.forEach((e) => {
      if (e.division) set.add(e.division.trim());
    });
    if (employee.division) set.add(employee.division.trim());
    if (division) set.add(division.trim());
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [dbDivisions, allEmployees, employee, division]);

  const allDepartmentOptions = useMemo(() => {
    const set = new Set<string>();
    dbDepartments.forEach((d) => d && set.add(d.trim()));
    allEmployees.forEach((e) => {
      if (e.department) set.add(e.department.trim());
    });
    if (employee.department) set.add(employee.department.trim());
    if (department) set.add(department.trim());
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [dbDepartments, allEmployees, employee, department]);

  const allPositionOptions = useMemo(() => {
    const set = new Set<string>();
    dbPositions.forEach((p) => p && set.add(p.trim()));
    allEmployees.forEach((e) => {
      const pos = e.position || e.role;
      if (pos) set.add(pos.trim());
    });
    if (employee.position) set.add(employee.position.trim());
    if (employee.role) set.add(employee.role.trim());
    if (position) set.add(position.trim());
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [dbPositions, allEmployees, employee, position]);

  const siteOptions = useMemo(() => {
    const selectedBranchObj = buList.find(
      (b) => b.name.toLowerCase().trim() === bu.toLowerCase().trim() || b.id === bu
    );

    const branchSpecific = selectedBranchObj
      ? dbWorkLocations.filter((w) => w.branch_id === selectedBranchObj.id)
      : [];

    const sourceSites = branchSpecific.length > 0 ? branchSpecific : dbWorkLocations;

    const set = new Set<string>();
    sourceSites.forEach((w) => {
      if (w.name?.trim()) set.add(w.name.trim());
    });

    if (site && site.trim()) set.add(site.trim());
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [dbWorkLocations, bu, buList, site]);

  const supervisorOptions = useMemo(() => {
    return allEmployees.filter((e) => e.id !== employee.id);
  }, [allEmployees, employee.id]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusType) return setErrorMsg("Please select a status type.");
    setSaving(true);
    setErrorMsg(null);

    try {
      const updated = await saveMovementInfo(employee, movement, {
        title: statusType,
        effectiveDate,
        bu,
        site,
        division,
        department,
        position,
        designation: position,
        employeeType,
        supervisor,
        salaryType,
        salary: salary ? Number(salary) : null,
        salaryFreq: "Monthly",
        remarks: remark,
        file: attachmentFile,
      });
      toast("Movement Updated", "Movement and status change information saved successfully.", "success");
      onSaved(updated);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update movement info");
    } finally {
      setSaving(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-xs overflow-y-auto animate-in fade-in-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden my-auto text-xs">
        {/* Header */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
          <h2 className="text-base font-normal text-slate-800 dark:text-slate-100 tracking-tight">
            Edit Change Status
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700"
          >
            <i className="ri-arrow-left-line text-xs" />
            <span>Back</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {errorMsg && (
            <div className="p-3 text-xs font-medium text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-md flex items-center gap-2">
              <i className="ri-error-warning-line text-base shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Employee Info Section */}
          <div>
            <h3 className="text-[11px] font-bold text-[#0284c7] uppercase tracking-wider mb-3">
              EMPLOYEE INFO
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
              <label className="md:col-span-3 text-xs font-medium text-slate-600 dark:text-slate-300 md:text-right pr-2">
                Employee <span className="text-rose-500">*</span>
              </label>
              <div className="md:col-span-9">
                <div className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded bg-slate-50/70 dark:bg-slate-800/70 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[10px] text-slate-600 dark:text-slate-300 uppercase shrink-0">
                      {employee.last_name?.[0] || ""}{employee.first_name?.[0] || ""}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                        {employee.last_name} {employee.first_name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {employee.branches?.name || employee.bu_full_name || (employee as any).company || employee.code_bu || "HQ"} · {employee.department || "General"} · {employee.role || employee.position || "Staff"}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-200/60 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {employee.employee_code || (employee as any).employee_id || employee.biometric_user_id || "ID"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* Change Status Info Section */}
          <ChangeStatusInfoSection
            statusType={statusType}
            setStatusType={setStatusType}
            effectiveDate={effectiveDate}
            setEffectiveDate={setEffectiveDate}
            bu={bu}
            setBu={setBu}
            site={site}
            setSite={setSite}
            division={division}
            setDivision={setDivision}
            department={department}
            setDepartment={setDepartment}
            position={position}
            setPosition={setPosition}
            designation={position}
            setDesignation={setPosition}
            employeeType={employeeType}
            setEmployeeType={setEmployeeType}
            supervisor={supervisor}
            setSupervisor={setSupervisor}
            isSupervisorDropdownOpen={isSupervisorDropdownOpen}
            setIsSupervisorDropdownOpen={setIsSupervisorDropdownOpen}
            supervisorDropdownRef={supervisorDropdownRef}
            salaryType={salaryType}
            setSalaryType={setSalaryType}
            salary={salary}
            setSalary={setSalary}
            remark={remark}
            setRemark={setRemark}
            buOptions={allBuOptions}
            siteOptions={siteOptions}
            divisions={allDivisionOptions}
            departments={allDepartmentOptions}
            positions={allPositionOptions}
            supervisorOptions={supervisorOptions}
            onReloadBranches={reloadBranches}
            onReloadSites={reloadWorkLocations}
          />

          <div className="border-t border-slate-100 dark:border-slate-800" />

          {/* Attachment Info Section */}
          <div>
            <ChangeStatusAttachmentSection
              attachmentFile={attachmentFile}
              setAttachmentFile={setAttachmentFile}
            />
            {movement?.document_url && !attachmentFile && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mt-2">
                <div className="md:col-span-3" />
                <div className="md:col-span-9 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <i className="ri-attachment-line text-sky-600" />
                  <span>Existing File:</span>
                  <a
                    href={movement.document_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-600 hover:underline font-medium truncate max-w-xs"
                  >
                    {movement.document_name || "View Document"}
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-xs" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <i className="ri-save-line text-xs" />
                  <span>Save</span>
                  <i className="ri-arrow-down-s-line text-[10px] text-slate-300" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-3.5 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
            >
              <i className="ri-close-line text-xs" />
              <span>Discard</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(modalContent, document.body) : null;
};


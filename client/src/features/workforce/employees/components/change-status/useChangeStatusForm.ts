import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/Toast";
import type { BranchOption } from "./types";
import { submitChangeStatus } from "./changeStatusSubmit";

interface UseChangeStatusFormParams {
  isOpen: boolean;
  employees: any[];
  branches?: BranchOption[];
  divisions?: string[];
  preselectedEmployeeId?: string;
  onSuccess?: () => void;
  onClose: () => void;
}

export function useChangeStatusForm({
  isOpen,
  employees,
  branches = [],
  divisions = [],
  preselectedEmployeeId,
  onSuccess,
  onClose,
}: UseChangeStatusFormParams) {
  const { user } = useAuth();
  const [selectedEmpId, setSelectedEmpId] = useState<string>("");
  const [empSearchQuery, setEmpSearchQuery] = useState<string>("");
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState<boolean>(false);
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
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [buList, setBuList] = useState<BranchOption[]>(branches);
  const [dbDivisions, setDbDivisions] = useState<string[]>([]);
  const [dbWorkLocations, setDbWorkLocations] = useState<Array<{ id: string; name: string; branch_id: string | null }>>([]);

  const empDropdownRef = useRef<HTMLDivElement>(null);
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
            data
              .filter((d: any) => !d.status || d.status !== "disabled")
              .map((d: any) => d.name?.trim())
              .filter(Boolean)
          ));
          setDbDivisions(list);
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

  useEffect(() => {
    if (branches && branches.length > 0) setBuList(branches);
    reloadBranches();
    reloadDivisions();
    reloadWorkLocations();
  }, [branches, reloadBranches, reloadDivisions, reloadWorkLocations]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (empDropdownRef.current && !empDropdownRef.current.contains(e.target as Node)) setIsEmpDropdownOpen(false);
      if (supervisorDropdownRef.current && !supervisorDropdownRef.current.contains(e.target as Node)) setIsSupervisorDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      const targetId = preselectedEmployeeId || "";
      setSelectedEmpId(targetId);
      setErrorMsg(null);
      setAttachmentFile(null);
      setEffectiveDate(new Date().toISOString().split("T")[0]);
      if (!targetId) {
        setEmpSearchQuery("");
        setStatusType("Promotion");
        setBu("");
        setSite("");
        setDivision("");
        setDepartment("");
        setPosition("");
        setEmployeeType("FULL-TIME");
        setSupervisor("");
        setSalaryType("Gross");
        setSalary("");
        setRemark("");
      }
    }
  }, [isOpen, preselectedEmployeeId]);

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === selectedEmpId) || null,
    [employees, selectedEmpId]
  );

  const allBuOptions: BranchOption[] = useMemo(() => {
    const map = new Map<string, BranchOption>();
    buList.forEach((b) => { if (b.name) map.set(b.name.trim().toLowerCase(), { id: b.id, name: b.name.trim() }); });
    employees.forEach((e) => {
      const name = e.branches?.name || e.bu_full_name || e.company;
      if (name && !map.has(name.trim().toLowerCase())) {
        map.set(name.trim().toLowerCase(), { id: e.branch_id || name, name: name.trim() });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [buList, employees]);

  const allDivisionOptions = useMemo(() => {
    const set = new Set<string>();
    (divisions || []).forEach((d) => d && set.add(d.trim()));
    dbDivisions.forEach((d) => d && set.add(d.trim()));
    employees.forEach((e) => {
      if (e.division) set.add(e.division.trim());
    });
    if (selectedEmployee?.division) set.add(selectedEmployee.division.trim());
    if (division) set.add(division.trim());
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [divisions, dbDivisions, employees, selectedEmployee, division]);

  const siteOptions = useMemo(() => {
    const selectedBranchObj = buList.find(
      (b) => b.name.toLowerCase().trim() === bu.toLowerCase().trim() || b.id === bu
    );

    // Get sites directly from Org (work_locations)
    const branchSpecific = selectedBranchObj
      ? dbWorkLocations.filter((w) => w.branch_id === selectedBranchObj.id)
      : [];

    const sourceSites = branchSpecific.length > 0 ? branchSpecific : dbWorkLocations;

    const set = new Set<string>();
    sourceSites.forEach((w) => {
      if (w.name?.trim()) set.add(w.name.trim());
    });

    if (site && site.trim()) {
      set.add(site.trim());
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [dbWorkLocations, bu, buList, site]);

  useEffect(() => {
    if (selectedEmployee) {
      setEmpSearchQuery(`${selectedEmployee.first_name} ${selectedEmployee.last_name}`);
      const branchName = selectedEmployee.branches?.name || selectedEmployee.bu_full_name || selectedEmployee.company ||
        buList.find((b) => b.id === selectedEmployee.branch_id)?.name || "";
      const siteName = selectedEmployee.work_locations?.name || selectedEmployee.site || "";
      setBu(branchName);
      setSite(siteName);
      setDivision(selectedEmployee.division || "");
      setDepartment(selectedEmployee.department || "");
      setPosition(selectedEmployee.position || selectedEmployee.role || "");
      setEmployeeType(selectedEmployee.employment_type || "FULL-TIME");
      setSupervisor(selectedEmployee.line_manager || "");
      setSalaryType(selectedEmployee.contract_rate_type || "Gross");
      const curSal = selectedEmployee.basic_salary != null ? String(selectedEmployee.basic_salary) :
        selectedEmployee.contract_rate != null ? String(selectedEmployee.contract_rate) : "";
      setSalary(curSal);
    }
  }, [selectedEmployee, buList]);

  const filteredEmployees = useMemo(() => {
    const q = empSearchQuery.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) => {
      const name = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
      const codeBu = (e.code_bu || e.branches?.name || e.bu_full_name || "").toLowerCase();
      const role = (e.role || "").toLowerCase();
      const dept = (e.department || "").toLowerCase();
      const empId = (e.employee_id || e.biometric_user_id || "").toString().toLowerCase();
      return name.includes(q) || codeBu.includes(q) || role.includes(q) || dept.includes(q) || empId.includes(q);
    });
  }, [employees, empSearchQuery]);

  const supervisorOptions = useMemo(() => employees.filter((e) => e.id !== selectedEmpId), [employees, selectedEmpId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return setErrorMsg("Please select an employee first.");
    if (!statusType) return setErrorMsg("Please select a status type.");

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await submitChangeStatus({
        selectedEmployee,
        statusType,
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
        salary,
        remark,
        attachmentFile,
        allBuOptions,
        dbWorkLocations,
        user,
      });
      toast("Success", `Status change recorded for ${selectedEmployee.first_name} ${selectedEmployee.last_name}`, "success");
      onSuccess?.();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to record status change. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    selectedEmpId, setSelectedEmpId,
    empSearchQuery, setEmpSearchQuery,
    isEmpDropdownOpen, setIsEmpDropdownOpen,
    empDropdownRef, supervisorDropdownRef,
    statusType, setStatusType,
    effectiveDate, setEffectiveDate,
    bu, setBu,
    site, setSite,
    division, setDivision,
    department, setDepartment,
    position, setPosition,
    designation: position, setDesignation: setPosition,
    employeeType, setEmployeeType,
    supervisor, setSupervisor,
    isSupervisorDropdownOpen, setIsSupervisorDropdownOpen,
    salaryType, setSalaryType,
    salary, setSalary,
    remark, setRemark,
    attachmentFile, setAttachmentFile,
    submitting, errorMsg,
    selectedEmployee, filteredEmployees, supervisorOptions,
    allBuOptions, allDivisionOptions, siteOptions, reloadBranches, reloadDivisions, reloadWorkLocations,
    handleSubmit,
  };
}

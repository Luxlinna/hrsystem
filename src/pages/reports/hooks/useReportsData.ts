import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import { MODULES, EMPLOYEE_SCOPED_MODULES } from "../constants";
import type { ReportConfig, ReportRow } from "../types";

export function useReportsData() {
  const { isSuperAdmin, effectiveBranchName } = useBranchScope();
  const [searchParams, setSearchParams] = useSearchParams();
  const paramMod = searchParams.get("module");
  const [activeModule, setActiveModuleState] = useState(
    paramMod && MODULES.some((m) => m.id === paramMod) ? paramMod : "shifts"
  );

  const [dateFrom, setDateFrom] = useState(searchParams.get("from") || "");
  const [dateTo, setDateTo] = useState(searchParams.get("to") || "");

  useEffect(() => {
    const mod = searchParams.get("module");
    if (mod && MODULES.some((m) => m.id === mod)) {
      setActiveModuleState(mod);
    }
    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    if (fromParam !== null) setDateFrom(fromParam);
    if (toParam !== null) setDateTo(toParam);
  }, [searchParams]);

  const setActiveModule = useCallback(
    (modId: string) => {
      setActiveModuleState(modId);
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("module", modId);
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const [recordStatus, setRecordStatus] = useState<"all" | "active" | "deleted">("all");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [branchFilter, setBranchFilter] = useState(() => {
    return (!isSuperAdmin && effectiveBranchName && effectiveBranchName !== "All Branches") ? effectiveBranchName : "";
  });

  useEffect(() => {
    if (!isSuperAdmin && effectiveBranchName && effectiveBranchName !== "All Branches") {
      setBranchFilter(effectiveBranchName);
    }
  }, [isSuperAdmin, effectiveBranchName]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [reportData, setReportData] = useState<ReportRow[]>([]);
  const [reportColumns, setReportColumns] = useState<string[]>([]);

  useEffect(() => {
    supabase
      .from("employees")
      .select("department")
      .eq("status", "active")
      .then(({ data }) => {
        setDepartments(
          [...new Set((data || []).map((r) => r.department).filter(Boolean))].sort()
        );
      });
    supabase
      .from("branches")
      .select("name")
      .order("name")
      .then(({ data }) => {
        setBranches((data || []).map((r) => r.name));
      });
  }, []);

  const isEmployeeScoped = EMPLOYEE_SCOPED_MODULES.has(activeModule);
  const isNameScoped = isEmployeeScoped && activeModule !== "headcount";
  const isDateScoped = activeModule !== "headcount";

  const reportConfig: ReportConfig = useMemo(
    () => ({
      module: activeModule,
      dateFrom,
      dateTo,
      employeeSearch,
      departmentFilter,
      branchFilter,
      recordStatus,
    }),
    [
      activeModule,
      dateFrom,
      dateTo,
      employeeSearch,
      departmentFilter,
      branchFilter,
      recordStatus,
    ]
  );

  const handleDataReady = useCallback((rows: ReportRow[], cols: string[]) => {
    setReportData(rows);
    setReportColumns(cols);
  }, []);

  return {
    activeModule,
    setActiveModule,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    recordStatus,
    setRecordStatus,
    employeeSearch,
    setEmployeeSearch,
    departmentFilter,
    setDepartmentFilter,
    branchFilter,
    setBranchFilter,
    departments,
    branches,
    reportData,
    reportColumns,
    isEmployeeScoped,
    isNameScoped,
    isDateScoped,
    reportConfig,
    handleDataReady,
  };
}

import { useState, useMemo, useRef, useEffect } from "react";
import type { Employee, LeaveFormData, LeaveTypeBalanceStats } from "../../types";
import {
  LEAVE_TYPE_CONFIG,
  SPECIAL_LEAVE_LABOUR_LAW_CATEGORIES,
  MATERNITY_LEAVE_LABOUR_LAW_CATEGORIES,
} from "../../constants";
import { calculateDays } from "../../dateUtils";
import { exportLeaveApplicationSlip } from "../../exports/exportLeaveApplicationSlip";
import { matchLeaveEmployee } from "./leaveEmployeeMatch";
import { findLineManager } from "./leaveFormHelpers";
import { getLeaveEmployeeName } from "../../utils/leaveDisplayUtils";
import {
  type LeaveTypeSetting,
  getLeaveTypeSlug,
  getLeaveTypeTheme,
  getStoredLeaveTypes,
  fetchLeaveSettings,
} from "../../services/leaveSettingsService";

interface UseCreateLeaveFormStateParams {
  employees: Employee[];
  myEmployee: Employee | null;
  formData: LeaveFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeaveFormData>>;
  isSuperAdmin: boolean;
  myApproverName: string;
  getLeaveTypeStats: (empId: string, type: string) => LeaveTypeBalanceStats;
  leaveTypes?: LeaveTypeSetting[];
}

export function useCreateLeaveFormState({
  employees,
  myEmployee,
  formData,
  setFormData,
  isSuperAdmin,
  myApproverName,
  getLeaveTypeStats,
  leaveTypes: propLeaveTypes,
}: UseCreateLeaveFormStateParams) {
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);
  const [showDeductionPeriod, setShowDeductionPeriod] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const empDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic leave types state synced with settings and Supabase
  const [allLeaveTypes, setAllLeaveTypes] = useState<LeaveTypeSetting[]>(() => {
    if (propLeaveTypes && propLeaveTypes.length > 0) return propLeaveTypes;
    return getStoredLeaveTypes();
  });

  useEffect(() => {
    if (propLeaveTypes && propLeaveTypes.length > 0) {
      setAllLeaveTypes(propLeaveTypes);
    } else {
      fetchLeaveSettings().then((data) => {
        if (data && data.length > 0) setAllLeaveTypes(data);
      });
    }

    const handleUpdate = (e: any) => {
      const detail = e.detail;
      if (Array.isArray(detail)) {
        setAllLeaveTypes(detail);
      } else {
        setAllLeaveTypes(getStoredLeaveTypes());
      }
    };
    window.addEventListener("leave_types_settings_updated", handleUpdate);
    return () => window.removeEventListener("leave_types_settings_updated", handleUpdate);
  }, [propLeaveTypes]);

  // Active leave types only (matching Status: Active in Leave Types tab)
  const activeLeaveTypes = useMemo(() => {
    const active = allLeaveTypes.filter((t) => t.is_active);
    return active.length > 0 ? active : allLeaveTypes;
  }, [allLeaveTypes]);

  // Currently selected leave type setting
  const currentLeaveTypeSetting = useMemo(() => {
    return activeLeaveTypes.find((t) => {
      const slug = getLeaveTypeSlug(t);
      return (
        slug === formData.leave_type ||
        t.code?.toLowerCase() === formData.leave_type?.toLowerCase() ||
        t.id === formData.leave_type
      );
    });
  }, [activeLeaveTypes, formData.leave_type]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (empDropdownRef.current && !empDropdownRef.current.contains(e.target as Node)) {
        setIsEmpDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeEmpId = formData.employee_id || myEmployee?.id || "";
  const selectedEmployee = useMemo(() => {
    return (
      employees.find((e) => e.id === activeEmpId) ||
      (myEmployee?.id === activeEmpId ? myEmployee : null)
    );
  }, [employees, myEmployee, activeEmpId]);

  const lineManager = useMemo(() => {
    return findLineManager(employees, selectedEmployee, activeEmpId, myEmployee, myApproverName);
  }, [selectedEmployee, employees, activeEmpId, myEmployee, myApproverName]);

  const supervisorName = useMemo(() => {
    if (lineManager) return getLeaveEmployeeName(lineManager);
    if (myApproverName && activeEmpId === myEmployee?.id) return myApproverName;
    return "Mrs. Chea Tiengchanvathna";
  }, [lineManager, myApproverName, activeEmpId, myEmployee]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => matchLeaveEmployee(e, employeeSearch));
  }, [employees, employeeSearch]);

  const requestedDays = useMemo(() => {
    return calculateDays(formData.start_date, formData.end_date);
  }, [formData.start_date, formData.end_date]);

  // Dynamic leave type configuration
  const activeTypeCfg = useMemo(() => {
    const fallback = LEAVE_TYPE_CONFIG[formData.leave_type] || LEAVE_TYPE_CONFIG.annual;
    const theme = getLeaveTypeTheme(currentLeaveTypeSetting?.code || formData.leave_type);
    return {
      code: currentLeaveTypeSetting?.code || fallback.code,
      label: currentLeaveTypeSetting?.name || fallback.label,
      icon: theme.icon,
      bg: theme.bg,
      text: theme.text,
      border: theme.border,
      badgeBg: theme.badgeBg,
      requiresUpload: currentLeaveTypeSetting
        ? currentLeaveTypeSetting.require_attachment
        : fallback.requiresUpload,
      defaultDays: fallback.defaultDays,
      isUnpaid: currentLeaveTypeSetting?.is_unpaid ?? false,
      periodType: currentLeaveTypeSetting?.period_type || "daily",
      eligibleFor: currentLeaveTypeSetting?.eligible_for || "both",
      excludedContractTypes: currentLeaveTypeSetting?.excluded_contract_types || [],
      rate: currentLeaveTypeSetting?.rate ?? 1.0,
    };
  }, [currentLeaveTypeSetting, formData.leave_type]);

  const currentStats: LeaveTypeBalanceStats = useMemo(() => {
    if (!activeEmpId) return { balance: 0, used: 0, available: 0, pending: 0 };
    return getLeaveTypeStats(activeEmpId, formData.leave_type);
  }, [activeEmpId, formData.leave_type, getLeaveTypeStats]);

  const remainingAfterLeave = Math.max(0, currentStats.available - requestedDays);
  const isOverBalance = requestedDays > currentStats.available && !isSuperAdmin;

  const handleSelectSpecialCategory = (catId: string) => {
    const cat = SPECIAL_LEAVE_LABOUR_LAW_CATEGORIES.find((c) => c.id === catId);
    if (!cat) return;
    setFormData((prev) => {
      let nextEnd = prev.end_date;
      if (prev.start_date && cat.defaultDays > 0) {
        const d = new Date(prev.start_date);
        d.setDate(d.getDate() + (cat.defaultDays - 1));
        nextEnd = d.toISOString().split("T")[0];
      }
      return {
        ...prev,
        category_law: `${cat.name} (${cat.lawRef})`,
        end_date: nextEnd,
      };
    });
  };

  const handleSelectMaternityCategory = (catId: string) => {
    const cat = MATERNITY_LEAVE_LABOUR_LAW_CATEGORIES.find((c) => c.id === catId);
    if (!cat) return;
    setFormData((prev) => {
      let nextEnd = prev.end_date;
      if (prev.start_date && cat.defaultDays > 0) {
        const d = new Date(prev.start_date);
        d.setDate(d.getDate() + (cat.defaultDays - 1));
        nextEnd = d.toISOString().split("T")[0];
      }
      return {
        ...prev,
        category_law: `${cat.name} (${cat.lawRef})`,
        end_date: nextEnd,
      };
    });
  };

  const handleApply90DaysMaternity = () => {
    if (!formData.start_date) return;
    const d = new Date(formData.start_date);
    d.setDate(d.getDate() + 89);
    setFormData((prev) => ({
      ...prev,
      end_date: d.toISOString().split("T")[0],
      category_law: prev.category_law || "Standard Delivery (Labour Law Art. 182)",
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, attachment_file: file }));
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, attachment_file: file }));
    }
  };

  const handleRemoveAttachment = () => {
    setFormData((prev) => ({ ...prev, attachment_file: null, attachment_url: null }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleExportSlip = () => {
    exportLeaveApplicationSlip({
      form: formData,
      employee: selectedEmployee,
      approverName: myApproverName,
      stats: currentStats,
      requestedDays,
    });
  };

  return {
    activeEmpId,
    employeeSearch,
    setEmployeeSearch,
    isEmpDropdownOpen,
    setIsEmpDropdownOpen,
    showDeductionPeriod,
    setShowDeductionPeriod,
    isDragOver,
    setIsDragOver,
    empDropdownRef,
    fileInputRef,
    selectedEmployee,
    lineManager,
    supervisorName,
    filteredEmployees,
    requestedDays,
    activeLeaveTypes,
    currentLeaveTypeSetting,
    activeTypeCfg,
    currentStats,
    remainingAfterLeave,
    isOverBalance,
    handleSelectSpecialCategory,
    handleSelectMaternityCategory,
    handleApply90DaysMaternity,
    handleFileChange,
    handleFileDrop,
    handleRemoveAttachment,
    handleExportSlip,
  };
}

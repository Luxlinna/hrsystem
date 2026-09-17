import React, { memo, useState, useMemo, useRef, useEffect } from "react";
import type { Employee, LeaveFormData, LeaveTypeBalanceStats } from "../../types";
import {
  LEAVE_TYPE_CONFIG,
  SPECIAL_LEAVE_LABOUR_LAW_CATEGORIES,
  MATERNITY_LEAVE_LABOUR_LAW_CATEGORIES,
} from "../../constants";
import { calculateDays } from "../../dateUtils";
import { formatPaddedPin, extractMachinePin } from "@/lib/biometricUtils";
import { exportLeaveApplicationSlip } from "../../exports/exportLeaveApplicationSlip";

export interface CreateLeaveFormProps {
  onBack: () => void;
  employees: Employee[];
  myEmployee: Employee | null;
  formData: LeaveFormData;
  setFormData: React.Dispatch<React.SetStateAction<LeaveFormData>>;
  submitting: boolean;
  canManage: boolean;
  isSuperAdmin: boolean;
  myApproverName: string;
  hrApprovers?: Employee[];
  getLeaveTypeStats: (empId: string, type: string) => LeaveTypeBalanceStats;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  formMode?: "self" | "for_employee";
}

function matchLeaveEmployee(e: Employee, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const cleanQ = q.replace(/^(id\s*[:#\-]?|#)/i, "").trim();
  if (!cleanQ) return true;

  const rawBio = (e.biometric_user_id || "").trim();
  const rawCode = (e.employee_code || e.employee_id || "").trim();
  const pinBio = extractMachinePin(rawBio);
  const paddedBio = formatPaddedPin(rawBio);
  const buName = (e.branches?.name || "").toLowerCase();

  if (/^\d+$/.test(cleanQ)) {
    const qNum = cleanQ.replace(/^0+/, "") || "0";
    const paddedQ = cleanQ.padStart(3, "0");
    if (
      pinBio === qNum ||
      paddedBio === paddedQ ||
      rawCode === cleanQ ||
      rawCode.replace(/^0+/, "") === qNum ||
      rawCode.padStart(3, "0") === paddedQ
    ) {
      return true;
    }
    if (paddedBio && paddedBio.startsWith(cleanQ)) return true;
    if (rawCode && rawCode.startsWith(cleanQ)) return true;
  }

  const fullName = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
  const role = (e.role || "").toLowerCase();
  const dept = (e.department || "").toLowerCase();

  return (
    fullName.includes(q) ||
    role.includes(q) ||
    dept.includes(q) ||
    buName.includes(q) ||
    rawCode.toLowerCase().includes(q)
  );
}

export const CreateLeaveForm = memo(function CreateLeaveForm({
  onBack,
  employees,
  myEmployee,
  formData,
  setFormData,
  submitting,
  canManage,
  isSuperAdmin,
  myApproverName,
  hrApprovers,
  getLeaveTypeStats,
  onSubmit,
  formMode = "self",
}: CreateLeaveFormProps) {
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isEmpDropdownOpen, setIsEmpDropdownOpen] = useState(false);
  const [showDeductionPeriod, setShowDeductionPeriod] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const empDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
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

  // Identify direct Line Manager for Step 1
  const lineManager = useMemo(() => {
    if (!selectedEmployee) return null;
    if (selectedEmployee.reports_to) {
      const found = employees.find((e) => e.id === selectedEmployee.reports_to);
      if (found) return found;
    }
    if (activeEmpId === myEmployee?.id && myApproverName) {
      const found = employees.find(
        (e) =>
          `${e.first_name || ""} ${e.last_name || ""}`.trim().toLowerCase() ===
          myApproverName.trim().toLowerCase()
      );
      if (found) return found;
    }
    // Fallback: branch or department manager/supervisor
    const cand = employees.find(
      (e) =>
        e.id !== selectedEmployee.id &&
        (e.role?.toLowerCase().includes("manager") ||
          e.role?.toLowerCase().includes("supervisor") ||
          e.role?.toLowerCase().includes("head") ||
          e.role?.toLowerCase().includes("lead") ||
          e.role?.toLowerCase().includes("director")) &&
        (e.branch_id === selectedEmployee.branch_id ||
          (e.department && selectedEmployee.department && e.department === selectedEmployee.department))
    );
    return cand || null;
  }, [selectedEmployee, employees, activeEmpId, myEmployee, myApproverName]);

  // Step 2 HR Approvers (Matching user screenshot: Chea Rachana & Chorn Sokcheng)
  const finalHrApprovers = useMemo(() => {
    const list: Array<{ id: string; name: string; role: string; avatar_url?: string }> = [];
    if (hrApprovers && hrApprovers.length > 0) {
      hrApprovers.forEach((h) => {
        list.push({
          id: h.id,
          name: `${h.first_name || ""} ${h.last_name || ""}`.trim() || "HR Officer",
          role: h.role || h.department || "HR Admin Officer",
          avatar_url: h.avatar_url,
        });
      });
    }
    if (list.length === 0) {
      list.push(
        {
          id: "hr-rachana",
          name: "Chea Rachana",
          role: "HR Admin Officer",
          avatar_url: "",
        },
        {
          id: "hr-sokcheng",
          name: "Chorn Sokcheng",
          role: "HR Admin Officer",
          avatar_url: "",
        }
      );
    } else if (list.length === 1 && !list.some((h) => h.name.toLowerCase().includes("sokcheng"))) {
      list.push({
        id: "hr-sokcheng",
        name: "Chorn Sokcheng",
        role: "HR Admin Officer",
        avatar_url: "",
      });
    }
    return list;
  }, [hrApprovers]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => matchLeaveEmployee(e, employeeSearch));
  }, [employees, employeeSearch]);

  const requestedDays = useMemo(() => {
    return calculateDays(formData.start_date, formData.end_date);
  }, [formData.start_date, formData.end_date]);

  // Current Leave Type configuration & live stats
  const activeTypeCfg = LEAVE_TYPE_CONFIG[formData.leave_type] || LEAVE_TYPE_CONFIG.annual;
  const currentStats: LeaveTypeBalanceStats = useMemo(() => {
    if (!activeEmpId) return { balance: 0, used: 0, available: 0, pending: 0 };
    return getLeaveTypeStats(activeEmpId, formData.leave_type);
  }, [activeEmpId, formData.leave_type, getLeaveTypeStats]);

  const remainingAfterLeave = Math.max(0, currentStats.available - requestedDays);
  const isOverBalance = requestedDays > currentStats.available && !isSuperAdmin;

  // Handle Labour Law category selection
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

  // Attachment handling
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

  const isEmployeeSelectorEditable = canManage && formMode !== "self" && employees.length > 1;

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              <span>Time &amp; Attendance</span>
              <i className="ri-arrow-right-s-line text-xs" />
              <span>Absence &amp; Leave</span>
              <i className="ri-arrow-right-s-line text-xs" />
              <span className="text-[#253C7D] font-bold">Create Leave</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
              Create Leave
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  isSuperAdmin
                    ? "bg-emerald-100 text-emerald-800"
                    : formMode === "for_employee"
                    ? "bg-[#253C7D]/10 text-[#253C7D]"
                    : "bg-blue-50 text-blue-700"
                }`}
              >
                {isSuperAdmin
                  ? "Super Admin (Auto-Approve)"
                  : formMode === "for_employee"
                  ? "Request Leave For Employee"
                  : "Self Request"}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {isSuperAdmin
                ? "Directly record and approve employee leave without managerial review."
                : formMode === "for_employee"
                ? "Submit an official leave request on behalf of a team member."
                : "Submit a time off application for line manager and HR approval."}
            </p>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-xs font-bold shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
          >
            <i className="ri-arrow-left-line text-sm text-[#253C7D]" />
            Back to Leave Hub
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {/* SECTION 1: EMPLOYEE INFO */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs">
            <h2 className="text-xs font-extrabold text-[#253C7D] uppercase tracking-wider mb-4 flex items-center gap-2">
              <i className="ri-user-star-line text-base" />
              Employee Info
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <label className="md:col-span-3 text-xs font-bold text-gray-700">
                Employee Name <span className="text-rose-500">*</span>
              </label>

              <div className="md:col-span-9 relative" ref={empDropdownRef}>
                {isEmployeeSelectorEditable ? (
                  <div>
                    <div
                      onClick={() => setIsEmpDropdownOpen((prev) => !prev)}
                      className="w-full px-3.5 py-2.5 bg-gray-50 hover:bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-800 flex items-center justify-between cursor-pointer focus-within:border-[#253C7D] transition-colors"
                    >
                      <span className="truncate">
                        {selectedEmployee
                          ? `${selectedEmployee.first_name} ${selectedEmployee.last_name} ${
                              selectedEmployee.employee_code || selectedEmployee.biometric_user_id
                                ? `(#${formatPaddedPin(selectedEmployee.biometric_user_id) || selectedEmployee.employee_code})`
                                : ""
                            } - ${selectedEmployee.department || "Staff"}`
                          : "Search by full name or ID (e.g. 001)..."}
                      </span>
                      <i className="ri-arrow-down-s-line text-gray-400 text-base" />
                    </div>

                    {isEmpDropdownOpen && (
                      <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl p-2 max-h-72 overflow-y-auto animate-in fade-in-50 zoom-in-95">
                        <div className="relative mb-2">
                          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                          <input
                            type="text"
                            autoFocus
                            placeholder="Type employee name or ID number (e.g. 1, 001, 45)..."
                            value={employeeSearch}
                            onChange={(e) => setEmployeeSearch(e.target.value)}
                            className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
                          />
                        </div>

                        <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                          {filteredEmployees.length === 0 ? (
                            <div className="p-3 text-center text-xs text-gray-400">
                              No employees matching "{employeeSearch}"
                            </div>
                          ) : (
                            filteredEmployees.map((emp) => {
                              const paddedPin = formatPaddedPin(emp.biometric_user_id);
                              const isSelected = emp.id === activeEmpId;
                              return (
                                <div
                                  key={emp.id}
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, employee_id: emp.id }));
                                    setIsEmpDropdownOpen(false);
                                    setEmployeeSearch("");
                                  }}
                                  className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer text-xs transition-colors ${
                                    isSelected
                                      ? "bg-[#253C7D]/10 text-[#253C7D] font-bold"
                                      : "hover:bg-slate-50 text-gray-800"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-gray-100 text-[#253C7D] font-extrabold flex items-center justify-center text-[11px] shrink-0">
                                      {emp.first_name?.[0] || "E"}
                                    </div>
                                    <div>
                                      <div className="font-extrabold">
                                        {emp.first_name} {emp.last_name}
                                        {paddedPin && (
                                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-blue-50 text-[#253C7D] text-[10px] font-mono font-black border border-blue-200">
                                            ID #{paddedPin}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-gray-400 font-medium">
                                        {emp.role || "Staff"} &middot; {emp.department || "General"}
                                        {emp.branches?.name && ` &middot; ${emp.branches.name}`}
                                      </div>
                                    </div>
                                  </div>
                                  {isSelected && <i className="ri-check-line text-sm text-[#253C7D]" />}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className="ri-user-fill text-[#253C7D]" />
                      <span>
                        {selectedEmployee
                          ? `${selectedEmployee.first_name} ${selectedEmployee.last_name}`
                          : "Current User"}
                      </span>
                      {selectedEmployee?.biometric_user_id && (
                        <span className="px-1.5 py-0.5 rounded bg-blue-50 text-[#253C7D] text-[10px] font-mono font-bold border border-blue-200">
                          ID #{formatPaddedPin(selectedEmployee.biometric_user_id)}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-semibold text-gray-400">
                      {selectedEmployee?.role || "Employee"} &middot; {selectedEmployee?.department || "General"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 2: LEAVE TYPE INFO */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
            <h2 className="text-xs font-extrabold text-[#253C7D] uppercase tracking-wider mb-2 flex items-center gap-2">
              <i className="ri-calendar-todo-line text-base" />
              Leave Type Info
            </h2>

            {/* Leave Type Selector */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <label className="md:col-span-3 text-xs font-bold text-gray-700">
                Leave Type <span className="text-rose-500">*</span>
              </label>
              <div className="md:col-span-9 relative">
                <select
                  value={formData.leave_type}
                  onChange={(e) => {
                    const newType = e.target.value;
                    setFormData((prev) => {
                      let nextCat = "";
                      let nextEnd = prev.end_date;
                      if (newType === "maternity" && prev.start_date) {
                        const d = new Date(prev.start_date);
                        d.setDate(d.getDate() + 89);
                        nextEnd = d.toISOString().split("T")[0];
                        nextCat = "Standard Delivery (Labour Law Art. 182)";
                      }
                      return {
                        ...prev,
                        leave_type: newType,
                        category_law: nextCat,
                        end_date: nextEnd,
                      };
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer appearance-none pr-10"
                >
                  <option value="annual">AL — Annual Leave</option>
                  <option value="sick">SL — Sick Leave</option>
                  <option value="special">SP — Special Leave (Labour Law Art. 171)</option>
                  <option value="maternity">ML — Maternity Leave (90 Days Statutory)</option>
                  <option value="unpaid">UL — Unpaid Leave</option>
                  <option value="paternity">PL — Paternity Leave</option>
                  <option value="bereavement">BL — Bereavement Leave</option>
                  <option value="study">STL — Study Leave</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 flex items-center">
                  <i className="ri-arrow-down-s-line text-base" />
                </div>
              </div>
            </div>

            {/* Dynamic Balances Row based on selected Leave Type */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider pt-1">
                {activeTypeCfg.code} Entitlements
              </div>
              <div className="md:col-span-9 space-y-2">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center">
                    <div className="text-[10px] font-bold text-slate-500 uppercase">
                      {activeTypeCfg.code} Balance
                    </div>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">
                      {currentStats.balance} <span className="text-xs font-medium text-slate-400">days</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-center">
                    <div className="text-[10px] font-bold text-amber-700 uppercase">
                      {activeTypeCfg.code} Used
                    </div>
                    <div className="text-base font-extrabold text-amber-800 mt-0.5">
                      {currentStats.used} <span className="text-xs font-medium text-amber-600">days</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-center">
                    <div className="text-[10px] font-bold text-emerald-700 uppercase">
                      {activeTypeCfg.code} Available
                    </div>
                    <div className="text-base font-extrabold text-emerald-800 mt-0.5">
                      {currentStats.available} <span className="text-xs font-medium text-emerald-600">days</span>
                    </div>
                  </div>
                </div>

                {/* Specific Rule Indicators per Leave Type */}
                {formData.leave_type === "annual" && (
                  <p className="text-[11px] text-emerald-700 flex items-center gap-1.5 font-medium">
                    <i className="ri-checkbox-circle-fill text-emerald-600" />
                    Standard Annual Leave deduction. Document upload is optional.
                  </p>
                )}
                {formData.leave_type === "sick" && (
                  <p className="text-[11px] text-rose-700 flex items-center gap-1.5 font-medium">
                    <i className="ri-alert-fill text-rose-500" />
                    Medical certificate / doctor report required for Sick Leave validation.
                  </p>
                )}
                {formData.leave_type === "special" && (
                  <p className="text-[11px] text-amber-700 flex items-center gap-1.5 font-medium">
                    <i className="ri-scales-3-line text-amber-600" />
                    Statutory Special Leave per Cambodia Labour Law Art. 171 (attach supporting proof).
                  </p>
                )}
                {formData.leave_type === "maternity" && (
                  <p className="text-[11px] text-pink-700 flex items-center gap-1.5 font-medium">
                    <i className="ri-heart-pulse-fill text-pink-600" />
                    Maternity Leave period: 90 continuous days per Labour Law Art. 182.
                  </p>
                )}
              </div>
            </div>

            {/* Special Leave Labour Law Category Selector */}
            {formData.leave_type === "special" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1 border-t border-gray-100">
                <label className="md:col-span-3 text-xs font-bold text-gray-700">
                  Labour Law Category <span className="text-rose-500">*</span>
                </label>
                <div className="md:col-span-9 relative">
                  <select
                    value={formData.category_law || ""}
                    onChange={(e) => {
                      const found = SPECIAL_LEAVE_LABOUR_LAW_CATEGORIES.find((c) => c.name.includes(e.target.value) || e.target.value.includes(c.name));
                      if (found) {
                        handleSelectSpecialCategory(found.id);
                      } else {
                        setFormData((prev) => ({ ...prev, category_law: e.target.value }));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-amber-50/50 border border-amber-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  >
                    <option value="">Select Labour Law Statutory Reason...</option>
                    {SPECIAL_LEAVE_LABOUR_LAW_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={`${cat.name} (${cat.lawRef})`}>
                        {cat.name} — {cat.lawRef}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Maternity Leave Labour Law Category Selector */}
            {formData.leave_type === "maternity" && (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-1 border-t border-gray-100">
                <label className="md:col-span-3 text-xs font-bold text-gray-700">
                  Maternity Category <span className="text-rose-500">*</span>
                </label>
                <div className="md:col-span-9 space-y-2">
                  <select
                    value={formData.category_law || ""}
                    onChange={(e) => {
                      const found = MATERNITY_LEAVE_LABOUR_LAW_CATEGORIES.find((c) => c.name.includes(e.target.value) || e.target.value.includes(c.name));
                      if (found) {
                        handleSelectMaternityCategory(found.id);
                      } else {
                        setFormData((prev) => ({ ...prev, category_law: e.target.value }));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-pink-50/50 border border-pink-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  >
                    {MATERNITY_LEAVE_LABOUR_LAW_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={`${cat.name} (${cat.lawRef})`}>
                        {cat.name}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handleApply90DaysMaternity}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-pink-100 hover:bg-pink-200 text-pink-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                  >
                    <i className="ri-calendar-check-line" />
                    Auto-Set 90 Continuous Days from Start Date
                  </button>
                </div>
              </div>
            )}

            {/* From Date & To Date */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <label className="md:col-span-3 text-xs font-bold text-gray-700">
                From Date <span className="text-rose-500">*</span>
              </label>
              <div className="md:col-span-9">
                <input
                  type="date"
                  required
                  value={formData.start_date}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setFormData((prev) => {
                      let nextEnd = prev.end_date;
                      if (prev.leave_type === "maternity" && newStart) {
                        const d = new Date(newStart);
                        d.setDate(d.getDate() + 89);
                        nextEnd = d.toISOString().split("T")[0];
                      }
                      return { ...prev, start_date: newStart, end_date: nextEnd };
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <label className="md:col-span-3 text-xs font-bold text-gray-700">
                To Date <span className="text-rose-500">*</span>
              </label>
              <div className="md:col-span-9 flex items-center gap-3">
                <input
                  type="date"
                  required
                  value={formData.end_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                  className="flex-1 px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
                {requestedDays > 0 && (
                  <span className="px-3 py-2 bg-blue-50 text-[#253C7D] border border-blue-200 rounded-xl text-xs font-extrabold whitespace-nowrap">
                    {requestedDays} {requestedDays === 1 ? "Day" : "Days"}
                  </span>
                )}
              </div>
            </div>

            {/* Reason */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <label className="md:col-span-3 text-xs font-bold text-gray-700 pt-2">
                Reason <span className="text-rose-500">*</span>
              </label>
              <div className="md:col-span-9">
                <textarea
                  required
                  rows={3}
                  value={formData.reason}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="State the reason or purpose for taking leave..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>

            {/* Remark */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <label className="md:col-span-3 text-xs font-bold text-gray-700 pt-2">
                Remark
              </label>
              <div className="md:col-span-9">
                <textarea
                  rows={2}
                  value={formData.remark}
                  onChange={(e) => setFormData((prev) => ({ ...prev, remark: e.target.value }))}
                  placeholder="Additional remarks or handover notes for manager/colleagues..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>

            {/* Deduction Period Button & Breakdown (Positioned after Remark matching UI) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
              <div className="md:col-span-3"></div>
              <div className="md:col-span-9 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowDeductionPeriod((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs active:scale-98"
                >
                  <i className="ri-information-line text-sm" />
                  {showDeductionPeriod ? "Hide deduction period" : "Show deduction period"}
                </button>

                {showDeductionPeriod && (
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 animate-in fade-in-50">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-500">Period Duration:</span>
                      <strong className="text-gray-900">
                        {formData.start_date && formData.end_date
                          ? `${formData.start_date} → ${formData.end_date} (${requestedDays} day${
                              requestedDays === 1 ? "" : "s"
                            })`
                          : "Please select start and end dates"}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-500">Current Available Balance:</span>
                      <strong className="text-emerald-700">{currentStats.available} days</strong>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-gray-500">Days to Deduct:</span>
                      <strong className="text-amber-700">-{requestedDays} days</strong>
                    </div>

                    <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-xs font-bold">
                      <span className="text-gray-700">Remaining Balance After Approval:</span>
                      <span
                        className={`text-sm ${
                          isOverBalance ? "text-rose-600" : "text-[#253C7D]"
                        }`}
                      >
                        {remainingAfterLeave} days
                      </span>
                    </div>

                    {isOverBalance && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-bold flex items-center gap-1.5">
                        <i className="ri-error-warning-fill text-sm" />
                        Warning: Requested days exceed the employee's available balance!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: APPROVERS INFO (Two-Step Approval Hierarchy) */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-[#4A72B2] uppercase tracking-wider flex items-center gap-2">
                <i className="ri-shield-check-line text-base" />
                Approvers Info
              </h2>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                2-Step Approval Chain
              </span>
            </div>

            <div className="space-y-4">
              {/* Step 1: Direct Line Manager Review */}
              <div className="rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                <div className="bg-[#4A72B2] text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between">
                  <span>Step 1 — Employee Direct Manager</span>
                  <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-md">
                    First Endorsement
                  </span>
                </div>
                <div className="p-4 bg-white">
                  {lineManager ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        {lineManager.avatar_url ? (
                          <img
                            src={lineManager.avatar_url}
                            alt={`${lineManager.first_name} ${lineManager.last_name}`}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-[#253C7D] font-bold text-xs flex items-center justify-center border border-blue-200">
                            {lineManager.first_name?.[0]}
                            {lineManager.last_name?.[0]}
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-gray-900">
                            {lineManager.first_name} {lineManager.last_name}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {lineManager.role || "Line Manager"}
                            {lineManager.department ? ` • ${lineManager.department}` : ""}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#253C7D] border border-blue-200 whitespace-nowrap">
                        Direct Supervisor
                      </span>
                    </div>
                  ) : myApproverName ? (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-[#253C7D] font-bold text-xs flex items-center justify-center border border-blue-200">
                          {myApproverName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-900">{myApproverName}</p>
                          <p className="text-[11px] text-gray-500">Direct Line Manager</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#253C7D] border border-blue-200">
                        Assigned Manager
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 font-bold text-xs flex items-center justify-center border border-gray-200">
                          <i className="ri-user-follow-line text-sm" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800">
                            Department Manager / Supervisor
                          </p>
                          <p className="text-[11px] text-gray-400">
                            Employee must request first; line manager will review and endorse before HR
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-600">
                        Department Lead
                      </span>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-400 mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5">
                    <i className="ri-information-line text-[#253C7D]" />
                    Employee requests &rarr; Direct manager reviews and endorses &rarr; Forwards to HR Manager.
                  </p>
                </div>
              </div>

              {/* Step 2: Final HR Manager Approval (Matches screenshot exact layout) */}
              <div className="rounded-xl border border-gray-200 overflow-hidden shadow-2xs">
                <div className="bg-[#4A72B2] text-white px-4 py-2.5 text-xs font-bold flex items-center justify-between">
                  <span>Step 2 — Final HR Manager Approval</span>
                  <span className="text-[10px] font-semibold bg-white/20 px-2 py-0.5 rounded-md">
                    Final Authorization
                  </span>
                </div>

                <div className="p-4 bg-white space-y-3">
                  {finalHrApprovers.map((approver, idx) => (
                    <React.Fragment key={approver.id}>
                      {idx > 0 && (
                        <div className="py-1">
                          <span className="text-[10px] font-extrabold text-gray-400 tracking-wider">
                            OR
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {approver.avatar_url ? (
                            <img
                              src={approver.avatar_url}
                              alt={approver.name}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-100 text-[#253C7D] font-bold text-xs flex items-center justify-center border border-slate-200 shadow-2xs">
                              {approver.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-bold text-gray-900">{approver.name}</p>
                            <p className="text-[11px] text-gray-400 font-medium">{approver.role}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                          HR Sign-Off
                        </span>
                      </div>
                    </React.Fragment>
                  ))}
                  <p className="text-[11px] text-gray-400 mt-2.5 pt-2 border-t border-gray-100 flex items-center gap-1.5">
                    <i className="ri-shield-check-line text-emerald-600" />
                    After manager endorsement, HR Manager grants the final official sign-off.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 3: ATTACHMENT INFO */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-extrabold text-[#253C7D] uppercase tracking-wider flex items-center gap-2">
                <i className="ri-attachment-line text-base" />
                Attachment Info
              </h2>
              {activeTypeCfg.requiresUpload && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200">
                  Required for {activeTypeCfg.code}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <label className="md:col-span-3 text-xs font-bold text-gray-700">
                Attachment
              </label>

              <div className="md:col-span-9">
                {formData.attachment_file || formData.attachment_url ? (
                  <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center shrink-0">
                        <i className="ri-file-text-line text-base" />
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {formData.attachment_file?.name || "Uploaded Document"}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {formData.attachment_file
                            ? `${(formData.attachment_file.size / 1024).toFixed(1)} KB`
                            : "Stored securely"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveAttachment}
                      className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <i className="ri-delete-bin-line mr-1" />
                      Remove
                    </button>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragOver(true);
                    }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragOver
                        ? "border-[#253C7D] bg-blue-50/50"
                        : activeTypeCfg.requiresUpload
                        ? "border-rose-300 bg-rose-50/20 hover:border-rose-400"
                        : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      accept="image/*,.pdf,.doc,.docx"
                    />
                    <i
                      className={`ri-upload-cloud-2-line text-2xl ${
                        activeTypeCfg.requiresUpload ? "text-rose-500" : "text-gray-400"
                      }`}
                    />
                    <p className="text-xs font-bold text-gray-700 mt-1">
                      <span className="text-[#253C7D] hover:underline">Browse</span> or Drop file here
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      Supports PDF, PNG, JPG, DOCX (up to 10MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION 4: ACTIONS BAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2.5">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-sm" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-save-3-line text-sm" />
                    <span>
                      {isSuperAdmin
                        ? "Save & Approve Direct"
                        : formMode === "for_employee"
                        ? "Submit Leave for Staff"
                        : "Submit Leave Request"}
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleExportSlip}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                <i className="ri-printer-line text-sm text-[#253C7D]" />
                <span>Export Leave Form</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onBack}
              disabled={submitting}
              className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <i className="ri-close-line mr-1" />
              Discard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

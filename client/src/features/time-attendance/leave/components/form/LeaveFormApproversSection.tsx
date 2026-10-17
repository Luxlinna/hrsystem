import React, { useState, useEffect, useMemo, useCallback } from "react";
import type { Employee } from "../../types";
import {
  type LeaveApprovalFlowStep,
  type LeaveApprovalFlowGroup,
  DEFAULT_UNI_TABLE_STEPS,
  getStoredTableSteps,
  getLeaveApprovalGroups,
  fetchLeaveApprovalGroupsFromDb,
  convertApproverConfigsToTableSteps,
  fetchLeaveApprovalFlowFromDb,
} from "../../services/leaveApprovalGroupService";
import { getStoredApproverFlow } from "../../services/leaveApprovalFlowService";
import { getLeaveEmployeeName } from "../../utils/leaveDisplayUtils";

interface LeaveFormApproversSectionProps {
  lineManager?: Employee | null;
  myApproverName?: string;
  hrApprovers?: Employee[];
  selectedEmployee?: Employee | null;
  isDirectHrApproval?: boolean;
  employees?: Employee[];
}

export function LeaveFormApproversSection({
  lineManager,
  myApproverName = "",
  hrApprovers = [],
  selectedEmployee,
  isDirectHrApproval = false,
  employees = [],
}: LeaveFormApproversSectionProps) {
  const [groups, setGroups] = useState<LeaveApprovalFlowGroup[]>(() => getLeaveApprovalGroups());
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  // Keep groups synchronized with database & local events
  useEffect(() => {
    let active = true;
    fetchLeaveApprovalGroupsFromDb().then((dbGroups) => {
      if (active && dbGroups && dbGroups.length > 0) {
        setGroups(dbGroups);
      }
    });

    const handleUpdate = () => {
      setGroups(getLeaveApprovalGroups());
    };
    window.addEventListener("leave_approval_groups_updated", handleUpdate);
    return () => {
      active = false;
      window.removeEventListener("leave_approval_groups_updated", handleUpdate);
    };
  }, []);

  // Employee's BU and Organization attributes
  const buName = useMemo(() => {
    return (
      selectedEmployee?.bu_full_name ||
      selectedEmployee?.branches?.name ||
      selectedEmployee?.branches?.company_name ||
      selectedEmployee?.code_bu ||
      selectedEmployee?.site ||
      ""
    );
  }, [selectedEmployee]);

  const branchId = selectedEmployee?.branch_id;
  const site = selectedEmployee?.site || selectedEmployee?.branches?.location || selectedEmployee?.branches?.name || "";
  const department = selectedEmployee?.department || "";
  const position = selectedEmployee?.position || selectedEmployee?.role || "";
  const empType = selectedEmployee?.employment_type || "";

  // 1. Resolve matched custom Approval Flow Group (if configured for this BU / site)
  const matchedGroup = useMemo<LeaveApprovalFlowGroup | null>(() => {
    if (!groups || groups.length === 0) return null;
    const validGroups = groups.filter((g) => g.steps && g.steps.length > 0);
    if (validGroups.length === 0) return null;

    // A. Priority 1: Check explicit businessUnit configuration
    if (buName || branchId) {
      const buMatched = validGroups.find((g) => {
        if (!g.businessUnit || g.businessUnit.length === 0) return false;
        if (g.businessUnit.includes("All")) return true;
        return g.businessUnit.some((b) => {
          if (!b) return false;
          const bLower = b.trim().toLowerCase();
          return (
            (buName && buName.toLowerCase().includes(bLower)) ||
            (buName && bLower.includes(buName.toLowerCase())) ||
            (branchId && b === branchId)
          );
        });
      });
      if (buMatched) return buMatched;

      // B. Priority 2: Check flowName matching BU name (e.g. "OPS Solution" matches "OPS SOLUTIONS CO., LTD")
      const nameMatched = validGroups.find((g) => {
        const fn = (g.flowName || "").trim().toLowerCase();
        const bn = (buName || "").trim().toLowerCase();
        return fn && bn && (bn.includes(fn) || fn.includes(bn)) && fn !== "first flow";
      });
      if (nameMatched) return nameMatched;
    }

    // C. Priority 3: Match by site, department, position, employeeType
    const scopeMatched = validGroups.find((g) => {
      const siteMatches =
        !g.site ||
        g.site.length === 0 ||
        g.site.includes("All") ||
        g.site.some((s) => {
          const sLower = s.toLowerCase();
          return (
            (site && site.toLowerCase().includes(sLower)) ||
            (buName && buName.toLowerCase().includes(sLower)) ||
            (branchId && s === branchId)
          );
        });
      const deptMatches =
        !g.department ||
        g.department.length === 0 ||
        g.department.includes("All") ||
        (department && g.department.some((d) => d.toLowerCase() === department.toLowerCase()));
      const posMatches =
        !g.position ||
        g.position.length === 0 ||
        g.position.includes("All") ||
        (position && g.position.some((p) => p.toLowerCase() === position.toLowerCase()));
      const typeMatches =
        !g.employeeType ||
        g.employeeType.length === 0 ||
        g.employeeType.includes("All") ||
        (empType && g.employeeType.some((t) => t.toLowerCase() === empType.toLowerCase()));
      return siteMatches && deptMatches && posMatches && typeMatches;
    });

    return scopeMatched || null;
  }, [groups, buName, branchId, site, department, position, empType]);

  // 2. Resolve Dynamic Approver Steps
  const { steps, matchedGroupName } = useMemo<{
    steps: LeaveApprovalFlowStep[];
    matchedGroupName: string;
  }>(() => {
    // Case 1: Direct HR approval for admin roles
    if (isDirectHrApproval) {
      return {
        matchedGroupName: "Direct HR Approval",
        steps: [
          {
            id: "step-direct-hr",
            conditionPrefix: "",
            approvalCondition: "AND",
            flowTitle: "Notified to",
            flowType: "HR Department",
            description: "HR Department",
            condition: ">=0",
            step: 1,
            displayInPrint: true,
          },
        ],
      };
    }

    // Case 2: Configured custom approval flow group matched
    if (matchedGroup?.steps && matchedGroup.steps.length > 0) {
      return {
        matchedGroupName: matchedGroup.flowName,
        steps: matchedGroup.steps,
      };
    }

    // Case 3: Check BU-specific stored table steps in localStorage / DB
    const buStoredSteps = getStoredTableSteps(branchId || undefined, buName || undefined);
    if (buStoredSteps && buStoredSteps.length > 0) {
      return {
        matchedGroupName: buName ? `${buName} Custom Flow` : "Standard Flow",
        steps: buStoredSteps,
      };
    }

    // Case 4: Legacy ApproverStepConfig for this BU
    const legacyFlow = getStoredApproverFlow(branchId, buName);
    if (legacyFlow && legacyFlow.length > 0) {
      const converted = convertApproverConfigsToTableSteps(legacyFlow);
      if (converted.length > 0) {
        return {
          matchedGroupName: buName ? `${buName} Legacy Flow` : "Standard Flow",
          steps: converted,
        };
      }
    }

    // Case 5: Standard 3-Step Sequence with approvers dynamically specific to the employee's BU
    // Filter employees belonging to the same BU
    const buEmployees = employees.filter((e) => {
      if (!e) return false;
      if (branchId && e.branch_id === branchId) return true;
      const eBu = (
        e.bu_full_name ||
        e.branches?.name ||
        e.branches?.company_name ||
        e.code_bu ||
        e.site ||
        ""
      ).trim();
      if (buName && eBu) {
        const eBuLower = eBu.toLowerCase();
        const buLower = buName.toLowerCase();
        if (eBuLower.includes(buLower) || buLower.includes(eBuLower)) return true;
      }
      return false;
    });

    // Step 1: Head of Department / Manager
    let headOfDeptName = "";
    let headOfDeptRole = "Head of Department";

    if (lineManager) {
      headOfDeptName = getLeaveEmployeeName(lineManager);
      headOfDeptRole = lineManager.position || lineManager.role || "Head of Department";
    } else if (selectedEmployee?.reports_to) {
      const rep = employees.find((e) => e.id === selectedEmployee.reports_to);
      if (rep) {
        headOfDeptName = getLeaveEmployeeName(rep);
        headOfDeptRole = rep.position || rep.role || "Head of Department";
      }
    }

    if (!headOfDeptName && myApproverName) {
      headOfDeptName = myApproverName;
    }

    if (!headOfDeptName) {
      // Find manager or supervisor in the employee's BU
      const buMgr = buEmployees.find((e) => {
        if (e.id === selectedEmployee?.id) return false;
        const p = `${e.position || ""} ${e.role || ""}`.toLowerCase();
        return (
          p.includes("manager") ||
          p.includes("head") ||
          p.includes("supervisor") ||
          p.includes("leader")
        );
      });
      if (buMgr) {
        headOfDeptName = getLeaveEmployeeName(buMgr);
        headOfDeptRole = buMgr.position || buMgr.role || "Head of Department";
      } else {
        headOfDeptName = "Mrs. Chea Tiengchanvathna";
      }
    }

    // Step 2: Head of Division Director / CEO
    let divisionDirectorName = "";
    let divisionDirectorRole = "Head of Division Director";

    const buDirector = buEmployees.find((e) => {
      if (e.id === selectedEmployee?.id) return false;
      const p = `${e.position || ""} ${e.role || ""}`.toLowerCase();
      return (
        p.includes("ceo") ||
        p.includes("director") ||
        p.includes("general manager") ||
        p.includes("president") ||
        p.includes("chair")
      );
    });

    if (buDirector) {
      divisionDirectorName = getLeaveEmployeeName(buDirector);
      divisionDirectorRole = buDirector.position || buDirector.role || "Head of Division Director";
    } else {
      const generalDirector = employees.find((e) => {
        const p = `${e.position || ""} ${e.role || ""}`.toLowerCase();
        return (p.includes("director") || p.includes("ceo")) && !p.includes("assistant");
      });
      if (generalDirector) {
        divisionDirectorName = getLeaveEmployeeName(generalDirector);
        divisionDirectorRole = generalDirector.position || generalDirector.role || "Head of Division Director";
      } else {
        divisionDirectorName = "Mr. Chey Tola";
      }
    }

    // Step 3: HR Department
    let hrDeptName = "";
    const buHr = buEmployees.find((e) => {
      if (e.id === selectedEmployee?.id) return false;
      const p = `${e.department || ""} ${e.position || ""} ${e.role || ""}`.toLowerCase();
      return (p.includes("hr") || p.includes("human resource") || p.includes("admin")) && !p.includes("cleaner");
    });

    if (buHr) {
      hrDeptName = getLeaveEmployeeName(buHr);
    } else {
      const generalHr = hrApprovers.find((h) => h.id !== selectedEmployee?.id);
      if (generalHr) {
        hrDeptName = getLeaveEmployeeName(generalHr);
      } else {
        const poolHr = employees.find((e) => {
          if (e.id === selectedEmployee?.id) return false;
          const p = `${e.department || ""} ${e.position || ""} ${e.role || ""}`.toLowerCase();
          return p.includes("hr") && !p.includes("cleaner");
        });
        hrDeptName = poolHr ? getLeaveEmployeeName(poolHr) : "Mr. Thorng Dararithy";
      }
    }

    const standardSteps: LeaveApprovalFlowStep[] = [
      {
        id: "step-dynamic-1",
        conditionPrefix: "",
        approvalCondition: "AND",
        flowTitle: "Notified to",
        flowType: headOfDeptRole,
        description: headOfDeptName,
        condition: ">=0",
        step: 1,
        displayInPrint: true,
      },
      {
        id: "step-dynamic-2",
        conditionPrefix: "AND",
        approvalCondition: "AND",
        flowTitle: "Notified to",
        flowType: divisionDirectorRole,
        description: divisionDirectorName,
        condition: ">=0",
        step: 2,
        displayInPrint: true,
      },
      {
        id: "step-dynamic-3",
        conditionPrefix: "CC",
        approvalCondition: "AND",
        flowTitle: "Notified to",
        flowType: "HR Department",
        description: hrDeptName,
        condition: ">=0",
        step: 3,
        displayInPrint: true,
      },
    ];

    const groupLabel = buName ? `Standard Flow (${buName})` : "Standard Flow (UNI Holding)";

    return {
      matchedGroupName: groupLabel,
      steps: standardSteps,
    };
  }, [
    isDirectHrApproval,
    matchedGroup,
    branchId,
    buName,
    lineManager,
    selectedEmployee,
    myApproverName,
    employees,
    hrApprovers,
  ]);

  const getInitials = (name: string) => {
    const parts = name.split(" ").filter(Boolean);
    if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    return (name[0] || "A").toUpperCase();
  };

  return (
    <div className="my-2 space-y-1.5 w-full">
      {/* Header with Title, BU indicator, Matched Group Badge, and View Mode Toggle */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-[11px] sm:text-xs font-bold text-slate-800 dark:text-slate-200">
            Approvers Info
          </h3>

          {buName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[10.5px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-[#253C7D] dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 shadow-2xs">
              <i className="ri-building-line text-xs" />
              <span>BU: <strong className="font-bold">{buName}</strong></span>
            </span>
          )}

          {matchedGroupName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[10.5px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-900/60 shadow-2xs">
              <i className="ri-flow-chart text-xs" />
              <span>Group: <strong className="font-bold">{matchedGroupName}</strong></span>
            </span>
          )}
        </div>

        {/* View Mode Toggle: Table (default matching Image 2) vs Cards */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-2 py-0.5 rounded text-[10px] sm:text-[10.5px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-900 text-[#253C7D] dark:text-blue-300 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
            title="Display as Table (Image 2)"
          >
            <i className="ri-table-line text-xs" />
            <span>Table</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            className={`px-2 py-0.5 rounded text-[10px] sm:text-[10.5px] font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
              viewMode === "cards"
                ? "bg-white dark:bg-slate-900 text-[#253C7D] dark:text-blue-300 shadow-2xs font-bold"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
            title="Display as Flow Cards"
          >
            <i className="ri-layout-grid-line text-xs" />
            <span>Cards</span>
          </button>
        </div>
      </div>

      {/* TABLE VIEW — Exact Match to Image 2 (5 Columns) */}
      {viewMode === "table" ? (
        <div className="w-full overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">No.</th>
                <th className="py-2.5 px-3 w-36">Approval condition</th>
                <th className="py-2.5 px-3 w-32">Flow title</th>
                <th className="py-2.5 px-3 w-48">Flow Type</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {steps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400 text-xs italic">
                    No approval steps configured for {buName || "this Business Unit"}.
                  </td>
                </tr>
              ) : (
                steps.map((st, idx) => {
                  const condition = idx === 0 ? "" : (st.conditionPrefix || st.approvalCondition || "AND");
                  const isCC = condition.toUpperCase() === "CC";
                  return (
                    <tr
                      key={st.id || idx}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        {condition && (
                          <span
                            className={`font-bold text-xs ${
                              isCC
                                ? "text-sky-600 dark:text-sky-400"
                                : condition === "OR"
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-900 dark:text-white"
                            }`}
                          >
                            {condition}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                        {st.flowTitle || "Notified to"}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-200 font-medium">
                        {st.flowType || "Head of Department"}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {st.description}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* CARDS VIEW — Flow Cards for all steps */
        <div className="space-y-1.5">
          {steps.map((st, idx) => {
            const condition = idx === 0 ? "" : (st.conditionPrefix || st.approvalCondition || "AND");
            const isCC = condition.toUpperCase() === "CC";
            const initials = getInitials(st.description);

            return (
              <React.Fragment key={st.id || idx}>
                {/* Divider between cards */}
                {idx > 0 && (
                  <div className="relative flex items-center justify-center py-0.5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                    </div>
                    <div
                      className={`relative px-2.5 py-0.5 rounded-full bg-white dark:bg-slate-900 border text-[9.5px] font-bold uppercase tracking-widest shadow-2xs ${
                        isCC
                          ? "border-sky-200 dark:border-sky-800 text-sky-600 dark:text-sky-300"
                          : condition === "OR"
                          ? "border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                      }`}
                    >
                      {condition}
                    </div>
                  </div>
                )}

                {/* Approver Card */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 sm:p-2.5 flex items-center justify-between gap-2 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Picture / Avatar */}
                    <div className="w-8 h-8 rounded-lg border border-slate-200/80 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                      <div className="flex flex-col items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs">
                        {initials}
                      </div>
                    </div>

                    {/* Name & Role */}
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {st.description}
                      </div>
                      <div className="text-[10.5px] text-slate-500 dark:text-slate-400 truncate">
                        {st.flowType || "Approver"}
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {isCC ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 flex items-center gap-1 shadow-2xs">
                        <i className="ri-notification-3-line text-[11px] text-sky-600 dark:text-sky-400" />
                        <span>CC / Notified</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 flex items-center gap-1 shadow-2xs">
                        <i className="ri-time-line text-[11px] text-amber-600" />
                        <span>Pending Approval</span>
                      </span>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}

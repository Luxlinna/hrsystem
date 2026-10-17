import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useBranchScope } from "@/context/BranchContext";
import type { Employee } from "@/features/time-attendance/leave/types";
import {
  type LeaveApprovalFlowGroup,
  type LeaveApprovalFlowStep,
  getLeaveApprovalGroups,
  saveLeaveApprovalGroup,
  deleteLeaveApprovalGroup,
  fetchLeaveApprovalGroupsFromDb,
  saveLeaveApprovalGroupToDb,
  deleteLeaveApprovalGroupFromDb,
} from "../../../services/leaveApprovalGroupService";
import { LeaveApprovalFlowStepModal } from "./LeaveApprovalFlowStepModal";
import { LeaveApprovalFlowGroupEditor } from "./LeaveApprovalFlowGroupEditor";

interface UnitOption {
  id: string;
  name: string;
  company_name?: string | null;
  is_site?: boolean;
  branch_id?: string;
}

const FALLBACK_DEFAULT_UNITS: UnitOption[] = [
  { id: "cf4826f4-c8ee-4e58-a27d-1b4481eb91f7", name: "UNI Holding", company_name: "UNI Holding", is_site: false },
  { id: "e2c082b8-7b47-4210-81ab-c3ac183c4a44", name: "UNIQUE NOBLE INVESTMENT CO., LTD", company_name: "UNIQUE NOBLE INVESTMENT CO., LTD", is_site: false },
  { id: "39db8ecc-67f0-45d5-933a-6c8f17d8f030", name: "OPS SOLUTIONS CO., LTD", company_name: "OPS SOLUTIONS CO., LTD", is_site: false },
  { id: "086ffacf-abe1-47aa-87d9-a5cc80a85853", name: "PINEX AGRO CO., LTD", company_name: "PINEX AGRO CO., LTD", is_site: false },
  { id: "bf59e1cb-febb-4f35-8d5d-87124729f09f", name: "KampongThom", company_name: "KampongThom Site", is_site: true },
];

interface LeaveApprovalFlowTabContentProps {
  canModify?: boolean;
  employees?: any[];
}

export const LeaveApprovalFlowTabContent: React.FC<LeaveApprovalFlowTabContentProps> = ({
  canModify = true,
  employees: propEmployees = [],
}) => {
  const { branches: scopeBranches } = useBranchScope();

  // Navigation state for Create / Edit Leave Approval Flow Group
  const [activeEditorGroup, setActiveEditorGroup] = useState<LeaveApprovalFlowGroup | null | "new">(null);
  const [groups, setGroups] = useState<LeaveApprovalFlowGroup[]>([]);
  const [searchGroupQuery, setSearchGroupQuery] = useState("");

  const loadGroups = useCallback(() => {
    setGroups(getLeaveApprovalGroups());
    fetchLeaveApprovalGroupsFromDb().then((dbGroups) => {
      if (dbGroups && dbGroups.length > 0) {
        setGroups(dbGroups);
      }
    });
  }, []);

  useEffect(() => {
    loadGroups();
    const handleUpdate = () => {
      setGroups(getLeaveApprovalGroups());
    };
    window.addEventListener("leave_approval_groups_updated", handleUpdate);
    return () => window.removeEventListener("leave_approval_groups_updated", handleUpdate);
  }, [loadGroups]);

  // 1. Available business units / branches & sites
  const [fetchedBranches, setFetchedBranches] = useState<UnitOption[]>([]);
  const [fetchedSites, setFetchedSites] = useState<UnitOption[]>([]);

  // Consolidate all available units (from scope, DB fetch, or fallback)
  const availableUnits = useMemo<UnitOption[]>(() => {
    const list: UnitOption[] = [];
    const seen = new Set<string>();

    // 1. From scopeBranches
    if (scopeBranches && scopeBranches.length > 0) {
      for (const b of scopeBranches) {
        if (!seen.has(b.id)) {
          seen.add(b.id);
          list.push({
            id: b.id,
            name: b.name,
            company_name: b.name,
            is_site: Boolean(b.is_site),
            branch_id: b.branch_id,
          });
        }
      }
    }

    // 2. From direct fetchedBranches
    for (const fb of fetchedBranches) {
      if (!seen.has(fb.id)) {
        seen.add(fb.id);
        list.push(fb);
      }
    }

    // 3. From direct fetchedSites
    for (const fs of fetchedSites) {
      if (!seen.has(fs.id)) {
        seen.add(fs.id);
        list.push(fs);
      }
    }

    // 4. If still empty, use fallback defaults
    if (list.length === 0) {
      return FALLBACK_DEFAULT_UNITS;
    }

    return list;
  }, [scopeBranches, fetchedBranches, fetchedSites]);

  const UNIT_STORAGE_KEY = "hrsystem_leave_approval_selected_unit";

  // Initial selection: prefer URL param (?unit=...), localStorage, UNI Holding or first unit
  const defaultUnitId = useMemo(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const urlUnit = params.get("unit") || params.get("unit_id") || params.get("branch_id");
      if (urlUnit) {
        const found = availableUnits.find((u) => u.id === urlUnit || u.id === `site:${urlUnit}`);
        if (found) return found.id;
      }
      const stored = localStorage.getItem(UNIT_STORAGE_KEY);
      if (stored) {
        const found = availableUnits.find((u) => u.id === stored);
        if (found) return found.id;
      }
    } catch {
      // ignore
    }

    const uni = availableUnits.find(
      (u) =>
        /uni/i.test(u.name) ||
        (u.company_name && /uni/i.test(u.company_name)) ||
        /noble/i.test(u.name)
    );
    return uni ? uni.id : availableUnits[0]?.id || FALLBACK_DEFAULT_UNITS[0].id;
  }, [availableUnits]);

  const [selectedUnitId, setSelectedUnitIdState] = useState<string>(defaultUnitId);

  const handleSelectUnit = (unitId: string) => {
    setSelectedUnitIdState(unitId);
    try {
      localStorage.setItem(UNIT_STORAGE_KEY, unitId);
      const url = new URL(window.location.href);
      url.searchParams.set("unit", unitId);
      window.history.replaceState({}, "", url.toString());
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!selectedUnitId && defaultUnitId) {
      setSelectedUnitIdState(defaultUnitId);
    }
  }, [selectedUnitId, defaultUnitId]);

  const currentUnit = useMemo(() => {
    return (
      availableUnits.find((u) => u.id === selectedUnitId) ||
      availableUnits[0] ||
      FALLBACK_DEFAULT_UNITS[0]
    );
  }, [availableUnits, selectedUnitId]);

  const [savedToast, setSavedToast] = useState<string | null>(null);

  // 3. Employees list
  const [dbEmployees, setDbEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    // Fetch branches
    supabase
      .from("branches")
      .select("id, name, company_name")
      .is("deleted_at", null)
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setFetchedBranches(
            data.map((b) => ({
              id: b.id,
              name: b.name,
              company_name: b.company_name || b.name,
              is_site: false,
            }))
          );
        }
      });

    // Fetch work_locations / sites
    supabase
      .from("work_locations")
      .select("id, name, branch_id")
      .is("deleted_at", null)
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setFetchedSites(
            data.map((s) => ({
              id: `site:${s.id}`,
              name: s.name,
              company_name: s.name,
              is_site: true,
              branch_id: s.branch_id,
            }))
          );
        }
      });

    // Fetch full employees with position
    supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, avatar_url, email, branch_id, position, site, bu_full_name")
      .is("deleted_at", null)
      .order("first_name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setDbEmployees(data as Employee[]);
        }
      });
  }, []);

  const allEmployees = useMemo<Employee[]>(() => {
    if (dbEmployees.length > 0) return dbEmployees;
    if (propEmployees.length > 0) return propEmployees as Employee[];
    return [];
  }, [dbEmployees, propEmployees]);

  // Step modal operations for adding / editing steps directly in any card
  const [activeStepCardGroup, setActiveStepCardGroup] = useState<LeaveApprovalFlowGroup | null>(null);
  const [editingCardStepIndex, setEditingCardStepIndex] = useState<number | null>(null);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);

  const handleOpenAddStepToGroup = (group: LeaveApprovalFlowGroup) => {
    setActiveStepCardGroup(group);
    setEditingCardStepIndex(null);
    setIsStepModalOpen(true);
  };

  const handleOpenEditStepInGroup = (group: LeaveApprovalFlowGroup, idx: number) => {
    setActiveStepCardGroup(group);
    setEditingCardStepIndex(idx);
    setIsStepModalOpen(true);
  };

  const handleDeleteStepFromGroup = async (group: LeaveApprovalFlowGroup, idx: number) => {
    const currentSteps = group.steps || [];
    const next: LeaveApprovalFlowStep[] = currentSteps
      .filter((_, i) => i !== idx)
      .map((st, i) => ({
        ...st,
        conditionPrefix:
          i === 0
            ? ""
            : st.conditionPrefix === "AND" || st.approvalCondition === "AND"
            ? "AND"
            : "OR",
      }));

    const updatedGroup: LeaveApprovalFlowGroup = {
      ...group,
      steps: next,
    };

    saveLeaveApprovalGroup(updatedGroup);
    await saveLeaveApprovalGroupToDb(updatedGroup);
    loadGroups();
    setSavedToast(`Updated steps for "${group.flowName}".`);
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handleSaveStepModal = async (step: LeaveApprovalFlowStep) => {
    if (!activeStepCardGroup) return;
    const currentSteps = activeStepCardGroup.steps || [];
    let next: LeaveApprovalFlowStep[];
    if (editingCardStepIndex !== null && editingCardStepIndex >= 0 && editingCardStepIndex < currentSteps.length) {
      next = currentSteps.map((s, idx) => (idx === editingCardStepIndex ? step : s));
    } else {
      next = [...currentSteps, step];
    }
    next = next.map((st, i) => ({
      ...st,
      conditionPrefix:
        i === 0
          ? ""
          : st.conditionPrefix === "AND" || st.approvalCondition === "AND"
          ? "AND"
          : "OR",
    }));

    const updatedGroup: LeaveApprovalFlowGroup = {
      ...activeStepCardGroup,
      steps: next,
    };

    saveLeaveApprovalGroup(updatedGroup);
    await saveLeaveApprovalGroupToDb(updatedGroup);
    loadGroups();
    setIsStepModalOpen(false);
    setActiveStepCardGroup(null);
    setEditingCardStepIndex(null);
    setSavedToast(`Updated steps for "${updatedGroup.flowName}".`);
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handleSaveGroupFromEditor = async (saved: LeaveApprovalFlowGroup) => {
    saveLeaveApprovalGroup(saved);
    await saveLeaveApprovalGroupToDb(saved);
    setActiveEditorGroup(null);
    loadGroups();
    setSavedToast(`Saved approval flow group "${saved.flowName}".`);
    setTimeout(() => setSavedToast(null), 3000);
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (window.confirm(`Delete approval flow group "${name}"?`)) {
      deleteLeaveApprovalGroup(id);
      await deleteLeaveApprovalGroupFromDb(id);
      loadGroups();
      setSavedToast(`Deleted approval flow "${name}".`);
      setTimeout(() => setSavedToast(null), 3000);
    }
  };

  // Filter groups
  const filteredGroups = useMemo(() => {
    if (!searchGroupQuery.trim()) return groups;
    const q = searchGroupQuery.toLowerCase().trim();
    return groups.filter((g) => {
      const matchName = g.flowName?.toLowerCase().includes(q);
      const matchBU = g.businessUnit?.some((b) => b.toLowerCase().includes(q));
      const matchSite = g.site?.some((s) => s.toLowerCase().includes(q));
      const matchDept = g.department?.some((d) => d.toLowerCase().includes(q));
      const matchPos = (g.position || g.designation)?.some((p) => p.toLowerCase().includes(q));
      const matchEmpType = g.employeeType?.some((t) => t.toLowerCase().includes(q));
      const matchSteps = g.steps?.some(
        (st) =>
          st.description.toLowerCase().includes(q) ||
          st.flowTitle.toLowerCase().includes(q) ||
          st.flowType.toLowerCase().includes(q)
      );
      return matchName || matchBU || matchSite || matchDept || matchPos || matchEmpType || matchSteps;
    });
  }, [groups, searchGroupQuery]);

  // If in editor view, show Create / Edit Leave Approval Flow Group
  if (activeEditorGroup) {
    return (
      <LeaveApprovalFlowGroupEditor
        initialGroup={activeEditorGroup === "new" ? null : activeEditorGroup}
        onSave={handleSaveGroupFromEditor}
        onBack={() => setActiveEditorGroup(null)}
        employees={allEmployees}
      />
    );
  }

  return (
    <div className="space-y-4 font-sans pb-10">
      {/* Toast Notification */}
      {savedToast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-150">
          <i className="ri-checkbox-circle-fill text-emerald-600 text-sm" />
          <span>{savedToast}</span>
        </div>
      )}

      {/* Top Header Bar: APPROVAL FLOW INFO + Add button (Matching Image 1) */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xs sm:text-sm font-bold text-[#0088cc] uppercase tracking-wider">
          APPROVAL FLOW INFO
        </h2>

        {canModify && (
          <button
            type="button"
            onClick={() => setActiveEditorGroup("new")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-[#0088cc] text-[#0088cc] hover:bg-sky-50 dark:hover:bg-sky-950/30 text-xs font-medium transition-colors cursor-pointer shadow-2xs bg-white dark:bg-slate-900"
          >
            <i className="ri-add-circle-line text-sm" />
            <span>Add Leave Approval Flow</span>
          </button>
        )}
      </div>

      {/* Search Bar (Matching Image 1: input with blue magnifying glass button) */}
      <div className="flex items-center gap-0 max-w-xs sm:max-w-sm">
        <input
          type="text"
          placeholder="Search BUs, sites, designations..."
          value={searchGroupQuery}
          onChange={(e) => setSearchGroupQuery(e.target.value)}
          className="flex-1 px-3 py-1.5 text-xs border border-slate-300 dark:border-slate-700 rounded-l bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#0088cc]"
        />
        <button
          type="button"
          className="px-3.5 py-1.5 bg-[#0088cc] text-white rounded-r hover:bg-[#0077b3] transition-colors flex items-center justify-center cursor-pointer"
        >
          <i className="ri-search-line text-xs" />
        </button>
      </div>

      {/* Cards List: Each Leave Approval Flow is a Card matching Image 1 */}
      {filteredGroups.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-8 text-center space-y-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {searchGroupQuery.trim()
              ? "No leave approval flows match your search."
              : "No leave approval flows configured yet."}
          </p>
          {canModify && (
            <button
              type="button"
              onClick={() => setActiveEditorGroup("new")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs font-medium transition-colors cursor-pointer shadow-2xs"
            >
              <i className="ri-add-line text-sm" />
              <span>Create Approval Flow</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          {filteredGroups.map((group) => {
            const stepsList = group.steps || [];
            return (
              <div
                key={group.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-xs overflow-hidden"
              >
                {/* Card Header (≡ Flow Name on left, BU & Site badges, Edit / Delete on right) */}
                <div className="px-4 py-2.5 bg-white dark:bg-slate-900 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <i className="ri-menu-line text-slate-400 text-sm cursor-grab" />
                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                      {group.flowName}
                    </span>

                    {/* Business Units Badge */}
                    {group.businessUnit && group.businessUnit.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[10.5px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-[#0088cc] dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60 shadow-2xs">
                        <i className="ri-building-line text-xs" />
                        <span>BU: {group.businessUnit.join(", ")}</span>
                      </span>
                    )}

                    {/* Sites Badge */}
                    {group.site && group.site.length > 0 && !group.site.includes("All") && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[10.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        <i className="ri-map-pin-line text-xs" />
                        <span>Site: {group.site.join(", ")}</span>
                      </span>
                    )}

                    {/* Department Badge */}
                    {group.department && group.department.length > 0 && !group.department.includes("All") && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] sm:text-[10.5px] font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <i className="ri-community-line text-xs" />
                        <span>Dept: {group.department.join(", ")}</span>
                      </span>
                    )}
                  </div>

                  {canModify && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveEditorGroup(group)}
                        className="text-slate-400 hover:text-[#0088cc] transition-colors p-1 cursor-pointer"
                        title="Edit Flow Group"
                      >
                        <i className="ri-edit-box-line text-sm" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGroup(group.id, group.flowName)}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 cursor-pointer"
                        title="Delete Flow Group"
                      >
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Card Table (Exact Columns & Style from Image 1) */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="text-slate-800 dark:text-slate-200 font-bold border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">No.</th>
                        <th className="py-2.5 px-3 w-36">Approval condition</th>
                        <th className="py-2.5 px-3 w-32">Flow title</th>
                        <th className="py-2.5 px-3 w-28">Flow Type</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3 w-24">Condition</th>
                        <th className="py-2.5 px-3 w-16 text-center">Step</th>
                        <th className="py-2.5 px-3 w-28">Expired hours</th>
                        <th className="py-2.5 px-3 w-28 text-center">Display in print</th>
                        {canModify && (
                          <th className="py-2.5 px-3 w-16 text-right">
                            <button
                              type="button"
                              onClick={() => handleOpenAddStepToGroup(group)}
                              className="text-[#0088cc] hover:text-sky-600 transition-colors p-0.5 cursor-pointer"
                              title="Add Step"
                            >
                              <i className="ri-add-circle-line text-base font-bold" />
                            </button>
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {stepsList.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-6 text-center text-slate-400 text-xs italic">
                            No approval steps configured. Click the + button above to add steps.
                          </td>
                        </tr>
                      ) : (
                        stepsList.map((step, idx) => (
                          <tr
                            key={step.id || idx}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition-colors"
                          >
                            <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                              {idx + 1}
                            </td>
                            <td className="py-2.5 px-3 text-slate-800 dark:text-slate-100 font-bold text-xs">
                              {idx === 0 ? "" : (step.conditionPrefix || step.approvalCondition || "OR")}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                              {step.flowTitle || "Notified to"}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                              {step.flowType || "Employee"}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="inline-block px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-normal border border-slate-200/60 dark:border-slate-700">
                                {step.description}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 font-medium">
                              {step.condition || ">=0"}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300 font-medium">
                              {step.step || 1}
                            </td>
                            <td className="py-2.5 px-3 text-slate-400">
                              {step.expiredHours || ""}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {step.displayInPrint ? (
                                <i className="ri-check-line text-slate-400 font-bold text-sm" />
                              ) : null}
                            </td>
                            {canModify && (
                              <td className="py-2.5 px-3 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditStepInGroup(group, idx)}
                                    className="text-slate-400 hover:text-[#0088cc] p-1 transition-colors cursor-pointer"
                                    title="Edit step"
                                  >
                                    <i className="ri-pencil-line text-xs" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteStepFromGroup(group, idx)}
                                    className="text-slate-400 hover:text-rose-600 p-1 transition-colors cursor-pointer"
                                    title="Delete step"
                                  >
                                    <i className="ri-delete-bin-line text-xs" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Card Footer: Apply To (Matching Image 1) */}
                <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-100">Apply To:</span>

                  {/* Sites */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">Site</span>
                    {group.site && group.site.length > 0 ? (
                      group.site.map((s) => (
                        <span
                          key={s}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200/60 dark:border-slate-700"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200/60 dark:border-slate-700">
                        All
                      </span>
                    )}
                  </div>

                  {/* Department */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">Department</span>
                    {group.department && group.department.length > 0 ? (
                      group.department.map((d) => (
                        <span
                          key={d}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200/60 dark:border-slate-700"
                        >
                          {d}
                        </span>
                      ))
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200/60 dark:border-slate-700">
                        All
                      </span>
                    )}
                  </div>

                  {/* Designation */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">Designation</span>
                    {(group.position || group.designation) && (group.position || group.designation)!.length > 0 ? (
                      (group.position || group.designation)!.map((p) => (
                        <span
                          key={p}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200/60 dark:border-slate-700"
                        >
                          {p}
                        </span>
                      ))
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200/60 dark:border-slate-700">
                        All
                      </span>
                    )}
                  </div>

                  {/* Employee Type */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-800 dark:text-slate-200 font-bold">Employee Type</span>
                    {group.employeeType && group.employeeType.length > 0 ? (
                      group.employeeType.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200/60 dark:border-slate-700"
                        >
                          {t}
                        </span>
                      ))
                    ) : (
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] border border-slate-200/60 dark:border-slate-700">
                        All
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Step Modal for Adding / Editing a step in any card */}
      {isStepModalOpen && activeStepCardGroup && (
        <LeaveApprovalFlowStepModal
          isOpen={isStepModalOpen}
          onClose={() => {
            setIsStepModalOpen(false);
            setActiveStepCardGroup(null);
            setEditingCardStepIndex(null);
          }}
          onSave={handleSaveStepModal}
          initialStep={
            editingCardStepIndex !== null && activeStepCardGroup.steps
              ? activeStepCardGroup.steps[editingCardStepIndex]
              : null
          }
          stepIndex={
            editingCardStepIndex !== null && activeStepCardGroup.steps
              ? activeStepCardGroup.steps[editingCardStepIndex].step
              : (activeStepCardGroup.steps?.length || 0) + 1
          }
          employees={allEmployees}
        />
      )}
    </div>
  );
};

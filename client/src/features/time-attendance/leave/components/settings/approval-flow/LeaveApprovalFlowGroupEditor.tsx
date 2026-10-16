import React, { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee } from "@/features/time-attendance/leave/types";
import type {
  LeaveApprovalFlowGroup,
  LeaveApprovalFlowStep,
} from "../../../services/leaveApprovalGroupService";
import { LeaveApprovalFlowStepModal } from "./LeaveApprovalFlowStepModal";
import { OrgMultiSelectDropdown, type DropdownOption } from "./OrgMultiSelectDropdown";

interface LeaveApprovalFlowGroupEditorProps {
  initialGroup?: LeaveApprovalFlowGroup | null;
  onSave: (group: LeaveApprovalFlowGroup) => void;
  onBack: () => void;
  sites?: DropdownOption[];
  departments?: string[];
  positions?: string[];
  designations?: string[];
  employeeTypes?: string[];
  employees?: any[];
}


export const LeaveApprovalFlowGroupEditor: React.FC<LeaveApprovalFlowGroupEditorProps> = ({
  initialGroup,
  onSave,
  onBack,
  sites,
  departments,
  positions,
  designations,
  employeeTypes = ["All", "Full-Time", "Part-Time", "Probation", "Internship", "Contract"],
  employees: propEmployees = [],
}) => {
  const [flowName, setFlowName] = useState(initialGroup?.flowName || "");
  const [sortOrder, setSortOrder] = useState<number>(initialGroup?.sortOrder ?? 15);
  const [selectedSites, setSelectedSites] = useState<string[]>(initialGroup?.site || []);
  const [selectedDepts, setSelectedDepts] = useState<string[]>(initialGroup?.department || []);
  const [selectedPositions, setSelectedPositions] = useState<string[]>(
    initialGroup?.position || initialGroup?.designation || []
  );
  const [selectedEmpTypes, setSelectedEmpTypes] = useState<string[]>(initialGroup?.employeeType || []);

  // Steps table (Exact UI from Screenshot 3)
  const [steps, setSteps] = useState<LeaveApprovalFlowStep[]>(() => {
    if (initialGroup?.steps && initialGroup.steps.length > 0) {
      return initialGroup.steps;
    }
    return [];
  });

  // Modal state (Exact modal from Screenshot 4)
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);

  const [orgSites, setOrgSites] = useState<DropdownOption[]>(sites || []);
  const [orgDepartments, setOrgDepartments] = useState<string[]>(departments || []);
  const [orgPositions, setOrgPositions] = useState<string[]>(positions || designations || []);
  const [dbEmployees, setDbEmployees] = useState<Employee[]>([]);
  const [loadingSites, setLoadingSites] = useState(false);

  // Load sites directly from Org (work_locations table)
  const loadOrgSites = useCallback(async () => {
    setLoadingSites(true);
    try {
      const { data, error } = await supabase
        .from("work_locations")
        .select("id, name, branch_id, is_default")
        .is("deleted_at", null)
        .order("is_default", { ascending: false })
        .order("name");

      if (!error && data && data.length > 0) {
        const seen = new Set<string>();
        const siteOptions: DropdownOption[] = [{ label: "All Sites", value: "All" }];

        for (const s of data) {
          const name = s.name?.trim();
          if (name && !seen.has(name.toLowerCase())) {
            seen.add(name.toLowerCase());
            siteOptions.push({
              label: name,
              value: name,
            });
          }
        }
        setOrgSites(siteOptions);
      } else {
        setOrgSites([
          { label: "All Sites", value: "All" },
          { label: "UNI Building", value: "UNI Building" },
          { label: "Head Office", value: "Head Office" },
          { label: "KampongThom", value: "KampongThom" },
          { label: "BTB Province", value: "BTB Province" },
        ]);
      }
    } catch {
      // fallback
    } finally {
      setLoadingSites(false);
    }
  }, []);

  // Load departments, positions & full staff from Org
  const loadOrgCategories = useCallback(async () => {
    try {
      const [deptRes, posRes, empRes] = await Promise.all([
        supabase.from("departments").select("name").is("deleted_at", null).order("name"),
        supabase.from("positions").select("name").is("deleted_at", null).order("name"),
        supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, avatar_url, email, branch_id, position, site, bu_full_name")
          .is("deleted_at", null)
          .order("first_name"),
      ]);

      if (deptRes.data && deptRes.data.length > 0) {
        const depts = Array.from(new Set(deptRes.data.map((d) => d.name).filter(Boolean)));
        setOrgDepartments(depts);
      } else {
        setOrgDepartments(["All", "Admin", "HR", "Finance", "Operations", "IT"]);
      }

      if (posRes.data && posRes.data.length > 0) {
        const pos = Array.from(new Set(posRes.data.map((p) => p.name).filter(Boolean)));
        setOrgPositions(pos);
      } else {
        setOrgPositions([
          "All",
          "HR & Admin Manager",
          "Business Development Director",
          "Senior HR & Admin Officer",
          "Accountant",
          "Engineer",
        ]);
      }

      if (empRes.data && empRes.data.length > 0) {
        setDbEmployees(empRes.data as Employee[]);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    loadOrgSites();
    loadOrgCategories();
  }, [loadOrgSites, loadOrgCategories]);

  // Combine staff
  const allStaff = useMemo<Employee[]>(() => {
    if (dbEmployees.length > 0) return dbEmployees;
    if (propEmployees.length > 0) return propEmployees as Employee[];
    return [];
  }, [dbEmployees, propEmployees]);

  // Step modal open/close/save
  const handleOpenAddStep = () => {
    setEditingStepIndex(null);
    setIsStepModalOpen(true);
  };

  const handleOpenEditStep = (idx: number) => {
    setEditingStepIndex(idx);
    setIsStepModalOpen(true);
  };

  const handleDeleteStep = (idx: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSaveStep = (step: LeaveApprovalFlowStep) => {
    setSteps((prev) => {
      if (editingStepIndex !== null && editingStepIndex >= 0 && editingStepIndex < prev.length) {
        return prev.map((s, idx) => (idx === editingStepIndex ? step : s));
      }
      return [...prev, step];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialGroup?.id || `group-${Date.now()}`,
      flowName: flowName.trim() || "Leave Approval Flow",
      sortOrder: Number(sortOrder) || 15,
      site: selectedSites,
      department: selectedDepts,
      position: selectedPositions,
      employeeType: selectedEmpTypes,
      steps,
    });
  };

  return (
    <div className="w-full space-y-6 font-sans">
      {/* Header bar (Matching Screenshot 1) */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800">
        <h1 className="text-xl sm:text-2xl font-normal text-slate-600 dark:text-slate-200 tracking-tight">
          {initialGroup ? "Edit Leave Approval Flow Group" : "Create Leave Approval Flow Group"}
        </h1>
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-1 rounded bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
        >
          <i className="ri-arrow-left-line text-xs" />
          <span>Back</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xs">
        {/* SECTION 1: LEAVE APPROVAL FLOW GROUP INFO (Matching Screenshot 1) */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-[#29ABE2] uppercase tracking-wider">
            LEAVE APPROVAL FLOW GROUP INFO
          </h2>

          <div className="space-y-3 max-w-2xl text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-2">
              <label className="text-slate-700 dark:text-slate-300 font-normal sm:text-right pr-4">
                Flow Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={flowName}
                onChange={(e) => setFlowName(e.target.value)}
                placeholder="e.g. UNI Holding Approval Flow"
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#29ABE2]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-2">
              <label className="text-slate-700 dark:text-slate-300 font-normal sm:text-right pr-4">
                Sort Order <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value))}
                placeholder="15"
                className="w-full px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-[#29ABE2]"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: APPROVAL FLOW INFO (Matching Screenshot 1) */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold text-[#29ABE2] uppercase tracking-wider">
            APPROVAL FLOW INFO
          </h2>

          <div className="space-y-3 max-w-2xl text-xs">
            {/* Site (Select from Org) */}
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-2">
              <label className="text-slate-700 dark:text-slate-300 font-normal sm:text-right pr-4">
                Site
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <OrgMultiSelectDropdown
                    value={selectedSites}
                    options={orgSites}
                    onChange={setSelectedSites}
                    placeholder="Select"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => loadOrgSites()}
                  disabled={loadingSites}
                  className={`w-[34px] h-[34px] shrink-0 flex items-center justify-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-[#29ABE2] hover:border-[#29ABE2] transition-colors cursor-pointer shadow-2xs ${
                    loadingSites ? "animate-spin text-[#29ABE2]" : ""
                  }`}
                  title="Refresh sites from Org"
                >
                  <i className="ri-refresh-line text-sm" />
                </button>
              </div>
            </div>

            {/* Department */}
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-2">
              <label className="text-slate-700 dark:text-slate-300 font-normal sm:text-right pr-4">
                Department
              </label>
              <OrgMultiSelectDropdown
                value={selectedDepts}
                options={orgDepartments}
                onChange={setSelectedDepts}
                placeholder="Select"
              />
            </div>

            {/* Position (Replaces Designation) */}
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-2">
              <label className="text-slate-700 dark:text-slate-300 font-normal sm:text-right pr-4">
                Position
              </label>
              <OrgMultiSelectDropdown
                value={selectedPositions}
                options={orgPositions}
                onChange={setSelectedPositions}
                placeholder="Select"
              />
            </div>

            {/* Employee Type */}
            <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] items-center gap-2">
              <label className="text-slate-700 dark:text-slate-300 font-normal sm:text-right pr-4">
                Employee Type
              </label>
              <OrgMultiSelectDropdown
                value={selectedEmpTypes}
                options={employeeTypes}
                onChange={setSelectedEmpTypes}
                placeholder="Select"
              />
            </div>
          </div>

          {/* SECTION 3: STEPS TABLE (Exact UI from Screenshot 3) */}
          <div className="pt-4 space-y-0">
            <div className="w-full overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-t">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">No.</th>
                    <th className="py-2.5 px-3">Approval condition</th>
                    <th className="py-2.5 px-3">Flow title</th>
                    <th className="py-2.5 px-3">Flow Type</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Condition</th>
                    <th className="py-2.5 px-3">Step</th>
                    <th className="py-2.5 px-3">Expired hours</th>
                    <th className="py-2.5 px-3 text-center w-28">Display in print</th>
                    <th className="py-2.5 px-3 w-16 text-center">
                      <button
                        type="button"
                        onClick={handleOpenAddStep}
                        className="text-[#29ABE2] hover:text-sky-600 transition-transform hover:scale-110 cursor-pointer text-base"
                        title="Add flow step"
                      >
                        <i className="ri-add-circle-line" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {steps.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-slate-400 font-medium text-xs">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    steps.map((st, idx) => (
                      <tr
                        key={st.id || idx}
                        className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300 transition-colors"
                      >
                        <td className="py-2.5 px-3 text-center text-slate-500">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800 dark:text-slate-100">
                          {idx === 0 ? "" : (st.conditionPrefix || st.approvalCondition || "OR")}
                        </td>
                        <td className="py-2.5 px-3">{st.flowTitle || "Notified to"}</td>
                        <td className="py-2.5 px-3">{st.flowType || "Employee"}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-normal border border-slate-200/60 dark:border-slate-700">
                            {st.description}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{st.condition || ">=0"}</td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{st.step || 1}</td>
                        <td className="py-2.5 px-3 text-slate-500">{st.expiredHours || ""}</td>
                        <td className="py-2.5 px-3 text-center">
                          {st.displayInPrint ? (
                            <i className="ri-check-line text-slate-400 dark:text-slate-300 font-bold text-sm" />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditStep(idx)}
                              className="text-slate-400 hover:text-sky-600 cursor-pointer p-0.5"
                              title="Edit step"
                            >
                              <i className="ri-edit-line text-xs" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteStep(idx)}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer p-0.5"
                              title="Delete step"
                            >
                              <i className="ri-delete-bin-line text-xs" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Apply To Bar (Matching Screenshot 3) */}
            <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 border border-t-0 border-slate-200 dark:border-slate-700 rounded-b flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
              <span className="font-bold text-slate-800 dark:text-slate-100">Apply To:</span>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-700 dark:text-slate-200">Site</span>
                {selectedSites.length === 0 ? (
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px]">All</span>
                ) : (
                  selectedSites.map((s) => (
                    <span key={s} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px] font-normal">
                      {s}
                    </span>
                  ))
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-700 dark:text-slate-200">Department</span>
                {selectedDepts.length === 0 ? (
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px]">All</span>
                ) : (
                  selectedDepts.map((d) => (
                    <span key={d} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px] font-normal">
                      {d}
                    </span>
                  ))
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-700 dark:text-slate-200">Position</span>
                {selectedPositions.length === 0 ? (
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px]">All</span>
                ) : (
                  selectedPositions.map((p) => (
                    <span key={p} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px] font-normal">
                      {p}
                    </span>
                  ))
                )}
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-slate-700 dark:text-slate-200">Employee Type</span>
                {selectedEmpTypes.length === 0 ? (
                  <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px]">All</span>
                ) : (
                  selectedEmpTypes.map((et) => (
                    <span key={et} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10.5px] font-normal">
                      {et}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions (Matching Screenshot 1) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
          <button
            type="submit"
            className="px-4 py-1.5 rounded bg-[#29ABE2] hover:bg-sky-600 text-white text-xs font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <i className="ri-save-line text-xs" />
            <span>Save</span>
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-3.5 py-1.5 rounded bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <i className="ri-close-line text-xs" />
            <span>Discard</span>
          </button>
        </div>
      </form>

      {/* Step Modal (Exact Modal from Screenshot 4) */}
      {isStepModalOpen && (
        <LeaveApprovalFlowStepModal
          isOpen={isStepModalOpen}
          onClose={() => setIsStepModalOpen(false)}
          onSave={handleSaveStep}
          initialStep={editingStepIndex !== null ? steps[editingStepIndex] : null}
          stepIndex={editingStepIndex !== null ? steps[editingStepIndex].step : steps.length + 1}
          employees={allStaff}
        />
      )}
    </div>
  );
};

import { useState, useMemo, memo } from "react";
import type { ScheduleTemplate, ScheduleTemplateDayAssignment } from "./types";
import type { ManagedShift } from "../shifts-manager/types";
import { useShiftsManager } from "../shifts-manager/useShiftsManager";
import { useBranchScope } from "@/context/BranchContext";
import type { Employee, WorkLocation } from "../../types";
import { TemplateInfoCard } from "./TemplateInfoCard";
import { TemplateEmployeeTable } from "./TemplateEmployeeTable";
import { TemplateAddEmployeeModal } from "./TemplateAddEmployeeModal";

interface Props {
  initialData?: ScheduleTemplate | null;
  employees: Employee[];
  workLocations?: WorkLocation[];
  shifts?: ManagedShift[];
  onBack: () => void;
  onSave: (template: ScheduleTemplate) => void;
}

const DEFAULT_DAYS: ScheduleTemplateDayAssignment = {
  mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: "",
};

export const CreateScheduleTemplateForm = memo(function CreateScheduleTemplateForm({
  initialData,
  employees,
  shifts: externalShifts,
  onBack,
  onSave,
}: Props) {
  const { effectiveBranchName, effectiveBranchId } = useBranchScope();
  const shiftsHook = useShiftsManager();
  const availableShifts = useMemo(() => (
    externalShifts && externalShifts.length > 0 ? externalShifts : shiftsHook.shifts
  ), [externalShifts, shiftsHook.shifts]);

  const isEditing = Boolean(initialData);
  const [title, setTitle] = useState(initialData?.title || "");
  const [siteId, setSiteId] = useState(initialData?.site_id || effectiveBranchId || "");
  const [siteName, setSiteName] = useState(initialData?.site_name || effectiveBranchName || "All");
  const [days, setDays] = useState<ScheduleTemplateDayAssignment>(initialData?.days || DEFAULT_DAYS);
  const [remark, setRemark] = useState(initialData?.remark || "");
  const [assignedIds, setAssignedIds] = useState<string[]>(initialData?.assigned_employee_ids || []);
  const [selectedInTable, setSelectedInTable] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);

  const handleCopyMonToWeekdays = () => {
    if (!days.mon) return;
    setDays((p) => ({ ...p, tue: p.mon, wed: p.mon, thu: p.mon, fri: p.mon }));
  };

  const assignedEmployees = useMemo(
    () => employees.filter((e) => assignedIds.includes(e.id)),
    [employees, assignedIds]
  );

  const allDepts = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => { if (e.department) set.add(e.department); });
    return Array.from(set);
  }, [employees]);

  const handleRemoveSelected = () => {
    if (selectedInTable.length === 0) return;
    setAssignedIds((prev) => prev.filter((id) => !selectedInTable.includes(id)));
    setSelectedInTable([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return alert("Please enter a title for this schedule template.");
    onSave({
      id: initialData?.id || `st-${Date.now()}`,
      title: title.trim(),
      site_id: siteId || undefined,
      site_name: siteName,
      days: {
        mon: days.mon || "OFF", tue: days.tue || "OFF", wed: days.wed || "OFF",
        thu: days.thu || "OFF", fri: days.fri || "OFF", sat: days.sat || "OFF", sun: days.sun || "OFF",
      },
      total_employee: assignedIds.length,
      assigned_employee_ids: assignedIds,
      remark: remark.trim(),
      status: initialData?.status || "Active",
    });
  };

  return (
    <div className="attendance-hub min-h-screen bg-[#F8F9FB] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 font-sans space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">
            <span>Workforce Operations</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span>Time &amp; Attendance</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] dark:text-sky-400 font-bold">Schedule Templates</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-slate-100 tracking-tight">
            {isEditing ? "Edit Schedule Template" : "Create Schedule Templates"}
          </h1>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-gray-50 border border-gray-200/80 dark:border-slate-800 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-2xs cursor-pointer"
        >
          <i className="ri-arrow-left-line text-sm text-[#253C7D] dark:text-sky-400" />
          <span>Back</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <TemplateInfoCard
          title={title}
          setTitle={setTitle}
          siteName={siteName}
          setSiteName={setSiteName}
          setSiteId={setSiteId}
          days={days}
          setDays={setDays}
          remark={remark}
          setRemark={setRemark}
          availableShifts={availableShifts}
          onCopyMonToWeekdays={handleCopyMonToWeekdays}
          onSetWeekendOff={() => setDays((p) => ({ ...p, sat: "OFF", sun: "OFF" }))}
        />

        <TemplateEmployeeTable
          assignedEmployees={assignedEmployees}
          selectedInTable={selectedInTable}
          setSelectedInTable={setSelectedInTable}
          onRemoveSelected={handleRemoveSelected}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          allDepts={allDepts}
          siteName={siteName}
        />

        <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="relative inline-flex shadow-xs rounded-xl overflow-hidden">
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <i className="ri-save-3-line text-sm" />
                <span>Save Template</span>
              </button>
              <button
                type="button"
                onClick={() => setSaveMenuOpen((p) => !p)}
                className="px-2.5 py-2.5 bg-[#1E3064] text-white text-xs border-l border-white/20 cursor-pointer flex items-center"
              >
                <i className="ri-arrow-down-s-line text-xs" />
              </button>
              {saveMenuOpen && (
                <div className="absolute left-0 bottom-full mb-1.5 w-44 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-30 text-xs">
                  <button
                    type="submit"
                    onClick={() => setSaveMenuOpen(false)}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-slate-200 cursor-pointer flex items-center gap-2 font-medium"
                  >
                    <i className="ri-check-line text-[#253C7D] dark:text-sky-400" />
                    Save &amp; Close
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-close-line text-sm text-gray-400" />
              <span>Discard</span>
            </button>
          </div>
        </div>
      </form>

      <TemplateAddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        employees={employees}
        assignedIds={assignedIds}
        onConfirm={(ids) => setAssignedIds((p) => Array.from(new Set([...p, ...ids])))}
        siteName={siteName}
      />
    </div>
  );
});

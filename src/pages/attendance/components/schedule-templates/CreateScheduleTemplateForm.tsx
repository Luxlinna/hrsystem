import { useState, useMemo, memo } from "react";
import type { ScheduleTemplate } from "./types";
import type { ManagedShift } from "../shifts-manager/types";
import { useShiftsManager } from "../shifts-manager/useShiftsManager";
import type { Employee, WorkLocation } from "../../types";

interface CreateScheduleTemplateFormProps {
  initialData?: ScheduleTemplate | null;
  employees: Employee[];
  workLocations?: WorkLocation[];
  shifts?: ManagedShift[];
  onBack: () => void;
  onSave: (template: ScheduleTemplate) => void;
}

export const CreateScheduleTemplateForm = memo(function CreateScheduleTemplateForm({
  initialData,
  employees,
  workLocations = [],
  shifts: externalShifts,
  onBack,
  onSave,
}: CreateScheduleTemplateFormProps) {
  const shiftsHook = useShiftsManager();
  const availableShifts = useMemo(() => {
    if (externalShifts && externalShifts.length > 0) return externalShifts;
    return shiftsHook.shifts;
  }, [externalShifts, shiftsHook.shifts]);

  const isEditing = Boolean(initialData);

  const [title, setTitle] = useState(initialData?.title || "");
  const [siteId, setSiteId] = useState(initialData?.site_id || "");
  const [siteName, setSiteName] = useState(initialData?.site_name || "All");

  const [mon, setMon] = useState(initialData?.days?.mon || "");
  const [tue, setTue] = useState(initialData?.days?.tue || "");
  const [wed, setWed] = useState(initialData?.days?.wed || "");
  const [thu, setThu] = useState(initialData?.days?.thu || "");
  const [fri, setFri] = useState(initialData?.days?.fri || "");
  const [sat, setSat] = useState(initialData?.days?.sat || "");
  const [sun, setSun] = useState(initialData?.days?.sun || "");

  const [remark, setRemark] = useState(initialData?.remark || "");

  // Assigned employees
  const [assignedIds, setAssignedIds] = useState<string[]>(
    initialData?.assigned_employee_ids || []
  );
  const [selectedInTable, setSelectedInTable] = useState<string[]>([]);
  const [empSearch, setEmpSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  // Add Employee Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState("");
  const [modalSelected, setModalSelected] = useState<string[]>([]);

  // Split save menu
  const [saveMenuOpen, setSaveMenuOpen] = useState(false);

  // Quick apply helper
  const handleCopyMonToWeekdays = () => {
    if (!mon) return;
    setTue(mon);
    setWed(mon);
    setThu(mon);
    setFri(mon);
  };

  const handleSetWeekendOff = () => {
    setSat("OFF");
    setSun("OFF");
  };

  // Filter assigned employees in the table
  const assignedEmployees = useMemo(() => {
    return employees.filter((e) => assignedIds.includes(e.id));
  }, [employees, assignedIds]);

  const filteredAssigned = useMemo(() => {
    return assignedEmployees.filter((e) => {
      const q = empSearch.toLowerCase();
      const name = `${e.first_name} ${e.last_name}`.toLowerCase();
      const code = (e.employee_code || e.biometric_user_id || "").toLowerCase();
      const matchesSearch = !q || name.includes(q) || code.includes(q);
      const matchesDept =
        deptFilter === "all" || e.department?.toLowerCase() === deptFilter.toLowerCase();
      return matchesSearch && matchesDept;
    });
  }, [assignedEmployees, empSearch, deptFilter]);

  const allDepts = useMemo(() => {
    const set = new Set<string>();
    employees.forEach((e) => {
      if (e.department) set.add(e.department);
    });
    return Array.from(set);
  }, [employees]);

  // Remove selected employees
  const handleRemoveSelected = () => {
    if (selectedInTable.length === 0) return;
    setAssignedIds((prev) => prev.filter((id) => !selectedInTable.includes(id)));
    setSelectedInTable([]);
  };

  // Add employees modal confirm
  const handleConfirmAddModal = () => {
    setAssignedIds((prev) => {
      const set = new Set([...prev, ...modalSelected]);
      return Array.from(set);
    });
    setIsAddModalOpen(false);
    setModalSelected([]);
    setModalSearch("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please enter a title for this schedule template.");
      return;
    }

    const newTemplate: ScheduleTemplate = {
      id: initialData?.id || `st-${Date.now()}`,
      title: title.trim(),
      site_id: siteId || undefined,
      site_name: siteName,
      days: {
        mon: mon || "OFF",
        tue: tue || "OFF",
        wed: wed || "OFF",
        thu: thu || "OFF",
        fri: fri || "OFF",
        sat: sat || "OFF",
        sun: sun || "OFF",
      },
      total_employee: assignedIds.length,
      assigned_employee_ids: assignedIds,
      remark: remark.trim(),
      status: initialData?.status || "Active",
    };

    onSave(newTemplate);
  };

  return (
    <div className="attendance-hub min-h-screen bg-[#F8F9FB] dark:bg-slate-950 p-4 sm:p-6 lg:p-8 font-sans space-y-6">
      {/* Top Header */}
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
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200/80 dark:border-slate-800 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer self-start sm:self-auto"
        >
          <i className="ri-arrow-left-line text-sm text-[#253C7D] dark:text-sky-400" />
          <span>Back</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* CARD 1: SCHEDULE TEMPLATE INFO */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-slate-800 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-slate-800">
            <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <i className="ri-calendar-schedule-line text-base text-[#253C7D] dark:text-sky-400" />
              Schedule Template Info
            </h3>

            {/* Quick Presets */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyMonToWeekdays}
                className="text-[11px] font-bold text-[#253C7D] dark:text-sky-400 hover:underline cursor-pointer"
                title="Copy Monday's selected shift to Tuesday through Friday"
              >
                Copy Mon &rarr; Fri
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={handleSetWeekendOff}
                className="text-[11px] font-bold text-gray-500 hover:text-gray-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Set Sat &amp; Sun OFF
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Audit Shift HQ10 - 07:00PM - 04:00AM (26 Days)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] shadow-2xs"
              />
            </div>

            {/* Site */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Site
              </label>
              <div className="relative flex items-center gap-2">
                <select
                  value={siteName}
                  onChange={(e) => {
                    const sel = e.target.value;
                    setSiteName(sel);
                    const match = workLocations.find((l) => l.name === sel);
                    setSiteId(match?.id || "");
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer appearance-none pr-8 shadow-2xs"
                >
                  <option value="All">All</option>
                  <option value="Main Office">Main Office</option>
                  {workLocations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
                <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
              </div>
            </div>

            {/* Days Selectors: Monday through Sunday */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 pt-2">
              {[
                { label: "Monday", val: mon, setter: setMon },
                { label: "Tuesday", val: tue, setter: setTue },
                { label: "Wednesday", val: wed, setter: setWed },
                { label: "Thursday", val: thu, setter: setThu },
                { label: "Friday", val: fri, setter: setFri },
                { label: "Saturday", val: sat, setter: setSat },
                { label: "Sunday", val: sun, setter: setSun },
              ].map((day) => (
                <div key={day.label}>
                  <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                    {day.label} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={day.val}
                      onChange={(e) => day.setter(e.target.value)}
                      className="w-full px-2.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer appearance-none pr-7 shadow-2xs"
                    >
                      <option value="">Select</option>
                      <option value="OFF">OFF</option>
                      {availableShifts.map((s) => (
                        <option key={s.id} value={s.code || s.name}>
                          {s.code ? `${s.code} - ${s.name}` : s.name}
                        </option>
                      ))}
                      {day.val && day.val !== "OFF" && !availableShifts.some((s) => (s.code || s.name) === day.val) && (
                        <option value={day.val}>{day.val}</option>
                      )}
                    </select>
                    <i className="ri-arrow-down-s-line absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs pointer-events-none" />
                  </div>
                </div>
              ))}
            </div>

            {/* Remark */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1.5">
                Remark
              </label>
              <textarea
                rows={3}
                placeholder="Enter optional remark or shift scan rules (e.g. Schedule Scan Break 4 times per day)..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-medium text-gray-800 dark:text-slate-200 focus:bg-white focus:outline-none focus:border-[#253C7D] transition-all resize-y shadow-2xs"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: EMPLOYEE ON SCHEDULE */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-gray-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-gray-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                <i className="ri-team-line text-base text-[#253C7D] dark:text-sky-400" />
                Employee on Schedule ({assignedEmployees.length})
              </h3>
            </div>

            {/* Actions: Remove Employee & Add Employees */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRemoveSelected}
                disabled={selectedInTable.length === 0}
                className="px-3.5 py-1.5 border border-rose-300 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Remove Employee {selectedInTable.length > 0 ? `(${selectedInTable.length})` : ""}
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="px-3.5 py-1.5 border border-[#253C7D] dark:border-sky-500 text-[#253C7D] dark:text-sky-400 hover:bg-[#253C7D]/10 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Add Employees
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center w-full sm:max-w-xs">
              <input
                type="text"
                placeholder="Search..."
                value={empSearch}
                onChange={(e) => setEmpSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-l-xl focus:bg-white focus:outline-none focus:border-[#253C7D] text-gray-800 dark:text-slate-100"
              />
              <button
                type="button"
                className="px-3 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-r-xl flex items-center justify-center cursor-pointer"
              >
                <i className="ri-search-line text-xs" />
              </button>
            </div>

            {/* Department Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 font-semibold">Filter:</span>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-700 dark:text-slate-200 focus:outline-none focus:border-[#253C7D]"
              >
                <option value="all">All Departments</option>
                {allDepts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200/80 dark:border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-slate-800/60 text-gray-500 dark:text-slate-400 font-bold border-b border-gray-200/80 dark:border-slate-800">
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredAssigned.length > 0 &&
                        filteredAssigned.every((e) => selectedInTable.includes(e.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedInTable(filteredAssigned.map((item) => item.id));
                        } else {
                          setSelectedInTable([]);
                        }
                      }}
                      className="rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3 w-12 text-center">No.</th>
                  <th className="py-2.5 px-3">Employee Code</th>
                  <th className="py-2.5 px-3">Employee Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Designation</th>
                  <th className="py-2.5 px-3">Site</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredAssigned.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-gray-400">
                      <i className="ri-user-add-line text-2xl mb-1 block" />
                      No employees assigned to this schedule template yet. Click &quot;Add Employees&quot; to assign staff.
                    </td>
                  </tr>
                ) : (
                  filteredAssigned.map((emp, idx) => {
                    const isChecked = selectedInTable.includes(emp.id);
                    return (
                      <tr
                        key={emp.id}
                        className={`hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                          isChecked ? "bg-indigo-50/40 dark:bg-indigo-950/20" : ""
                        }`}
                      >
                        <td className="py-3 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedInTable((p) => [...p, emp.id]);
                              } else {
                                setSelectedInTable((p) => p.filter((x) => x !== emp.id));
                              }
                            }}
                            className="rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-gray-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-gray-700 dark:text-slate-300">
                          {emp.employee_code || (emp.biometric_user_id ? `#${emp.biometric_user_id}` : "—")}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-[#253C7D] text-white flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden">
                              {emp.avatar_url ? (
                                <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <span>{emp.first_name?.[0] || "E"}</span>
                              )}
                            </div>
                            <span className="font-bold text-gray-900 dark:text-slate-100">
                              {emp.first_name} {emp.last_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-gray-600 dark:text-slate-300">
                          {emp.department || "General"}
                        </td>
                        <td className="py-3 px-3 text-gray-600 dark:text-slate-300">
                          {emp.role || "Staff"}
                        </td>
                        <td className="py-3 px-3 text-gray-600 dark:text-slate-300">
                          {emp.branches?.name || siteName || "Main Office"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* BOTTOM ACTIONS BAR */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-gray-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            {/* Split Save Button */}
            <div className="relative inline-flex shadow-xs rounded-xl overflow-hidden">
              <button
                type="submit"
                className="px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
              >
                <i className="ri-save-3-line text-sm" />
                <span>Save Template</span>
              </button>

              <button
                type="button"
                onClick={() => setSaveMenuOpen((p) => !p)}
                className="px-2.5 py-2.5 bg-[#1E3064] hover:bg-[#17254E] text-white text-xs border-l border-white/20 cursor-pointer flex items-center transition-all"
                title="More save options"
              >
                <i className="ri-arrow-down-s-line text-xs" />
              </button>

              {saveMenuOpen && (
                <div className="absolute left-0 bottom-full mb-1.5 w-44 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl shadow-xl py-1 z-30 text-xs animate-in fade-in-50 zoom-in-95">
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

            {/* Discard Button */}
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-close-line text-sm text-gray-400" />
              <span>Discard</span>
            </button>
          </div>
        </div>
      </form>

      {/* ADD EMPLOYEES MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-gray-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95">
            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm">
                  Add Employees to Schedule
                </h3>
                <p className="text-xs text-gray-400">
                  Select staff members to assign to this schedule template.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 flex items-center justify-center text-gray-500 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-gray-100 dark:border-slate-800">
              <input
                type="text"
                placeholder="Search by name, department, or employee code..."
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:border-[#253C7D] text-gray-800 dark:text-slate-100"
              />
            </div>

            {/* Employee List */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-gray-50 dark:divide-slate-800">
              {employees
                .filter((emp) => {
                  const q = modalSearch.toLowerCase();
                  const name = `${emp.first_name} ${emp.last_name}`.toLowerCase();
                  const code = (emp.employee_code || emp.biometric_user_id || "").toLowerCase();
                  const dept = (emp.department || "").toLowerCase();
                  return !q || name.includes(q) || code.includes(q) || dept.includes(q);
                })
                .map((emp) => {
                  const isAssignedAlready = assignedIds.includes(emp.id);
                  const isSelected = modalSelected.includes(emp.id);

                  return (
                    <div
                      key={emp.id}
                      onClick={() => {
                        if (isAssignedAlready) return;
                        setModalSelected((prev) =>
                          prev.includes(emp.id)
                            ? prev.filter((id) => id !== emp.id)
                            : [...prev, emp.id]
                        );
                      }}
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer text-xs transition-colors ${
                        isAssignedAlready
                          ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-slate-800/40"
                          : isSelected
                          ? "bg-indigo-50 dark:bg-indigo-950/60 text-[#253C7D] font-bold"
                          : "hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-800 dark:text-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isAssignedAlready || isSelected}
                          disabled={isAssignedAlready}
                          onChange={() => {}}
                          className="rounded border-gray-300 text-[#253C7D] cursor-pointer"
                        />
                        <div className="w-7 h-7 rounded-full bg-[#253C7D] text-white flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden">
                          {emp.avatar_url ? (
                            <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span>{emp.first_name?.[0] || "E"}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold">
                            {emp.first_name} {emp.last_name}
                            {emp.employee_code && (
                              <span className="ml-1.5 text-[10px] font-mono text-gray-400">
                                ({emp.employee_code})
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {emp.role || "Staff"} &middot; {emp.department || "General"}
                          </div>
                        </div>
                      </div>

                      {isAssignedAlready && (
                        <span className="text-[10px] text-gray-400 font-bold">Already Added</span>
                      )}
                    </div>
                  );
                })}
            </div>

            {/* Modal Actions */}
            <div className="p-3 bg-gray-50 dark:bg-slate-800/60 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-bold">
                {modalSelected.length} employee(s) selected
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-1.5 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddModal}
                  disabled={modalSelected.length === 0}
                  className="px-4 py-1.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Add Selected
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

import { memo, useState, useRef, useEffect } from "react";
import type { Employee, WorkLocation } from "../../types";
import { FilterSubMenu } from "./FilterSubMenu";
import { formatBiometricId } from "@/lib/biometricUtils";

interface Props {
  employees: Employee[];
  availableEmployees: Employee[];
  filterEmployeeId?: string;
  setFilterEmployeeId?: (id: string) => void;
  departments: string[];
  filterDepartment: string;
  setFilterDepartment: (dept: string) => void;
  roles?: string[];
  filterRole?: string;
  setFilterRole?: (role: string) => void;
  employmentTypes?: string[];
  filterEmploymentType?: string;
  setFilterEmploymentType?: (type: string) => void;
  workLocations?: WorkLocation[];
  filterWorkLocation?: string;
  setFilterWorkLocation?: (locId: string) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

type MenuCategory = "site" | "department" | "designation" | "employee_type" | "employee" | null;

export const FilterFlyoutMenu = memo(function FilterFlyoutMenu({
  employees,
  availableEmployees,
  filterEmployeeId = "all",
  setFilterEmployeeId,
  departments,
  filterDepartment,
  setFilterDepartment,
  roles = [],
  filterRole = "all",
  setFilterRole,
  employmentTypes = [],
  filterEmploymentType = "all",
  setFilterEmploymentType,
  workLocations = [],
  filterWorkLocation = "all",
  setFilterWorkLocation,
  onOpenChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeSub, setActiveSub] = useState<MenuCategory>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveSub(null);
        onOpenChange?.(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onOpenChange]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    setActiveSub(null);
    onOpenChange?.(next);
  };

  const activeCount = [
    filterWorkLocation !== "all",
    filterDepartment !== "all",
    filterRole !== "all",
    filterEmploymentType !== "all",
    filterEmployeeId !== "all",
  ].filter(Boolean).length;

  const availableRoles = roles.length > 0 ? roles : Array.from(new Set(employees.map((e) => e.role).filter(Boolean))).sort();
  const availableEmpTypes = employmentTypes.length > 0 ? employmentTypes : Array.from(new Set(employees.map((e) => e.employment_type || e.contract_type).filter(Boolean) as string[])).sort();

  const siteItems = workLocations.map((loc) => ({ id: loc.id, label: loc.name }));
  const deptItems = departments.map((d) => ({ id: d, label: d }));
  const roleItems = availableRoles.map((r) => ({ id: r, label: r }));
  const empTypeItems = availableEmpTypes.map((t) => ({ id: t, label: t.replace("_", " ") }));
  const employeeItems = availableEmployees.map((emp) => {
    const rawBio = emp.biometric_user_id || emp.employee_code;
    const bName = Array.isArray(emp.branches) ? emp.branches[0]?.name : emp.branches?.name || "";
    const bioId = formatBiometricId(rawBio, bName);
    return { id: emp.id, label: `${emp.first_name} ${emp.last_name}${bioId ? ` [${bioId}]` : ""}` };
  });

  const categories = [
    { key: "site" as MenuCategory, label: "Site", icon: "ri-building-line", isFiltered: filterWorkLocation !== "all", items: siteItems, selected: filterWorkLocation, onSelect: (id: string) => { setFilterWorkLocation?.(id); setOpen(false); } },
    { key: "department" as MenuCategory, label: "Department", icon: "ri-team-line", isFiltered: filterDepartment !== "all", items: deptItems, selected: filterDepartment, onSelect: (id: string) => { setFilterDepartment(id); setOpen(false); } },
    { key: "designation" as MenuCategory, label: "Position", icon: "ri-briefcase-line", isFiltered: filterRole !== "all", items: roleItems, selected: filterRole, onSelect: (id: string) => { setFilterRole?.(id); setOpen(false); } },
    { key: "employee_type" as MenuCategory, label: "Employee Type", icon: "ri-user-settings-line", isFiltered: filterEmploymentType !== "all", items: empTypeItems, selected: filterEmploymentType, onSelect: (id: string) => { setFilterEmploymentType?.(id); setOpen(false); } },
    ...(setFilterEmployeeId ? [{ key: "employee" as MenuCategory, label: "Employee", icon: "ri-user-line", isFiltered: filterEmployeeId !== "all", items: employeeItems, selected: filterEmployeeId, onSelect: (id: string) => { setFilterEmployeeId(id); setOpen(false); } }] : []),
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-white transition-all cursor-pointer shadow-xs active:scale-98 select-none ${
          activeCount > 0 ? "bg-[#0284c7] hover:bg-[#0369a1] ring-2 ring-sky-300 dark:ring-sky-800" : "bg-[#0284c7] hover:bg-[#0369a1]"
        }`}
        aria-expanded={open}
      >
        <span>Filter</span>
        {activeCount > 0 && (
          <span className="bg-white text-[#0284c7] text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-extrabold leading-none">
            {activeCount}
          </span>
        )}
        <i className={`ri-arrow-down-s-line text-xs transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 py-1 overflow-visible animate-in fade-in zoom-in-98 duration-100">
          {categories.map((cat) => (
            <div key={cat.key} className="relative" onMouseEnter={() => setActiveSub(cat.key)}>
              <button
                type="button"
                onClick={() => setActiveSub(activeSub === cat.key ? null : cat.key)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left cursor-pointer transition-colors ${
                  activeSub === cat.key || cat.isFiltered
                    ? "bg-slate-50 dark:bg-slate-800 text-sky-700 dark:text-sky-300 font-bold"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <i className={`${cat.icon} text-xs text-slate-400`} />
                  <span>{cat.label}</span>
                  {cat.isFiltered && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />}
                </div>
                <i className="ri-arrow-right-s-line text-xs text-slate-400" />
              </button>

              {activeSub === cat.key && (
                <FilterSubMenu
                  title={cat.label}
                  items={cat.items}
                  selectedId={cat.selected}
                  onSelect={cat.onSelect}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

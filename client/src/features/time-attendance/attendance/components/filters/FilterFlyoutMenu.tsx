import { memo, useState, useRef, useEffect, useMemo } from "react";
import type { WorkLocation } from "../../types";
import { AttendanceFilterFlyoutPanel, type FilterOptionItem } from "./AttendanceFilterFlyoutPanel";

interface FilterFlyoutMenuProps {
  filterWorkLocation: string;
  setFilterWorkLocation: (locId: string) => void;
  filterDepartment: string;
  setFilterDepartment: (dept: string) => void;
  filterRole: string;
  setFilterRole: (role: string) => void;
  filterEmploymentType: string;
  setFilterEmploymentType: (type: string) => void;
  filterEmployeeLevel?: string;
  setFilterEmployeeLevel?: (level: string) => void;
  branches: { id: string; name: string }[];
  workLocations: WorkLocation[];
  depts: string[];
  positions: string[];
  employeeTypes: string[];
  employeeLevels: string[];
  onOpenChange?: (isOpen: boolean) => void;
}

type ActiveCategory = "site" | "department" | "position" | "employee_type" | "employee_level";

export const FilterFlyoutMenu = memo(function FilterFlyoutMenu({
  filterWorkLocation, setFilterWorkLocation,
  filterDepartment, setFilterDepartment,
  filterRole, setFilterRole,
  filterEmploymentType, setFilterEmploymentType,
  filterEmployeeLevel = "", setFilterEmployeeLevel = () => {},
  branches = [],
  workLocations = [],
  depts = [],
  positions = [],
  employeeTypes = [],
  employeeLevels = [],
  onOpenChange,
}: FilterFlyoutMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("site");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onOpenChange?.(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onOpenChange]);

  const hasActiveFilter = Boolean(
    (filterWorkLocation && filterWorkLocation !== "all") || (filterDepartment && filterDepartment !== "all") ||
    (filterRole && filterRole !== "all") || (filterEmploymentType && filterEmploymentType !== "all") ||
    Boolean(filterEmployeeLevel)
  );

  const categories = useMemo(
    () => [
      { id: "site" as const, label: "Site", active: Boolean(filterWorkLocation && filterWorkLocation !== "all") },
      { id: "department" as const, label: "Department", active: Boolean(filterDepartment && filterDepartment !== "all") },
      { id: "position" as const, label: "Position", active: Boolean(filterRole && filterRole !== "all") },
      { id: "employee_type" as const, label: "Employee Type", active: Boolean(filterEmploymentType && filterEmploymentType !== "all") },
      { id: "employee_level" as const, label: "Employee Level", active: Boolean(filterEmployeeLevel) },
    ],
    [filterWorkLocation, filterDepartment, filterRole, filterEmploymentType, filterEmployeeLevel]
  );

  const siteOptions = useMemo<FilterOptionItem[]>(() => {
    const list: FilterOptionItem[] = [];
    branches.forEach((b) => {
      const branchSites = workLocations.filter((s) => s.branch_id === b.id);
      list.push({ id: b.id, label: b.name, fullLabel: b.name });
      branchSites.forEach((s) => {
        list.push({
          id: `site:${s.id}`,
          label: `↳ ${s.name}`,
          fullLabel: `${b.name} - ${s.name}`,
          isSubItem: true,
        });
      });
    });
    return list;
  }, [branches, workLocations]);

  const deptOptions = useMemo<FilterOptionItem[]>(
    () => depts.filter(Boolean).map((d) => ({ id: d, label: d })),
    [depts]
  );
  const positionOptions = useMemo<FilterOptionItem[]>(() => positions.filter(Boolean).map((p) => ({ id: p, label: p })), [positions]);
  const typeOptions = useMemo<FilterOptionItem[]>(() => employeeTypes.filter(Boolean).map((t) => ({ id: t, label: t.replace(/_/g, " ") })), [employeeTypes]);
  const levelOptions = useMemo<FilterOptionItem[]>(() => employeeLevels.filter(Boolean).map((l) => ({ id: l, label: l })), [employeeLevels]);

  const currentCategoryData = useMemo(() => {
    switch (activeCategory) {
      case "site":
        return {
          items: siteOptions,
          selected: filterWorkLocation && filterWorkLocation !== "all" ? filterWorkLocation.split(",").filter(Boolean) : [],
          onApply: (ids: string[]) => setFilterWorkLocation(ids.length > 0 ? ids.join(",") : "all"),
          onReset: () => setFilterWorkLocation("all"),
        };
      case "department":
        return {
          items: deptOptions,
          selected: filterDepartment && filterDepartment !== "all" ? filterDepartment.split(",").filter(Boolean) : [],
          onApply: (ids: string[]) => setFilterDepartment(ids.join(",") || "all"),
          onReset: () => setFilterDepartment("all"),
        };
      case "position":
        return {
          items: positionOptions,
          selected: filterRole && filterRole !== "all" ? filterRole.split(",").filter(Boolean) : [],
          onApply: (ids: string[]) => setFilterRole(ids.join(",") || "all"),
          onReset: () => setFilterRole("all"),
        };
      case "employee_type":
        return {
          items: typeOptions,
          selected: filterEmploymentType && filterEmploymentType !== "all" ? filterEmploymentType.split(",").filter(Boolean) : [],
          onApply: (ids: string[]) => setFilterEmploymentType(ids.join(",") || "all"),
          onReset: () => setFilterEmploymentType("all"),
        };
      case "employee_level":
        return {
          items: levelOptions,
          selected: filterEmployeeLevel ? filterEmployeeLevel.split(",").filter(Boolean) : [],
          onApply: (ids: string[]) => setFilterEmployeeLevel(ids.join(",")),
          onReset: () => setFilterEmployeeLevel(""),
        };
    }
  }, [
    activeCategory, siteOptions, deptOptions, positionOptions, typeOptions, levelOptions,
    filterWorkLocation, filterDepartment, filterRole, filterEmploymentType, filterEmployeeLevel,
    setFilterWorkLocation, setFilterDepartment, setFilterRole, setFilterEmploymentType, setFilterEmployeeLevel,
  ]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => { const next = !isOpen; setIsOpen(next); onOpenChange?.(next); }}
        className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          isOpen || hasActiveFilter ? "border-[#253C7D] bg-[#253C7D] text-white shadow-xs" : "border-[#253C7D]/40 text-[#253C7D] bg-white dark:bg-slate-800 hover:bg-[#253C7D]/5"
        }`}
      >
        <span>Filter</span>
        <i className="ri-arrow-down-s-line text-xs opacity-90" />
      </button>

      {isOpen && (
        <div onClick={(e) => e.stopPropagation()} className="absolute right-0 top-8 flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-xl z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
          <AttendanceFilterFlyoutPanel items={currentCategoryData.items} selectedValues={currentCategoryData.selected} onApply={(ids) => { currentCategoryData.onApply(ids); setIsOpen(false); onOpenChange?.(false); }} onReset={currentCategoryData.onReset} />
          <div className="w-36 py-1 bg-white dark:bg-slate-900">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onMouseEnter={() => setActiveCategory(cat.id)}
                onClick={() => setActiveCategory(cat.id)}
                className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                  activeCategory === cat.id ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span>{cat.label}</span>
                  {cat.active && <span className="w-1.5 h-1.5 rounded-full bg-[#253C7D]" />}
                </div>
                <i className={`ri-arrow-left-s-fill text-xs transition-colors ${activeCategory === cat.id ? "text-slate-500" : "text-slate-300 dark:text-slate-600"}`} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

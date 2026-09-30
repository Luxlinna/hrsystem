import { memo, useState, useRef, useEffect, useMemo } from "react";
import type { Branch } from "../types";
import { BU_DEFAULT_EMPLOYEE_TYPES, BU_DEFAULT_EMPLOYEE_LEVELS } from "../constants";
import { EmployeesFilterFlyoutPanel, type FilterOptionItem } from "./filter/EmployeesFilterFlyoutPanel";

interface EmployeesFilterDropdownProps {
  filterBranch: string;
  setFilterBranch: (branch: string) => void;
  filterDept: string;
  setFilterDept: (dept: string) => void;
  filterRole: string;
  setFilterRole: (role: string) => void;
  filterEmployeeType: string;
  setFilterEmployeeType: (type: string) => void;
  filterEmployeeLevel: string;
  setFilterEmployeeLevel: (level: string) => void;
  branches: Branch[];
  workSites?: { id: string; name: string; branch_id: string }[];
  depts: (string | null | undefined)[];
  positions?: string[];
  employeeTypes?: string[];
  employeeLevels?: string[];
}

type ActiveCategory = "site" | "department" | "position" | "employee_type" | "employee_level";

export const EmployeesFilterDropdown = memo(function EmployeesFilterDropdown({
  filterBranch,
  setFilterBranch,
  filterDept,
  setFilterDept,
  filterRole,
  setFilterRole,
  filterEmployeeType,
  setFilterEmployeeType,
  filterEmployeeLevel,
  setFilterEmployeeLevel,
  branches,
  workSites = [],
  depts,
  positions = [],
  employeeTypes = BU_DEFAULT_EMPLOYEE_TYPES,
  employeeLevels = BU_DEFAULT_EMPLOYEE_LEVELS,
}: EmployeesFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("site");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const hasActiveFilter = Boolean(filterBranch || filterDept || filterRole || filterEmployeeType || filterEmployeeLevel);

  const categories = useMemo(
    () => [
      { id: "site" as const, label: "Site", active: Boolean(filterBranch) },
      { id: "department" as const, label: "Department", active: Boolean(filterDept) },
      { id: "position" as const, label: "Position", active: Boolean(filterRole) },
      { id: "employee_type" as const, label: "Employee Type", active: Boolean(filterEmployeeType) },
      { id: "employee_level" as const, label: "Employee Level", active: Boolean(filterEmployeeLevel) },
    ],
    [filterBranch, filterDept, filterRole, filterEmployeeType, filterEmployeeLevel]
  );

  const siteOptions = useMemo<FilterOptionItem[]>(() => {
    const list: FilterOptionItem[] = [];
    branches.forEach((b) => {
      list.push({ id: b.id, label: b.name });
      workSites.filter((s) => s.branch_id === b.id).forEach((s) => {
        list.push({ id: `site:${s.id}`, label: `${b.name} - ${s.name}` });
      });
    });
    return list;
  }, [branches, workSites]);

  const deptOptions = useMemo<FilterOptionItem[]>(
    () => depts.filter(Boolean).map((d) => ({ id: d as string, label: d as string })),
    [depts]
  );
  const positionOptions = useMemo<FilterOptionItem[]>(() => positions.map((p) => ({ id: p, label: p })), [positions]);
  const typeOptions = useMemo<FilterOptionItem[]>(() => employeeTypes.map((t) => ({ id: t, label: t })), [employeeTypes]);
  const levelOptions = useMemo<FilterOptionItem[]>(() => employeeLevels.map((l) => ({ id: l, label: l })), [employeeLevels]);

  const currentCategoryData = useMemo(() => {
    switch (activeCategory) {
      case "site":
        return {
          items: siteOptions,
          selected: filterBranch ? filterBranch.split(",").filter(Boolean) : [],
          onApply: (ids: string[]) => setFilterBranch(ids.join(",")),
          onReset: () => setFilterBranch(""),
        };
      case "department":
        return {
          items: deptOptions,
          selected: filterDept ? filterDept.split(",").filter(Boolean) : [],
          onApply: (ids: string[]) => setFilterDept(ids.join(",")),
          onReset: () => setFilterDept(""),
        };
      case "position":
        return {
          items: positionOptions,
          selected: filterRole ? filterRole.split(",").filter(Boolean) : [],
          onApply: (ids: string[]) => setFilterRole(ids.join(",")),
          onReset: () => setFilterRole(""),
        };
      case "employee_type":
        return {
          items: typeOptions,
          selected: filterEmployeeType ? filterEmployeeType.split(",").filter(Boolean) : [],
          onApply: (ids: string[]) => setFilterEmployeeType(ids.join(",")),
          onReset: () => setFilterEmployeeType(""),
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
    filterBranch, filterDept, filterRole, filterEmployeeType, filterEmployeeLevel,
    setFilterBranch, setFilterDept, setFilterRole, setFilterEmployeeType, setFilterEmployeeLevel,
  ]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          isOpen || hasActiveFilter
            ? "border-[#3498db] bg-[#3498db] text-white shadow-xs"
            : "border-sky-400 text-sky-600 bg-white hover:bg-sky-50"
        }`}
      >
        <span>Filter</span>
        <i className="ri-arrow-down-s-line text-xs opacity-90" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-8 flex bg-white border border-slate-200 rounded shadow-xl z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          <EmployeesFilterFlyoutPanel
            items={currentCategoryData.items}
            selectedValues={currentCategoryData.selected}
            onApply={(ids) => {
              currentCategoryData.onApply(ids);
              setIsOpen(false);
            }}
            onReset={currentCategoryData.onReset}
          />

          <div className="w-36 py-1 bg-white">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onMouseEnter={() => setActiveCategory(cat.id)}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    isActive ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{cat.label}</span>
                    {cat.active && <span className="w-1.5 h-1.5 rounded-full bg-[#3498db]" />}
                  </div>
                  <i className={`ri-arrow-left-s-fill text-xs transition-colors ${isActive ? "text-slate-500" : "text-slate-300"}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

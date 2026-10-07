import { memo, useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { Branch } from "../types";
import { EmployeesFilterFlyoutPanel, type FilterOptionItem } from "./filter/EmployeesFilterFlyoutPanel";

interface EmployeesFilterDropdownProps {
  filterBranch: string;
  setFilterBranch: (branch: string) => void;
  filterWorkLocation?: string;
  setFilterWorkLocation?: (loc: string) => void;
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

type ActiveCategory = "bu" | "site" | "department" | "position" | "employee_type" | "employee_level";

type DraftFilters = Record<ActiveCategory, Set<string>>;

const parseSet = (val?: string) =>
  new Set(val && val !== "all" ? val.split(",").map((s) => s.trim()).filter(Boolean) : []);

export const EmployeesFilterDropdown = memo(function EmployeesFilterDropdown({
  filterBranch,
  setFilterBranch,
  filterWorkLocation = "all",
  setFilterWorkLocation = () => {},
  filterDept,
  setFilterDept,
  filterRole,
  setFilterRole,
  filterEmployeeType,
  setFilterEmployeeType,
  filterEmployeeLevel,
  setFilterEmployeeLevel,
  branches = [],
  workSites = [],
  depts = [],
  positions = [],
  employeeTypes = [],
  employeeLevels = [],
}: EmployeesFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("bu");
  const containerRef = useRef<HTMLDivElement>(null);

  const [draftFilters, setDraftFilters] = useState<DraftFilters>(() => ({
    bu: parseSet(filterBranch),
    site: parseSet(filterWorkLocation),
    department: parseSet(filterDept),
    position: parseSet(filterRole),
    employee_type: parseSet(filterEmployeeType),
    employee_level: parseSet(filterEmployeeLevel),
  }));

  // Re-synchronize drafts whenever the flyout is opened or external filters change
  useEffect(() => {
    if (isOpen) {
      setDraftFilters({
        bu: parseSet(filterBranch),
        site: parseSet(filterWorkLocation),
        department: parseSet(filterDept),
        position: parseSet(filterRole),
        employee_type: parseSet(filterEmployeeType),
        employee_level: parseSet(filterEmployeeLevel),
      });
    }
  }, [isOpen, filterBranch, filterWorkLocation, filterDept, filterRole, filterEmployeeType, filterEmployeeLevel]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const hasActiveFilter = Boolean(
    filterBranch ||
    (filterWorkLocation && filterWorkLocation !== "all") ||
    filterDept ||
    filterRole ||
    filterEmployeeType ||
    filterEmployeeLevel
  );

  const categories = useMemo(
    () => [
      { id: "bu" as const, label: "BU", count: draftFilters.bu.size, active: draftFilters.bu.size > 0 },
      { id: "site" as const, label: "Site", count: draftFilters.site.size, active: draftFilters.site.size > 0 },
      { id: "department" as const, label: "Department", count: draftFilters.department.size, active: draftFilters.department.size > 0 },
      { id: "position" as const, label: "Position", count: draftFilters.position.size, active: draftFilters.position.size > 0 },
      { id: "employee_type" as const, label: "Employee Type", count: draftFilters.employee_type.size, active: draftFilters.employee_type.size > 0 },
      { id: "employee_level" as const, label: "Employee Level", count: draftFilters.employee_level.size, active: draftFilters.employee_level.size > 0 },
    ],
    [draftFilters]
  );

  const buOptions = useMemo<FilterOptionItem[]>(() => {
    return branches.map((b) => ({ id: b.id, label: b.name }));
  }, [branches]);

  const siteOptions = useMemo<FilterOptionItem[]>(() => {
    if (!workSites || workSites.length === 0) return [];
    return workSites.map((s) => {
      const bName = branches.find((b) => b.id === s.branch_id)?.name;
      return {
        id: s.id,
        label: s.name,
        fullLabel: bName ? `${bName} — ${s.name}` : s.name,
      };
    });
  }, [workSites, branches]);

  const deptOptions = useMemo<FilterOptionItem[]>(
    () => depts.filter(Boolean).map((d) => ({ id: d as string, label: d as string })),
    [depts]
  );
  const positionOptions = useMemo<FilterOptionItem[]>(() => positions.filter(Boolean).map((p) => ({ id: p, label: p })), [positions]);
  const typeOptions = useMemo<FilterOptionItem[]>(() => employeeTypes.filter(Boolean).map((t) => ({ id: t, label: t.replace(/_/g, " ") })), [employeeTypes]);
  const levelOptions = useMemo<FilterOptionItem[]>(() => employeeLevels.filter(Boolean).map((l) => ({ id: l, label: l })), [employeeLevels]);

  const currentCategoryItems = useMemo<FilterOptionItem[]>(() => {
    switch (activeCategory) {
      case "bu":
        return buOptions;
      case "site":
        return siteOptions;
      case "department":
        return deptOptions;
      case "position":
        return positionOptions;
      case "employee_type":
        return typeOptions;
      case "employee_level":
        return levelOptions;
      default:
        return [];
    }
  }, [activeCategory, buOptions, siteOptions, deptOptions, positionOptions, typeOptions, levelOptions]);

  const handleToggleItem = useCallback((id: string) => {
    setDraftFilters((prev) => {
      const nextSet = new Set(prev[activeCategory]);
      if (nextSet.has(id)) {
        nextSet.delete(id);
      } else {
        nextSet.add(id);
      }
      return {
        ...prev,
        [activeCategory]: nextSet,
      };
    });
  }, [activeCategory]);

  const handleToggleAll = useCallback(() => {
    setDraftFilters((prev) => {
      const currentSet = prev[activeCategory];
      const allSelected = currentCategoryItems.length > 0 && currentCategoryItems.every((i) => currentSet.has(i.id));
      const nextSet = new Set(currentSet);
      if (allSelected) {
        currentCategoryItems.forEach((i) => nextSet.delete(i.id));
      } else {
        currentCategoryItems.forEach((i) => nextSet.add(i.id));
      }
      return {
        ...prev,
        [activeCategory]: nextSet,
      };
    });
  }, [activeCategory, currentCategoryItems]);

  const handleApply = useCallback(() => {
    setFilterBranch(Array.from(draftFilters.bu).join(","));
    setFilterWorkLocation?.(draftFilters.site.size > 0 ? Array.from(draftFilters.site).join(",") : "all");
    setFilterDept(Array.from(draftFilters.department).join(","));
    setFilterRole(Array.from(draftFilters.position).join(","));
    setFilterEmployeeType(Array.from(draftFilters.employee_type).join(","));
    setFilterEmployeeLevel(Array.from(draftFilters.employee_level).join(","));
    setIsOpen(false);
  }, [
    draftFilters,
    setFilterBranch,
    setFilterWorkLocation,
    setFilterDept,
    setFilterRole,
    setFilterEmployeeType,
    setFilterEmployeeLevel,
  ]);

  const handleReset = useCallback(() => {
    setDraftFilters((prev) => ({
      ...prev,
      [activeCategory]: new Set<string>(),
    }));
  }, [activeCategory]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          isOpen || hasActiveFilter
            ? "border-[#253C7D] bg-[#253C7D] text-white shadow-xs"
            : "border-[#253C7D]/40 text-[#253C7D] bg-white hover:bg-[#253C7D]/5"
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
            items={currentCategoryItems}
            selectedSet={draftFilters[activeCategory]}
            onToggleItem={handleToggleItem}
            onToggleAll={handleToggleAll}
            onApply={handleApply}
            onReset={handleReset}
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
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{cat.label}</span>
                    {cat.active && (
                      <span className="px-1.5 py-0.2 bg-[#253C7D] text-white text-[10px] font-bold rounded-full leading-none shrink-0">
                        {cat.count}
                      </span>
                    )}
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


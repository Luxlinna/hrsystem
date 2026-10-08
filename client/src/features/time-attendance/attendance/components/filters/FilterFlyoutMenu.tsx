import { memo, useState, useRef, useEffect, useMemo, useCallback } from "react";
import type { WorkLocation } from "../../types";
import { AttendanceFilterFlyoutPanel, type FilterOptionItem } from "./AttendanceFilterFlyoutPanel";
import { useBranchScope } from "@/context/BranchContext";
import { attendanceCache } from "../../services/attendanceCacheService";

interface FilterFlyoutMenuProps {
  filterBranch?: string;
  setFilterBranch?: (branch: string) => void;
  filterWorkLocation?: string;
  setFilterWorkLocation?: (locId: string) => void;
  filterDivision?: string;
  setFilterDivision?: (division: string) => void;
  filterDepartment?: string;
  setFilterDepartment?: (dept: string) => void;
  filterRole?: string;
  setFilterRole?: (role: string) => void;
  filterEmploymentType?: string;
  setFilterEmploymentType?: (type: string) => void;
  filterEmployeeLevel?: string;
  setFilterEmployeeLevel?: (level: string) => void;
  branches?: { id: string; name: string }[];
  workLocations?: WorkLocation[];
  divisions?: string[];
  depts?: string[];
  positions?: string[];
  employeeTypes?: string[];
  employeeLevels?: string[];
  onOpenChange?: (isOpen: boolean) => void;
}

type ActiveCategory = "bu" | "site" | "division" | "department" | "position" | "employee_type" | "employee_level";

type DraftFilters = Record<ActiveCategory, Set<string>>;

const parseSet = (val?: string) =>
  new Set(val && val !== "all" ? val.split(",").map((s) => s.trim()).filter(Boolean) : []);

export const FilterFlyoutMenu = memo(function FilterFlyoutMenu({
  filterBranch = "",
  setFilterBranch = () => {},
  filterWorkLocation = "all",
  setFilterWorkLocation = () => {},
  filterDivision = "all",
  setFilterDivision = () => {},
  filterDepartment = "all",
  setFilterDepartment = () => {},
  filterRole = "all",
  setFilterRole = () => {},
  filterEmploymentType = "all",
  setFilterEmploymentType = () => {},
  filterEmployeeLevel = "",
  setFilterEmployeeLevel = () => {},
  branches = [],
  workLocations = [],
  divisions = [],
  depts = [],
  positions = [],
  employeeTypes = [],
  employeeLevels = [],
  onOpenChange,
}: FilterFlyoutMenuProps) {
  const { visibleBranches, branches: scopeBranches } = useBranchScope();
  const [fetchedBranches, setFetchedBranches] = useState<{ id: string; name: string }[]>(() => attendanceCache.getCachedBranches() || []);
  const [fetchedWorkLocations, setFetchedWorkLocations] = useState<WorkLocation[]>(() => attendanceCache.getCachedWorkLocations() || []);
  const [fetchedDivisions, setFetchedDivisions] = useState<string[]>(() => attendanceCache.getCachedTableValues("divisions") || []);
  const [fetchedDepts, setFetchedDepts] = useState<string[]>(() => attendanceCache.getCachedTableValues("departments") || []);
  const [fetchedPositions, setFetchedPositions] = useState<string[]>(() => attendanceCache.getCachedTableValues("positions") || []);

  useEffect(() => {
    attendanceCache.getBranches().then((data) => {
      if (data && data.length > 0) setFetchedBranches(data);
    });
    attendanceCache.getWorkLocations().then((data) => {
      if (data && data.length > 0) setFetchedWorkLocations(data);
    });
    attendanceCache.getTableValues("divisions", []).then((data) => {
      if (data && data.length > 0) setFetchedDivisions(data);
    });
    attendanceCache.getTableValues("departments", []).then((data) => {
      if (data && data.length > 0) setFetchedDepts(data);
    });
    attendanceCache.getTableValues("positions", []).then((data) => {
      if (data && data.length > 0) setFetchedPositions(data);
    });
  }, []);

  const effectiveBranches = useMemo(() => {
    if (branches && branches.length > 0) return branches.filter((b: any) => !b.is_site);
    if (visibleBranches && visibleBranches.length > 0) return visibleBranches.map((b) => ({ id: b.id, name: b.name }));
    if (scopeBranches && scopeBranches.length > 0) return scopeBranches.filter((b) => !b.is_site).map((b) => ({ id: b.id, name: b.name }));
    if (fetchedBranches && fetchedBranches.length > 0) return fetchedBranches.filter((b: any) => !b.is_site);
    const cached = attendanceCache.getCachedBranches();
    if (cached && cached.length > 0) return cached;
    return [];
  }, [branches, visibleBranches, scopeBranches, fetchedBranches]);

  const effectiveWorkLocations = useMemo(() => {
    if (workLocations && workLocations.length > 0) return workLocations;
    if (fetchedWorkLocations && fetchedWorkLocations.length > 0) return fetchedWorkLocations;
    const cached = attendanceCache.getCachedWorkLocations();
    if (cached && cached.length > 0) return cached;
    if (scopeBranches && scopeBranches.length > 0) {
      return scopeBranches
        .filter((b) => b.is_site)
        .map((s) => ({
          id: s.id.replace(/^site:/, ""),
          name: s.name,
          branch_id: s.branch_id || "",
        } as WorkLocation));
    }
    return [];
  }, [workLocations, fetchedWorkLocations, scopeBranches]);

  const effectiveDivisions = useMemo(() => {
    if (divisions && divisions.length > 0) return divisions;
    return fetchedDivisions;
  }, [divisions, fetchedDivisions]);

  const effectiveDepts = useMemo(() => {
    if (depts && depts.length > 0) return depts;
    return fetchedDepts;
  }, [depts, fetchedDepts]);

  const effectivePositions = useMemo(() => {
    if (positions && positions.length > 0) return positions;
    return fetchedPositions;
  }, [positions, fetchedPositions]);

  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("bu");
  const containerRef = useRef<HTMLDivElement>(null);

  const [draftFilters, setDraftFilters] = useState<DraftFilters>(() => ({
    bu: parseSet(filterBranch),
    site: parseSet(filterWorkLocation),
    division: parseSet(filterDivision),
    department: parseSet(filterDepartment),
    position: parseSet(filterRole),
    employee_type: parseSet(filterEmploymentType),
    employee_level: parseSet(filterEmployeeLevel),
  }));

  // Re-synchronize drafts whenever the flyout is opened or external filters change
  useEffect(() => {
    if (isOpen) {
      setDraftFilters({
        bu: parseSet(filterBranch),
        site: parseSet(filterWorkLocation),
        division: parseSet(filterDivision),
        department: parseSet(filterDepartment),
        position: parseSet(filterRole),
        employee_type: parseSet(filterEmploymentType),
        employee_level: parseSet(filterEmployeeLevel),
      });
    }
  }, [isOpen, filterBranch, filterWorkLocation, filterDivision, filterDepartment, filterRole, filterEmploymentType, filterEmployeeLevel]);

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
    (filterBranch && filterBranch !== "all") ||
    (filterWorkLocation && filterWorkLocation !== "all") ||
    (filterDivision && filterDivision !== "all") ||
    (filterDepartment && filterDepartment !== "all") ||
    (filterRole && filterRole !== "all") ||
    (filterEmploymentType && filterEmploymentType !== "all") ||
    Boolean(filterEmployeeLevel)
  );

  const categories = useMemo(
    () => [
      { id: "bu" as const, label: "BU", count: draftFilters.bu.size, active: draftFilters.bu.size > 0 },
      { id: "site" as const, label: "Site", count: draftFilters.site.size, active: draftFilters.site.size > 0 },
      { id: "division" as const, label: "Division", count: draftFilters.division.size, active: draftFilters.division.size > 0 },
      { id: "department" as const, label: "Department", count: draftFilters.department.size, active: draftFilters.department.size > 0 },
      { id: "position" as const, label: "Position", count: draftFilters.position.size, active: draftFilters.position.size > 0 },
      { id: "employee_type" as const, label: "Employee Type", count: draftFilters.employee_type.size, active: draftFilters.employee_type.size > 0 },
      { id: "employee_level" as const, label: "Employee Level", count: draftFilters.employee_level.size, active: draftFilters.employee_level.size > 0 },
    ],
    [draftFilters]
  );

  const buOptions = useMemo<FilterOptionItem[]>(() => {
    return effectiveBranches.map((b) => ({ id: b.id, label: b.name }));
  }, [effectiveBranches]);

  const siteOptions = useMemo<FilterOptionItem[]>(() => {
    if (!effectiveWorkLocations || effectiveWorkLocations.length === 0) return [];
    return effectiveWorkLocations.map((s) => {
      const bName = effectiveBranches.find((b) => b.id === s.branch_id)?.name;
      return {
        id: s.id,
        label: s.name,
        fullLabel: bName ? `${bName} — ${s.name}` : s.name,
      };
    });
  }, [effectiveWorkLocations, effectiveBranches]);

  const divisionOptions = useMemo<FilterOptionItem[]>(() => {
    const unique = Array.from(
      new Set(effectiveDivisions.filter(Boolean).map((d) => String(d).trim()))
    ).filter(Boolean);
    return unique.sort().map((d) => ({ id: d, label: d }));
  }, [effectiveDivisions]);

  const deptOptions = useMemo<FilterOptionItem[]>(() => {
    const unique = Array.from(
      new Set(effectiveDepts.filter(Boolean).map((d) => String(d).trim()))
    ).filter(Boolean);
    return unique.sort().map((d) => ({ id: d, label: d }));
  }, [effectiveDepts]);

  const positionOptions = useMemo<FilterOptionItem[]>(
    () => positions.filter(Boolean).map((p) => ({ id: p, label: p })),
    [positions]
  );

  const typeOptions = useMemo<FilterOptionItem[]>(
    () => employeeTypes.filter(Boolean).map((t) => ({ id: t, label: t.replace(/_/g, " ") })),
    [employeeTypes]
  );

  const levelOptions = useMemo<FilterOptionItem[]>(
    () => employeeLevels.filter(Boolean).map((l) => ({ id: l, label: l })),
    [employeeLevels]
  );

  const currentCategoryItems = useMemo<FilterOptionItem[]>(() => {
    switch (activeCategory) {
      case "bu":
        return buOptions;
      case "site":
        return siteOptions;
      case "division":
        return divisionOptions;
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
  }, [activeCategory, buOptions, siteOptions, divisionOptions, deptOptions, positionOptions, typeOptions, levelOptions]);

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
    setFilterWorkLocation(draftFilters.site.size > 0 ? Array.from(draftFilters.site).join(",") : "all");
    setFilterDivision(draftFilters.division.size > 0 ? Array.from(draftFilters.division).join(",") : "all");
    setFilterDepartment(draftFilters.department.size > 0 ? Array.from(draftFilters.department).join(",") : "all");
    setFilterRole(draftFilters.position.size > 0 ? Array.from(draftFilters.position).join(",") : "all");
    setFilterEmploymentType(draftFilters.employee_type.size > 0 ? Array.from(draftFilters.employee_type).join(",") : "all");
    setFilterEmployeeLevel(Array.from(draftFilters.employee_level).join(","));
    setIsOpen(false);
    onOpenChange?.(false);
  }, [
    draftFilters,
    setFilterBranch,
    setFilterWorkLocation,
    setFilterDivision,
    setFilterDepartment,
    setFilterRole,
    setFilterEmploymentType,
    setFilterEmployeeLevel,
    onOpenChange,
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
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          onOpenChange?.(next);
        }}
        className={`px-3 py-1 rounded-full border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
          isOpen || hasActiveFilter
            ? "border-[#253C7D] bg-[#253C7D] text-white shadow-xs"
            : "border-[#253C7D]/40 text-[#253C7D] bg-white dark:bg-slate-800 hover:bg-[#253C7D]/5"
        }`}
      >
        <span>Filter</span>
        <i className="ri-arrow-down-s-line text-xs opacity-90" />
      </button>

      {isOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute right-0 top-8 flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded shadow-xl z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          <AttendanceFilterFlyoutPanel
            items={currentCategoryItems}
            selectedSet={draftFilters[activeCategory]}
            onToggleItem={handleToggleItem}
            onToggleAll={handleToggleAll}
            onApply={handleApply}
            onReset={handleReset}
            categoryLabel={categories.find((c) => c.id === activeCategory)?.label}
          />

          <div className="w-36 py-1 bg-white dark:bg-slate-900">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onMouseEnter={() => setActiveCategory(cat.id)}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                    isActive
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
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
                  <i
                    className={`ri-arrow-left-s-fill text-xs transition-colors ${
                      isActive ? "text-slate-500" : "text-slate-300 dark:text-slate-600"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});

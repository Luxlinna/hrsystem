import { memo, useState, useMemo } from "react";
import type { AppRole, UserAssignment } from "../types";
import { RoleTreeNodeCard, type CategoryGroupData } from "./RoleTreeNodeCard";

interface RoleTreeOrgChartProps {
  categoryGroups: CategoryGroupData[];
  users: UserAssignment[];
  searchTerm: string;
  canManageRoles: boolean;
  onOpenNewRole: (categoryKey?: string) => void;
  onOpenEditRole: (role: AppRole) => void;
  onDeleteRole: (id: number) => void;
  onNavigateToUsers?: (roleName: string) => void;
}

export const RoleTreeOrgChart = memo(function RoleTreeOrgChart({
  categoryGroups,
  users,
  searchTerm,
  canManageRoles,
  onOpenNewRole,
  onOpenEditRole,
  onDeleteRole,
  onNavigateToUsers,
}: RoleTreeOrgChartProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});

  const toggleCollapse = (key: string) => {
    setCollapsedNodes((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(1.4, Math.max(0.65, +(prev + delta).toFixed(2))));
  };

  const resetZoom = () => setZoomLevel(1);

  const superAdminGroup = useMemo(() => categoryGroups.find((g) => g.meta.key === "super_admin"), [categoryGroups]);
  const chairpersonGroup = useMemo(() => categoryGroups.find((g) => g.meta.key === "chairperson"), [categoryGroups]);
  const adminGroup = useMemo(() => categoryGroups.find((g) => g.meta.key === "admin"), [categoryGroups]);
  const lineManagerGroup = useMemo(() => categoryGroups.find((g) => g.meta.key === "line_manager"), [categoryGroups]);
  const employeeGroup = useMemo(() => categoryGroups.find((g) => g.meta.key === "employee"), [categoryGroups]);

  const treeLevels = [
    { group: superAdminGroup, levelNumber: 1 },
    { group: chairpersonGroup, levelNumber: 2 },
    { group: adminGroup, levelNumber: 3 },
    { group: lineManagerGroup, levelNumber: 4 },
    { group: employeeGroup, levelNumber: 5 },
  ].filter((lvl): lvl is { group: CategoryGroupData; levelNumber: number } => Boolean(lvl.group));

  return (
    <div className="relative rounded-2xl border border-gray-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden shadow-xs">
      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-gray-200/80 dark:border-slate-700 shadow-sm">
        <button
          type="button"
          onClick={() => handleZoom(-0.1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
          title="Zoom out"
        >
          <i className="ri-subtract-line" />
        </button>
        <span className="text-[11px] font-mono font-bold px-1 text-gray-500 min-w-9 text-center">
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          type="button"
          onClick={() => handleZoom(0.1)}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 text-xs font-bold cursor-pointer"
          title="Zoom in"
        >
          <i className="ri-add-line" />
        </button>
        <div className="h-4 w-px bg-gray-200 dark:bg-slate-700 mx-0.5" />
        <button
          type="button"
          onClick={resetZoom}
          className="px-2 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 text-[10.5px] font-semibold cursor-pointer"
          title="Reset zoom"
        >
          Reset
        </button>
      </div>

      {/* Tree Visualization Area */}
      <div className="w-full overflow-x-auto min-h-[500px] p-8 sm:p-12 flex justify-center">
        <div
          className="transition-transform duration-150 origin-top flex flex-col items-center"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {treeLevels.map(({ group, levelNumber }, idx) => {
            const isLast = idx === treeLevels.length - 1;
            const isCollapsed = Boolean(collapsedNodes[group.meta.key]);

            return (
              <div key={group.meta.key} className="flex flex-col items-center">
                <RoleTreeNodeCard
                  group={group}
                  levelNumber={levelNumber}
                  users={users}
                  searchTerm={searchTerm}
                  isCollapsed={isCollapsed}
                  canManageRoles={canManageRoles}
                  onToggleCollapse={toggleCollapse}
                  onOpenNewRole={onOpenNewRole}
                  onOpenEditRole={onOpenEditRole}
                  onDeleteRole={onDeleteRole}
                  onNavigateToUsers={onNavigateToUsers}
                />

                {!isLast && !isCollapsed && (
                  <div className="flex flex-col items-center my-1">
                    <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />
                    <div className="w-2.5 h-2.5 rounded-full border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900" />
                    <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

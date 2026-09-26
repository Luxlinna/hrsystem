import { useState, memo } from "react";
import { useAttendanceScheduleMatrix } from "./useAttendanceScheduleMatrix";
import { ScheduleMatrixHeader } from "./ScheduleMatrixHeader";
import { ScheduleMatrixToolbar } from "./ScheduleMatrixToolbar";
import { ScheduleMatrixTable } from "./ScheduleMatrixTable";
import { ScheduleMatrixNoSchedules } from "./ScheduleMatrixNoSchedules";
import { ScheduleMatrixEditModal } from "./ScheduleMatrixEditModal";

interface AttendanceScheduleMatrixViewProps {
  onNavigateToTemplates?: () => void;
  onNavigateToShifts?: () => void;
  onViewModeChange?: (mode: string) => void;
}

export const AttendanceScheduleMatrixView = memo(function AttendanceScheduleMatrixView({
  onNavigateToTemplates,
  onNavigateToShifts,
  onViewModeChange,
}: AttendanceScheduleMatrixViewProps) {
  const {
    dateRangeLabel,
    prevMonth,
    nextMonth,
    dayColumns,
    availableShifts,
    scheduledEmployees,
    unscheduledEmployees,
    departmentList,
    search,
    setSearch,
    filterDept,
    setFilterDept,
    activeTab,
    setActiveTab,
    selectedIds,
    toggleSelectAll,
    toggleSelectOne,
    loading,
    handleUpdateCell,
  } = useAttendanceScheduleMatrix();

  const [hoveredCell, setHoveredCell] = useState<{
    empId: string;
    dateString: string;
    text: string;
    x: number;
    y: number;
  } | null>(null);

  const [editingCell, setEditingCell] = useState<{
    empId: string;
    empName: string;
    dateString: string;
    dayNumber: number;
    currentCode: string;
  } | null>(null);

  const handleCellClick = (empId: string, empName: string, dateString: string, dayNumber: number, currentCode: string) => {
    setEditingCell({ empId, empName, dateString, dayNumber, currentCode });
  };

  const handleSelectShift = (code: string) => {
    if (!editingCell) return;
    handleUpdateCell(editingCell.empId, editingCell.dateString, code);
    setEditingCell(null);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Tabs */}
      <ScheduleMatrixHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unscheduledCount={unscheduledEmployees.length}
        onNavigateToTemplates={onNavigateToTemplates}
        onNavigateToShifts={onNavigateToShifts}
      />

      {/* 2. Controls Toolbar */}
      <ScheduleMatrixToolbar
        search={search}
        setSearch={setSearch}
        dateRangeLabel={dateRangeLabel}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        filterDept={filterDept}
        setFilterDept={setFilterDept}
        departmentList={departmentList}
        onViewModeChange={onViewModeChange}
      />

      {/* 3. Matrix Table or No Schedules View */}
      {activeTab === "schedules" ? (
        <ScheduleMatrixTable
          loading={loading}
          dayColumns={dayColumns}
          scheduledEmployees={scheduledEmployees}
          selectedIds={selectedIds}
          toggleSelectAll={toggleSelectAll}
          toggleSelectOne={toggleSelectOne}
          onCellClick={handleCellClick}
          onCellHover={setHoveredCell}
        />
      ) : (
        <ScheduleMatrixNoSchedules onNavigateToTemplates={onNavigateToTemplates} />
      )}

      {/* 4. Hover Tooltip Overlay */}
      {hoveredCell && (
        <div
          style={{
            position: "fixed",
            left: `${hoveredCell.x}px`,
            top: `${hoveredCell.y - 8}px`,
            transform: "translate(-50%, -100%)",
            pointerEvents: "none",
          }}
          className="z-50 bg-[#1E293B] text-white px-2.5 py-1 rounded-md text-[11px] font-semibold shadow-xl border border-slate-700 animate-in fade-in duration-75 whitespace-nowrap"
        >
          {hoveredCell.text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1E293B]" />
        </div>
      )}

      {/* 5. Quick Shift Edit Modal */}
      <ScheduleMatrixEditModal
        editingCell={editingCell}
        availableShifts={availableShifts}
        onClose={() => setEditingCell(null)}
        onSelectShift={handleSelectShift}
      />
    </div>
  );
});

import { useState, memo } from "react";
import { useAttendanceScheduleMatrix } from "./useAttendanceScheduleMatrix";
import { ScheduleMatrixHeader } from "./ScheduleMatrixHeader";
import { ScheduleMatrixToolbar } from "./ScheduleMatrixToolbar";
import { ScheduleMatrixTable } from "./ScheduleMatrixTable";
import { ScheduleMatrixNoSchedules } from "./ScheduleMatrixNoSchedules";
import { ScheduleMatrixContextMenu, type ContextMenuTarget } from "./ScheduleMatrixContextMenu";
import { ScheduleMatrixModalsContainer } from "./ScheduleMatrixModalsContainer";
import type { MatrixViewMode } from "./types";

interface AttendanceScheduleMatrixViewProps {
  onNavigateToTemplates?: () => void;
  onNavigateToShifts?: () => void;
  onViewModeChange?: (mode: string) => void;
  onViewAttendanceLog?: (target: ContextMenuTarget) => void;
}

export const AttendanceScheduleMatrixView = memo(function AttendanceScheduleMatrixView({
  onNavigateToTemplates,
  onNavigateToShifts,
  onViewModeChange,
  onViewAttendanceLog,
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

  const [matrixViewMode, setMatrixViewMode] = useState<MatrixViewMode>("timesheet");
  const [hoveredCell, setHoveredCell] = useState<{ empId: string; dateString: string; text: string; x: number; y: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ position: { x: number; y: number }; target: ContextMenuTarget } | null>(null);
  const [editingCell, setEditingCell] = useState<{ empId: string; empName: string; dateString: string; dayNumber: number; currentCode: string } | null>(null);
  const [logModalTarget, setLogModalTarget] = useState<ContextMenuTarget | null>(null);
  const [leaveModal, setLeaveModal] = useState<{ target: ContextMenuTarget; mode: "self" | "for_employee" } | null>(null);
  const [missionModal, setMissionModal] = useState<{ target: ContextMenuTarget; mode: "self" | "for_employee" } | null>(null);

  const handleCellClick = (data: ContextMenuTarget & { x: number; y: number }) => {
    setContextMenu({ position: { x: data.x, y: data.y }, target: data });
  };

  const handleSelectShift = (code: string) => {
    if (!editingCell) return;
    handleUpdateCell(editingCell.empId, editingCell.dateString, code);
    setEditingCell(null);
  };

  return (
    <div className="space-y-4">
      <ScheduleMatrixHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unscheduledCount={unscheduledEmployees.length}
        onNavigateToTemplates={onNavigateToTemplates}
        onNavigateToShifts={onNavigateToShifts}
      />

      <ScheduleMatrixToolbar
        search={search}
        setSearch={setSearch}
        dateRangeLabel={dateRangeLabel}
        prevMonth={prevMonth}
        nextMonth={nextMonth}
        filterDept={filterDept}
        setFilterDept={setFilterDept}
        departmentList={departmentList}
        matrixViewMode={matrixViewMode}
        setMatrixViewMode={setMatrixViewMode}
        onViewModeChange={onViewModeChange}
      />

      {activeTab === "schedules" ? (
        <ScheduleMatrixTable
          loading={loading}
          dayColumns={dayColumns}
          scheduledEmployees={scheduledEmployees}
          selectedIds={selectedIds}
          matrixViewMode={matrixViewMode}
          toggleSelectAll={toggleSelectAll}
          toggleSelectOne={toggleSelectOne}
          onCellClick={handleCellClick}
          onCellHover={setHoveredCell}
        />
      ) : (
        <ScheduleMatrixNoSchedules
          unscheduledEmployees={unscheduledEmployees}
          onNavigateToTemplates={onNavigateToTemplates}
        />
      )}

      {hoveredCell && (
        <div
          style={{ position: "fixed", left: `${hoveredCell.x}px`, top: `${hoveredCell.y - 8}px`, transform: "translate(-50%, -100%)", pointerEvents: "none" }}
          className="z-50 bg-[#1E293B] text-white px-2.5 py-1 rounded-md text-[11px] font-semibold shadow-xl border border-slate-700 animate-in fade-in duration-75 whitespace-nowrap"
        >
          {hoveredCell.text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1E293B]" />
        </div>
      )}

      <ScheduleMatrixContextMenu
        position={contextMenu?.position || null}
        target={contextMenu?.target || null}
        onClose={() => setContextMenu(null)}
        onChangeShift={() => {
          if (contextMenu?.target) {
            setEditingCell({
              empId: contextMenu.target.empId, empName: contextMenu.target.empName,
              dateString: contextMenu.target.dateString, dayNumber: contextMenu.target.dayNumber,
              currentCode: contextMenu.target.currentCode,
            });
          }
        }}
        onViewAttendanceLog={() => {
          if (contextMenu?.target) {
            if (onViewAttendanceLog) onViewAttendanceLog(contextMenu.target);
            else setLogModalTarget(contextMenu.target);
          }
        }}
        onCreateLeave={(mode) => {
          if (contextMenu?.target) setLeaveModal({ target: contextMenu.target, mode });
        }}
        onCreateMission={(mode) => {
          if (contextMenu?.target) setMissionModal({ target: contextMenu.target, mode });
        }}
      />

      <ScheduleMatrixModalsContainer
        editingCell={editingCell}
        availableShifts={availableShifts}
        logModalTarget={logModalTarget}
        leaveModal={leaveModal}
        missionModal={missionModal}
        onCloseEdit={() => setEditingCell(null)}
        onSelectShift={handleSelectShift}
        onCloseLog={() => setLogModalTarget(null)}
        onCloseLeave={() => setLeaveModal(null)}
        onCloseMission={() => setMissionModal(null)}
      />
    </div>
  );
});

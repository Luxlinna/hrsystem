import { useShifts } from "./hooks/useShifts";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { ShiftHeader } from "./components/ShiftHeader";
import { ShiftStatsBar } from "./components/ShiftStatsBar";
import { ShiftToolbar } from "./components/ShiftToolbar";
import { BulkActionBar } from "./components/BulkActionBar";
import { DepartmentLegend } from "./components/DepartmentLegend";
import { WeekView } from "./components/WeekView";
import { DayView } from "./components/DayView";
import { ListView } from "./components/ListView";
import { MonthView } from "./components/MonthView";
import { ShiftDetailDrawer } from "./components/drawers/ShiftDetailDrawer";
import { ShiftModalsContainer } from "./components/modals/ShiftModalsContainer";

export default function Shifts() {
  const shiftsState = useShifts();

  if (shiftsState.loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (shiftsState.isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] p-6 lg:p-10">
        <PartnerBranchPrivacyShield
          moduleName="Shift Schedules"
          userBranchName={shiftsState.userBranchName}
          hasNoBranch={!shiftsState.userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Main Content Area */}
      <div className={`flex-1 min-w-0 transition-all duration-200 ${shiftsState.selectedShift ? "sm:mr-[380px] lg:mr-[400px]" : ""}`}>
        <div className="p-6 lg:p-10">
          <ShiftHeader
            kpiTotalShiftsThisWeek={shiftsState.kpiTotalShiftsThisWeek}
            kpiTotalWeeklyHours={shiftsState.kpiTotalWeeklyHours}
            kpiCoveragePercentage={shiftsState.kpiCoveragePercentage}
            weekDates={shiftsState.weekDates}
            weekShiftsCount={shiftsState.weekShifts.length}
            onOpenWorkload={() => shiftsState.setShowWorkloadDrawer(true)}
            onOpenCopyWeek={() => shiftsState.setShowCopyWeekModal(true)}
            onExportCSV={shiftsState.handleExportCSV}
            onOpenCreate={() => shiftsState.openCreateModal()}
          />

          <ShiftStatsBar
            kpiTotalShiftsThisWeek={shiftsState.kpiTotalShiftsThisWeek}
            kpiCoveragePercentage={shiftsState.kpiCoveragePercentage}
            kpiTotalOpenSpots={shiftsState.kpiTotalOpenSpots}
            kpiTotalWeeklyAssigned={shiftsState.kpiTotalWeeklyAssigned}
            kpiTotalWeeklyCapacity={shiftsState.kpiTotalWeeklyCapacity}
            kpiTotalWeeklyHours={shiftsState.kpiTotalWeeklyHours}
            totalShiftsCount={shiftsState.shifts.length}
            branchesCount={shiftsState.branches.length}
          />

          <ShiftToolbar
            viewMode={shiftsState.viewMode}
            setViewMode={shiftsState.setViewMode}
            density={shiftsState.density}
            setDensity={shiftsState.setDensity}
            currentDate={shiftsState.currentDate}
            weekDates={shiftsState.weekDates}
            searchQuery={shiftsState.searchQuery}
            setSearchQuery={shiftsState.setSearchQuery}
            filterBranch={shiftsState.filterBranch}
            setFilterBranch={shiftsState.setFilterBranch}
            filterDept={shiftsState.filterDept}
            setFilterDept={shiftsState.setFilterDept}
            branches={shiftsState.branches}
            departments={shiftsState.departments}
            quickFilter={shiftsState.quickFilter}
            setQuickFilter={shiftsState.setQuickFilter}
            totalShiftsCount={shiftsState.shifts.length}
            totalOpenShiftsCount={shiftsState.totalOpenShiftsCount}
            totalFilledShiftsCount={shiftsState.totalFilledShiftsCount}
            navigatePrev={shiftsState.navigatePrev}
            navigateNext={shiftsState.navigateNext}
            navigateToday={shiftsState.navigateToday}
            clearFilters={shiftsState.clearFilters}
          />

          <BulkActionBar
            count={shiftsState.selectedShiftIds.length}
            onBulkDelete={shiftsState.handleBulkDelete}
            onDeselect={() => shiftsState.setSelectedShiftIds([])}
          />

          {shiftsState.viewMode === "week" && (
            <WeekView
              weekDates={shiftsState.weekDates}
              getShiftsForDay={shiftsState.getShiftsForDay}
              getDaySummary={shiftsState.getDaySummary}
              assignments={shiftsState.assignments}
              selectedShift={shiftsState.selectedShift}
              setSelectedShift={shiftsState.setSelectedShift}
              setShowAssignModal={shiftsState.setShowAssignModal}
              openEditModal={shiftsState.openEditModal}
              quickDuplicateToNextDay={shiftsState.quickDuplicateToNextDay}
              openCreateModal={shiftsState.openCreateModal}
              density={shiftsState.density}
            />
          )}

          {shiftsState.viewMode === "day" && (
            <DayView
              currentDate={shiftsState.currentDate}
              dayShifts={shiftsState.getShiftsForDay(shiftsState.currentDate)}
              assignments={shiftsState.assignments}
              selectedShift={shiftsState.selectedShift}
              setSelectedShift={shiftsState.setSelectedShift}
              setShowAssignModal={shiftsState.setShowAssignModal}
              openCreateModal={shiftsState.openCreateModal}
            />
          )}

          {shiftsState.viewMode === "list" && (
            <ListView
              filteredShifts={shiftsState.filteredShifts}
              selectedShift={shiftsState.selectedShift}
              setSelectedShift={shiftsState.setSelectedShift}
              selectedShiftIds={shiftsState.selectedShiftIds}
              setSelectedShiftIds={shiftsState.setSelectedShiftIds}
              setShowAssignModal={shiftsState.setShowAssignModal}
              openEditModal={shiftsState.openEditModal}
            />
          )}

          {shiftsState.viewMode === "month" && (
            <MonthView
              currentDate={shiftsState.currentDate}
              filteredShifts={shiftsState.filteredShifts}
              setCurrentDate={shiftsState.setCurrentDate}
              setViewMode={shiftsState.setViewMode}
            />
          )}

          <DepartmentLegend />
        </div>
      </div>

      <ShiftDetailDrawer
        selectedShift={shiftsState.selectedShift}
        onClose={() => shiftsState.setSelectedShift(null)}
        onOpenEdit={shiftsState.openEditModal}
        onOpenDuplicate={shiftsState.openDuplicateModal}
        onOpenDeleteConfirm={() => shiftsState.setShowDeleteConfirm(true)}
        onOpenAssign={() => shiftsState.setShowAssignModal(true)}
        selectedShiftAssignments={shiftsState.selectedShiftAssignments}
        remainingSpots={shiftsState.remainingSpots}
        isSelectedShiftFull={shiftsState.isSelectedShiftFull}
        checkEmployeeConflict={shiftsState.checkEmployeeConflict}
        removeAssignment={shiftsState.removeAssignment}
      />

      <ShiftModalsContainer shiftsState={shiftsState} />
    </div>
  );
}
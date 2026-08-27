import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarStatsRow } from "./components/CalendarStatsRow";
import { CalendarFilterBar } from "./components/CalendarFilterBar";
import { MonthViewContent } from "./components/month/MonthViewContent";
import { TimelineViewContent } from "./components/timeline/TimelineViewContent";
import { AgendaViewContent } from "./components/agenda/AgendaViewContent";
import { DepartmentImpactWidget } from "./components/widgets/DepartmentImpactWidget";
import { UpcomingLeavesWidget } from "./components/widgets/UpcomingLeavesWidget";
import { QuickRequestModal } from "./components/modals/QuickRequestModal";
import { LeaveInspectModal } from "./components/modals/LeaveInspectModal";
import { DayLeavesModal } from "./components/modals/DayLeavesModal";
import { useLeaveCalendar } from "./hooks/useLeaveCalendar";
import { exportCalendarCSV } from "./exportUtils";

export default function LeaveCalendar() {
  const {
    canManage,
    employees,
    myEmployee,
    loading,
    year,
    month,
    selectedDay,
    setSelectedDay,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    deptFilter,
    setDeptFilter,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    agendaPage,
    setAgendaPage,
    agendaPageSize,
    departments,
    filteredLeaves,
    totalAgendaPages,
    safeAgendaPage,
    pagedAgendaLeaves,
    calCells,
    isCurrentDayToday,
    prevMonth,
    nextMonth,
    jumpToToday,
    selectedDayLeaves,
    getDayLeaves,
    leavesToday,
    approvedInMonth,
    totalDaysInMonth,
    pendingLeaves,
    upcomingLeaves,
    departmentStats,
    inspectLeave,
    setInspectLeave,
    dayLeavesModal,
    setDayLeavesModal,
    showRequestModal,
    setShowRequestModal,
    formData,
    setFormData,
    submitting,
    handleQuickRequestSubmit,
    toast,
  } = useLeaveCalendar();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleExportCSV = () => {
    exportCalendarCSV(filteredLeaves, month, year);
  };

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto sm:max-w-sm z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md text-[13px] font-medium transition-all transform animate-in slide-in-from-top-4 duration-200 ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-700/50 text-emerald-100"
              : toast.type === "error"
              ? "bg-rose-950/90 border-rose-700/50 text-rose-100"
              : "bg-slate-900/90 border-slate-700/50 text-white"
          }`}
        >
          <i
            className={`${
              toast.type === "success"
                ? "ri-checkbox-circle-fill text-emerald-400"
                : toast.type === "error"
                ? "ri-error-warning-fill text-rose-400"
                : "ri-information-fill text-sky-400"
            } text-lg`}
          />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <CalendarHeader
        viewMode={viewMode}
        setViewMode={setViewMode}
        onExportCSV={handleExportCSV}
        onOpenQuickRequest={() => setShowRequestModal(true)}
      />

      {/* Stats Row */}
      <CalendarStatsRow
        leavesTodayCount={leavesToday.length}
        approvedInMonthCount={approvedInMonth.length}
        totalDaysInMonth={totalDaysInMonth}
        pendingLeavesCount={pendingLeaves.length}
        month={month}
        onFilterStatus={setStatusFilter}
      />

      {/* Filter Bar */}
      <CalendarFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        deptFilter={deptFilter}
        setDeptFilter={setDeptFilter}
        typeFilter={typeFilter}
        setTypeFilter={setTypeFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        departments={departments}
      />

      {/* View 1: Month Matrix */}
      {viewMode === "month" && (
        <MonthViewContent
          month={month}
          year={year}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onJumpToToday={jumpToToday}
          calCells={calCells}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
          getDayLeaves={getDayLeaves}
          isCurrentDayToday={isCurrentDayToday}
          selectedDayLeaves={selectedDayLeaves}
          onInspectLeave={setInspectLeave}
          onOpenDayLeavesModal={(day, leaves) => setDayLeavesModal({ day, leaves })}
          onOpenQuickRequest={() => setShowRequestModal(true)}
        />
      )}

      {/* View 2: Horizontal Timeline Gantt */}
      {viewMode === "timeline" && (
        <TimelineViewContent
          employees={employees}
          filteredLeaves={filteredLeaves}
          year={year}
          month={month}
          daysInMonth={calCells.filter((c) => c !== 0).length}
          onInspectLeave={setInspectLeave}
          onPrevMonth={prevMonth}
          onNextMonth={nextMonth}
          onJumpToToday={jumpToToday}
        />
      )}

      {/* View 3: Agenda List / Table */}
      {viewMode === "agenda" && (
        <AgendaViewContent
          leaves={pagedAgendaLeaves}
          totalRows={filteredLeaves.length}
          safeAgendaPage={safeAgendaPage}
          totalAgendaPages={totalAgendaPages}
          setAgendaPage={setAgendaPage}
          agendaPageSize={agendaPageSize}
          onInspectLeave={setInspectLeave}
        />
      )}

      {/* Analytical Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentImpactWidget departmentStats={departmentStats} month={month} />
        <UpcomingLeavesWidget upcomingLeaves={upcomingLeaves} onInspectLeave={setInspectLeave} />
      </div>

      {/* Quick Request Modal */}
      <QuickRequestModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        formData={formData}
        setFormData={setFormData}
        employees={employees}
        myEmployee={myEmployee}
        canManage={canManage}
        submitting={submitting}
        onSubmit={handleQuickRequestSubmit}
      />

      {/* Leave Detail Inspect Modal */}
      <LeaveInspectModal
        inspectLeave={inspectLeave}
        onClose={() => setInspectLeave(null)}
      />

      {/* Day Leaves Expanded Popup */}
      <DayLeavesModal
        dayLeavesModal={dayLeavesModal}
        onClose={() => setDayLeavesModal(null)}
        month={month}
        year={year}
        onInspectLeave={setInspectLeave}
      />
    </div>
  );
}
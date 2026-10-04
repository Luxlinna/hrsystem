import { useCallback } from "react";
import { CalendarHeader } from "./components/CalendarHeader";
import { CalendarStatsRow } from "./components/CalendarStatsRow";
import { CalendarFilterBar } from "./components/CalendarFilterBar";
import { MonthViewContent } from "./components/month/MonthViewContent";
import { TimelineViewContent } from "./components/timeline/TimelineViewContent";
import { AgendaViewContent } from "./components/agenda/AgendaViewContent";
import { DepartmentImpactWidget } from "./components/widgets/DepartmentImpactWidget";
import { UpcomingLeavesWidget } from "./components/widgets/UpcomingLeavesWidget";
import { LeaveCalendarModalsContainer } from "./components/modals/LeaveCalendarModalsContainer";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { useLeaveCalendar } from "./hooks/useLeaveCalendar";

export default function LeaveCalendar() {
  const c = useLeaveCalendar();

  if (c.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (c.isPartnerBranchBlocked) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
        <CalendarHeader
          viewMode={c.viewMode}
          setViewMode={c.setViewMode}
          filteredLeaves={[]}
          month={c.month}
          year={c.year}
          onOpenQuickRequest={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Leave Schedule Calendar"
          userBranchName={c.userBranchName}
          hasNoBranch={!c.userBranchId}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
      {c.toast && (
        <div
          className={`fixed top-4 left-4 right-4 sm:top-6 sm:right-6 sm:left-auto sm:max-w-sm z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border backdrop-blur-md text-[13px] font-medium transition-all transform animate-in slide-in-from-top-4 duration-200 ${
            c.toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-700/50 text-emerald-100"
              : c.toast.type === "error"
              ? "bg-rose-950/90 border-rose-700/50 text-rose-100"
              : "bg-slate-900/90 border-slate-700/50 text-white"
          }`}
        >
          <i
            className={`${
              c.toast.type === "success"
                ? "ri-checkbox-circle-fill text-emerald-400"
                : c.toast.type === "error"
                ? "ri-error-warning-fill text-rose-400"
                : "ri-information-fill text-sky-400"
            } text-lg`}
          />
          <span>{c.toast.message}</span>
        </div>
      )}

      <CalendarHeader
        viewMode={c.viewMode}
        setViewMode={c.setViewMode}
        filteredLeaves={c.filteredLeaves}
        month={c.month}
        year={c.year}
        onOpenQuickRequest={() => c.setShowRequestModal(true)}
      />

      <CalendarStatsRow
        leavesTodayCount={c.leavesToday.length}
        approvedInMonthCount={c.approvedInMonth.length}
        totalDaysInMonth={c.totalDaysInMonth}
        pendingLeavesCount={c.pendingLeaves.length}
        month={c.month}
        onFilterStatus={c.setStatusFilter}
      />

      <CalendarFilterBar
        searchQuery={c.searchQuery}
        setSearchQuery={c.setSearchQuery}
        deptFilter={c.deptFilter}
        setDeptFilter={c.setDeptFilter}
        typeFilter={c.typeFilter}
        setTypeFilter={c.setTypeFilter}
        statusFilter={c.statusFilter}
        setStatusFilter={c.setStatusFilter}
        departments={c.departments}
      />

      {c.viewMode === "month" && (
        <MonthViewContent
          month={c.month}
          year={c.year}
          onPrevMonth={c.prevMonth}
          onNextMonth={c.nextMonth}
          onJumpToToday={c.jumpToToday}
          calCells={c.calCells}
          selectedDay={c.selectedDay}
          onSelectDay={c.setSelectedDay}
          getDayLeaves={c.getDayLeaves}
          isCurrentDayToday={c.isCurrentDayToday}
          selectedDayLeaves={c.selectedDayLeaves}
          onInspectLeave={c.setInspectLeave}
          onOpenDayLeavesModal={(day, leaves) => c.setDayLeavesModal({ day, leaves })}
          onOpenQuickRequest={() => c.setShowRequestModal(true)}
        />
      )}

      {c.viewMode === "timeline" && (
        <TimelineViewContent
          employees={c.employees}
          filteredLeaves={c.filteredLeaves}
          year={c.year}
          month={c.month}
          daysInMonth={c.calCells.filter((cell) => cell !== 0).length}
          onInspectLeave={c.setInspectLeave}
          onPrevMonth={c.prevMonth}
          onNextMonth={c.nextMonth}
          onJumpToToday={c.jumpToToday}
        />
      )}

      {c.viewMode === "agenda" && (
        <AgendaViewContent
          leaves={c.pagedAgendaLeaves}
          totalRows={c.filteredLeaves.length}
          safeAgendaPage={c.safeAgendaPage}
          totalAgendaPages={c.totalAgendaPages}
          setAgendaPage={c.setAgendaPage}
          agendaPageSize={c.agendaPageSize}
          onInspectLeave={c.setInspectLeave}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DepartmentImpactWidget departmentStats={c.departmentStats} month={c.month} />
        <UpcomingLeavesWidget upcomingLeaves={c.upcomingLeaves} onInspectLeave={c.setInspectLeave} />
      </div>

      <LeaveCalendarModalsContainer {...c} />
    </div>
  );
}
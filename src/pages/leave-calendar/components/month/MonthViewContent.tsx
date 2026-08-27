import { memo } from "react";
import type { LeaveRequest } from "../../types";
import { MonthNavigator } from "./MonthNavigator";
import { MonthCalendarGrid } from "./MonthCalendarGrid";
import { MonthSelectedDayAgenda } from "./MonthSelectedDayAgenda";

interface MonthViewContentProps {
  month: number;
  year: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onJumpToToday: () => void;
  calCells: number[];
  selectedDay: number | null;
  onSelectDay: (d: number) => void;
  getDayLeaves: (d: number) => LeaveRequest[];
  isCurrentDayToday: (d: number) => boolean;
  selectedDayLeaves: LeaveRequest[];
  onInspectLeave: (l: LeaveRequest) => void;
  onOpenDayLeavesModal: (day: number, leaves: LeaveRequest[]) => void;
  onOpenQuickRequest: () => void;
}

export const MonthViewContent = memo(function MonthViewContent({
  month,
  year,
  onPrevMonth,
  onNextMonth,
  onJumpToToday,
  calCells,
  selectedDay,
  onSelectDay,
  getDayLeaves,
  isCurrentDayToday,
  selectedDayLeaves,
  onInspectLeave,
  onOpenDayLeavesModal,
  onOpenQuickRequest,
}: MonthViewContentProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Grid (2 Cols) */}
      <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/80 p-5 sm:p-6 shadow-2xs">
        <MonthNavigator
          month={month}
          year={year}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onJumpToToday={onJumpToToday}
        />

        <MonthCalendarGrid
          calCells={calCells}
          selectedDay={selectedDay}
          onSelectDay={onSelectDay}
          getDayLeaves={getDayLeaves}
          isCurrentDayToday={isCurrentDayToday}
          onInspectLeave={onInspectLeave}
          onOpenDayLeavesModal={onOpenDayLeavesModal}
        />
      </div>

      {/* Selected Day Agenda (1 Col) */}
      <MonthSelectedDayAgenda
        selectedDay={selectedDay}
        month={month}
        year={year}
        selectedDayLeaves={selectedDayLeaves}
        onInspectLeave={onInspectLeave}
        onOpenQuickRequest={onOpenQuickRequest}
      />
    </div>
  );
});

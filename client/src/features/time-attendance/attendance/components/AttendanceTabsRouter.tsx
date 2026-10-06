import { memo, type ComponentProps } from "react";
import { AttendanceScheduleMatrixView } from "./schedule-matrix/AttendanceScheduleMatrixView";
import { ScheduleTemplatesView } from "./schedule-templates/ScheduleTemplatesView";
import { ShiftsListView } from "./shifts-manager/ShiftsListView";
import { AttendanceLogsTabView } from "../tabs/AttendanceLogsTabView";
import { StandardWorkingHoursTabView } from "../tabs/StandardWorkingHoursTabView";

interface Props {
  activeMainTab: "attendance" | "attendance-schedule" | "schedule-templates" | "shifts" | "working-hours";
  onTabChange: (tab: "attendance" | "attendance-schedule" | "schedule-templates" | "shifts" | "working-hours") => void;
  scheduleTemplates: any;
  shiftsManager: any;
  logsProps: ComponentProps<typeof AttendanceLogsTabView>;
  onViewAttendanceLog?: (target: any) => void;
  slideDirection?: "next" | "prev";
}

export const AttendanceTabsRouter = memo(function AttendanceTabsRouter({
  activeMainTab,
  onTabChange,
  scheduleTemplates,
  shiftsManager,
  logsProps,
  onViewAttendanceLog,
  slideDirection = "next",
}: Props) {
  let content = null;

  if (activeMainTab === "attendance-schedule") {
    content = (
      <AttendanceScheduleMatrixView
        onNavigateToTemplates={() => onTabChange("schedule-templates")}
        onNavigateToShifts={() => onTabChange("shifts")}
        onViewAttendanceLog={onViewAttendanceLog}
      />
    );
  } else if (activeMainTab === "schedule-templates") {
    content = (
      <ScheduleTemplatesView
        templates={scheduleTemplates.templates}
        onCreateNew={() => scheduleTemplates.setActiveFormTemplate("new")}
        onEdit={(t) => scheduleTemplates.setActiveFormTemplate(t)}
        onDelete={scheduleTemplates.handleDeleteTemplate}
        onToggleStatus={scheduleTemplates.handleToggleStatus}
        onDuplicate={scheduleTemplates.handleDuplicateTemplate}
        onNavigateToShifts={() => onTabChange("shifts")}
        onNavigateToLateEarly={() => onTabChange("shifts")}
      />
    );
  } else if (activeMainTab === "shifts") {
    content = (
      <ShiftsListView
        shifts={shiftsManager.shifts}
        onCreateNew={() => shiftsManager.setActiveFormShift("new")}
        onEdit={(s) => shiftsManager.setActiveFormShift(s)}
        onDelete={shiftsManager.handleDeleteShift}
        onDuplicate={shiftsManager.handleDuplicateShift}
        onNavigateToScheduleTemplates={() => onTabChange("schedule-templates")}
        onNavigateToLateEarly={() => {}}
      />
    );
  } else if (activeMainTab === "working-hours") {
    content = <StandardWorkingHoursTabView canManage={logsProps.canManage} />;
  } else {
    content = <AttendanceLogsTabView {...logsProps} />;
  }

  return (
    <div
      key={activeMainTab}
      className={`w-full max-w-full overflow-x-hidden ${
        slideDirection === "prev" ? "animate-cover-slide-left" : "animate-cover-slide-right"
      }`}
    >
      {content}
    </div>
  );
});

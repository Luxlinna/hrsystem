import { memo, type ComponentProps } from "react";
import { AttendanceScheduleMatrixView } from "./schedule-matrix/AttendanceScheduleMatrixView";
import { ScheduleTemplatesView } from "./schedule-templates/ScheduleTemplatesView";
import { ShiftsListView } from "./shifts-manager/ShiftsListView";
import { AttendanceLogsTabView } from "../tabs/AttendanceLogsTabView";

interface Props {
  activeMainTab: "attendance" | "attendance-schedule" | "schedule-templates" | "shifts";
  onTabChange: (tab: "attendance" | "attendance-schedule" | "schedule-templates" | "shifts") => void;
  scheduleTemplates: any;
  shiftsManager: any;
  logsProps: ComponentProps<typeof AttendanceLogsTabView>;
  onViewAttendanceLog?: (target: any) => void;
}

export const AttendanceTabsRouter = memo(function AttendanceTabsRouter({
  activeMainTab,
  onTabChange,
  scheduleTemplates,
  shiftsManager,
  logsProps,
  onViewAttendanceLog,
}: Props) {
  if (activeMainTab === "attendance-schedule") {
    return (
      <AttendanceScheduleMatrixView
        onNavigateToTemplates={() => onTabChange("schedule-templates")}
        onNavigateToShifts={() => onTabChange("shifts")}
        onViewAttendanceLog={onViewAttendanceLog}
      />
    );
  }

  if (activeMainTab === "schedule-templates") {
    return (
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
  }

  if (activeMainTab === "shifts") {
    return (
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
  }

  return <AttendanceLogsTabView {...logsProps} />;
});

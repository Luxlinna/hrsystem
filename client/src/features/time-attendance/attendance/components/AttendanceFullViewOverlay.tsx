import { memo } from "react";
import type { AttendanceRecord, Employee, WorkLocation } from "../types";
import { AttendanceHeader } from "./AttendanceHeader";
import { PartnerBranchPrivacyShield } from "@/components/PartnerBranchPrivacyShield";
import { CreateTimeLogForm } from "./CreateTimeLogForm";
import { CreateScheduleTemplateForm } from "./schedule-templates/CreateScheduleTemplateForm";
import { CreateShiftManagerForm } from "./shifts-manager/CreateShiftManagerForm";
import { ViewTimeLogDetailView } from "./ViewTimeLogDetailView";

interface Props {
  loading: boolean;
  hasRecords: boolean;
  isPartnerBranchBlocked: boolean;
  currentTime: Date;
  activeTab?: any;
  dateRangeBounds: any;
  userBranchName?: string;
  userBranchId?: string | null;
  showTimeLogForm: boolean;
  onCloseTimeLog: () => void;
  employees: Employee[];
  workLocations: WorkLocation[];
  timeLogInitialEmployeeId?: string;
  canViewAll: boolean;
  myEmployee: Employee | null;
  onRefreshData: () => void;
  scheduleTemplates: any;
  shiftsManager: any;
  selectedRecord: AttendanceRecord | null;
  onCloseRecordDetail: () => void;
  onEditRecord: (r: AttendanceRecord) => void;
  onDeleteRecord: (id: number) => void;
}

export const AttendanceFullViewOverlay = memo(function AttendanceFullViewOverlay({
  loading,
  hasRecords,
  isPartnerBranchBlocked,
  currentTime,
  activeTab,
  dateRangeBounds,
  userBranchName,
  userBranchId,
  showTimeLogForm,
  onCloseTimeLog,
  employees,
  workLocations,
  timeLogInitialEmployeeId,
  canViewAll,
  myEmployee,
  onRefreshData,
  scheduleTemplates,
  shiftsManager,
  selectedRecord,
  onCloseRecordDetail,
  onEditRecord,
  onDeleteRecord,
}: Props) {
  if (loading && !hasRecords) {
    return (
      <div className="attendance-hub min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading attendance control center...</p>
      </div>
    );
  }

  if (isPartnerBranchBlocked) {
    return (
      <div className="attendance-hub min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
        <AttendanceHeader
          currentTime={currentTime}
          activeTab={activeTab}
          dateRangeBounds={dateRangeBounds}
          canViewAll={false}
          hasEmployee={false}
          onExportCSV={() => {}}
          onOpenLogModal={() => {}}
        />
        <PartnerBranchPrivacyShield
          moduleName="Time & Attendance"
          userBranchName={userBranchName}
          hasNoBranch={!userBranchId}
        />
      </div>
    );
  }

  if (showTimeLogForm) {
    return (
      <CreateTimeLogForm
        onBack={onCloseTimeLog}
        employees={employees}
        workLocations={workLocations}
        initialEmployeeId={timeLogInitialEmployeeId}
        isEmployeeFixed={!canViewAll && !!myEmployee}
        onSaved={onRefreshData}
        activeBranchId={userBranchId || null}
      />
    );
  }

  if (scheduleTemplates.activeFormTemplate !== null) {
    return (
      <CreateScheduleTemplateForm
        initialData={typeof scheduleTemplates.activeFormTemplate === "object" ? scheduleTemplates.activeFormTemplate : null}
        employees={employees}
        workLocations={workLocations}
        shifts={shiftsManager.shifts}
        onBack={() => scheduleTemplates.setActiveFormTemplate(null)}
        onSave={scheduleTemplates.handleSaveTemplate}
      />
    );
  }

  if (shiftsManager.activeFormShift !== null) {
    return (
      <CreateShiftManagerForm
        initialData={typeof shiftsManager.activeFormShift === "object" ? shiftsManager.activeFormShift : null}
        onBack={() => shiftsManager.setActiveFormShift(null)}
        onSave={shiftsManager.handleSaveShift}
      />
    );
  }

  if (selectedRecord !== null) {
    return (
      <ViewTimeLogDetailView
        record={selectedRecord}
        onBack={onCloseRecordDetail}
        onEdit={(r) => {
          onCloseRecordDetail();
          onEditRecord(r);
        }}
        onDelete={(id) => {
          onCloseRecordDetail();
          onDeleteRecord(id);
        }}
      />
    );
  }

  return null;
});

import { memo } from "react";
import type { AttendanceRecord, Employee, WorkLocation, NewRecordForm } from "../types";
import { RecordDetailsDrawer } from "./RecordDetailsDrawer";
import { LogAttendanceModal } from "./LogAttendanceModal";
import { EditAttendanceModal } from "./EditAttendanceModal";
import { OvertimeSettingsModal } from "./overtime/OvertimeSettingsModal";

interface AttendanceModalsProps {
  selectedRecord: AttendanceRecord | null;
  setSelectedRecord: (r: AttendanceRecord | null) => void;
  editingRecord: AttendanceRecord | null;
  setEditingRecord: (r: AttendanceRecord | null) => void;
  showLogModal: boolean;
  setShowLogModal: (show: boolean) => void;
  newRecord: NewRecordForm;
  setNewRecord: React.Dispatch<React.SetStateAction<NewRecordForm>>;
  canManage: boolean;
  employees: Employee[];
  workLocations: WorkLocation[];
  myEmployee: Employee | null;
  saving: boolean;
  onSaveNewRecord: (e: React.FormEvent) => void;
  onUpdateRecord: (e: React.FormEvent) => void;
  onDeleteRecord: (id: number) => void;
  canManageSettings?: boolean;
  showOvertimeSettings?: boolean;
  onCloseOvertimeSettings?: () => void;
}

export const AttendanceModals = memo(function AttendanceModals({
  selectedRecord,
  setSelectedRecord,
  editingRecord,
  setEditingRecord,
  showLogModal,
  setShowLogModal,
  newRecord,
  setNewRecord,
  canManage,
  canManageSettings,
  employees,
  workLocations,
  myEmployee,
  saving,
  onSaveNewRecord,
  onUpdateRecord,
  onDeleteRecord,
  showOvertimeSettings = false,
  onCloseOvertimeSettings,
}: AttendanceModalsProps) {
  return (
    <>
      <RecordDetailsDrawer
        selectedRecord={selectedRecord}
        onClose={() => setSelectedRecord(null)}
        canManage={canManage}
        onOpenEditModal={setEditingRecord}
        onDeleteRecord={onDeleteRecord}
      />

      <LogAttendanceModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        canManage={canManage}
        employees={employees}
        workLocations={workLocations}
        myEmployee={myEmployee}
        newRecord={newRecord}
        setNewRecord={setNewRecord}
        saving={saving}
        onSubmit={onSaveNewRecord}
      />

      <EditAttendanceModal
        editingRecord={editingRecord}
        setEditingRecord={setEditingRecord}
        workLocations={workLocations}
        saving={saving}
        onClose={() => setEditingRecord(null)}
        onSubmit={onUpdateRecord}
      />

      <OvertimeSettingsModal
        isOpen={!!showOvertimeSettings}
        onClose={() => onCloseOvertimeSettings?.()}
        canManage={canManageSettings ?? canManage}
      />
    </>
  );
});

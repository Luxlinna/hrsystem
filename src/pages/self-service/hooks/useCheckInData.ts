import { useCheckInScheduleAndData } from "./useCheckInScheduleAndData";
import { useCheckInCalculations } from "./useCheckInCalculations";
import { useCheckInMutations } from "./useCheckInMutations";

interface Props {
  employeeId: string;
  employeeName: string;
  autoStart?: boolean;
  autoCheckOut?: boolean;
}

export function useCheckInData({ employeeId, employeeName, autoStart, autoCheckOut }: Props) {
  const data = useCheckInScheduleAndData({ employeeId });

  const calcs = useCheckInCalculations({
    records: data.records,
    todayRecord: data.todayRecord,
    currentTime: data.currentTime,
    today: data.today,
    scheduleSettings: data.scheduleSettings,
    workStartTime: data.workStartTime,
    workEndTime: data.workEndTime,
  });

  const mutations = useCheckInMutations({
    employeeId,
    employeeName,
    autoStart,
    autoCheckOut,
    today: data.today,
    todayRecord: data.todayRecord,
    loading: data.loading,
    branch: data.branch,
    branchLoading: data.branchLoading,
    scheduleSettings: data.scheduleSettings,
    daySchedule: data.daySchedule,
    workStartTime: data.workStartTime,
    workEndTime: data.workEndTime,
    defaultWorkLocationId: data.defaultWorkLocationId,
    todayOutsideWork: data.todayOutsideWork,
    currentTime: data.currentTime,
    isCheckedIn: calcs.isCheckedIn,
    isCheckedOut: calcs.isCheckedOut,
    isEarlyCheckoutNow: calcs.isEarlyCheckoutNow,
    loadRecords: data.loadRecords,
  });

  return {
    records: data.records,
    todayRecord: data.todayRecord,
    loading: data.loading,
    currentTime: data.currentTime,
    branch: data.branch,
    branchLoading: data.branchLoading,
    scheduleSettings: data.scheduleSettings,
    activeOutsideWork: data.activeOutsideWork,
    todayOutsideWork: data.todayOutsideWork,
    workStartTime: data.workStartTime,
    workEndTime: data.workEndTime,
    daySchedule: data.daySchedule,

    processing: mutations.processing,
    toast: mutations.toast,
    notes: mutations.notes,
    setNotes: mutations.setNotes,
    earlyCheckoutReason: mutations.earlyCheckoutReason,
    setEarlyCheckoutReason: mutations.setEarlyCheckoutReason,
    checkInStep: mutations.checkInStep,
    checkInMessage: mutations.checkInMessage,
    handleRequestClockIn: mutations.handleRequestClockIn,
    handleConfirmClockIn: mutations.handleConfirmClockIn,
    handleClockIn: mutations.handleClockIn,
    handleClockOut: mutations.handleClockOut,
    resetCheckInFlow: mutations.resetCheckInFlow,

    isCheckedIn: calcs.isCheckedIn,
    isCheckedOut: calcs.isCheckedOut,
    earlyCheckoutMinutesNow: calcs.earlyCheckoutMinutesNow,
    isEarlyCheckoutNow: calcs.isEarlyCheckoutNow,
    past7Days: calcs.past7Days,

    presentCount: calcs.presentCount,
    lateCount: calcs.lateCount,
    earlyLeaveCount: calcs.earlyLeaveCount,
    absentCount: calcs.absentCount,
    totalHours: calcs.totalHours,
    daysWithHours: calcs.daysWithHours,
    avgHours: calcs.avgHours,
    punctuality: calcs.punctuality,
    elapsedHours: calcs.elapsedHours,
    shiftProgress: calcs.shiftProgress,
  };
}

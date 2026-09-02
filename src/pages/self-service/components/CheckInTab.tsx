import React from "react";
import { useCheckInData } from "../hooks/useCheckInData";
import { LiveClockPanel } from "./checkin/LiveClockPanel";
import { MonthStatsCard } from "./checkin/MonthStatsCard";
import { Last7DaysCard } from "./checkin/Last7DaysCard";
import { AttendanceHistoryCard } from "./checkin/AttendanceHistoryCard";
import { fmtHM, getStatusColor } from "../selfServiceUtils";

interface Props {
  employeeId: string;
  employeeName: string;
  autoStart?: boolean;
  autoCheckOut?: boolean;
}

export default function CheckInTab({ employeeId, employeeName, autoStart, autoCheckOut }: Props) {
  const d = useCheckInData({ employeeId, employeeName, autoStart, autoCheckOut });

  if (d.loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-7 h-7 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {d.toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-[13px] font-semibold text-white ${
            d.toast.type === "success" ? "bg-[#253C7D]" : "bg-red-500"
          }`}
        >
          {d.toast.message}
        </div>
      )}

      {/* Live Clock + Shift Snapshot + Check In/Out Actions */}
      <LiveClockPanel
        currentTime={d.currentTime}
        timezone={d.scheduleSettings.timezone}
        workStartTime={d.workStartTime}
        workEndTime={d.workEndTime}
        shiftProgress={d.shiftProgress}
        activeOutsideWork={d.activeOutsideWork}
        todayOutsideWork={d.todayOutsideWork}
        todayRecord={d.todayRecord}
        elapsedHours={d.elapsedHours}
        isCheckedIn={d.isCheckedIn}
        isCheckedOut={d.isCheckedOut}
        branch={d.branch}
        branchLoading={d.branchLoading}
        checkInStep={d.checkInStep}
        checkInMessage={d.checkInMessage}
        processing={d.processing}
        notes={d.notes}
        setNotes={d.setNotes}
        earlyCheckoutReason={d.earlyCheckoutReason}
        setEarlyCheckoutReason={d.setEarlyCheckoutReason}
        earlyCheckoutMinutesNow={d.earlyCheckoutMinutesNow}
        isEarlyCheckoutNow={d.isEarlyCheckoutNow}
        scheduleSettings={d.scheduleSettings}
        daySchedule={d.daySchedule}
        onRequestClockIn={d.handleRequestClockIn}
        onConfirmClockIn={d.handleConfirmClockIn}
        onClockOut={d.handleClockOut}
        onResetCheckInFlow={d.resetCheckInFlow}
      />

      {/* Month Statistics */}
      <MonthStatsCard
        recordsCount={d.records.length}
        presentCount={d.presentCount}
        daysWithHours={d.daysWithHours}
        punctuality={d.punctuality}
        onTimeCount={d.presentCount - d.lateCount}
        lateCount={d.lateCount}
        earlyLeaveCount={d.earlyLeaveCount}
        absentCount={d.absentCount}
        totalHours={d.totalHours}
        avgHours={d.avgHours}
        scheduleSettings={d.scheduleSettings}
      />

      {/* Last 7 Days Overview */}
      <Last7DaysCard
        last7Days={d.past7Days}
        records={d.records}
        today={d.todayRecord?.date || new Date().toISOString().slice(0, 10)}
        scheduleSettings={d.scheduleSettings}
        fmtHM={fmtHM}
      />

      {/* Full Attendance History */}
      <AttendanceHistoryCard
        records={d.records}
        today={d.todayRecord?.date || new Date().toISOString().slice(0, 10)}
        totalHours={d.totalHours}
        scheduleSettings={d.scheduleSettings}
        getStatusColor={getStatusColor}
      />
    </div>
  );
}

import { useState, useRef, useEffect, useCallback } from "react";
import { zonedParts, zonedDayOfWeek } from "@/lib/date";
import type { AttendanceRecord, BranchGeofence, OutsideWorkTask } from "../types";
import { useGeofenceCheckIn } from "./useGeofenceCheckIn";
import { useClockInOutActions } from "./useClockInOutActions";

interface UseCheckInMutationsProps {
  employeeId: string;
  employeeName: string;
  autoStart?: boolean;
  autoCheckOut?: boolean;
  today: string;
  todayRecord: AttendanceRecord | null;
  loading: boolean;
  branch: BranchGeofence | null;
  branchLoading: boolean;
  scheduleSettings: {
    timezone: string;
    lateGraceMinutes: number;
    earlyLeaveGraceMinutes: number;
    breakStartTime: string;
    breakEndTime: string;
  };
  daySchedule: { startTime: string; endTime: string } | null;
  workStartTime: string;
  workEndTime: string | null;
  defaultWorkLocationId: string | null;
  todayOutsideWork: OutsideWorkTask | null;
  currentTime: Date;
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  isEarlyCheckoutNow: boolean;
  loadRecords: () => Promise<void>;
}

export function useCheckInMutations({
  employeeId,
  employeeName,
  autoStart,
  autoCheckOut,
  today,
  todayRecord,
  loading,
  branch,
  branchLoading,
  scheduleSettings,
  daySchedule,
  workStartTime,
  workEndTime,
  defaultWorkLocationId,
  todayOutsideWork,
  currentTime,
  isCheckedIn,
  isCheckedOut,
  isEarlyCheckoutNow,
  loadRecords,
}: UseCheckInMutationsProps) {
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);
  const [notes, setNotes] = useState("");
  const [earlyCheckoutReason, setEarlyCheckoutReason] = useState("");

  const showToast = useCallback((type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const clockActions = useClockInOutActions({
    employeeId,
    employeeName,
    today,
    todayRecord,
    branch,
    scheduleSettings,
    daySchedule,
    workStartTime,
    workEndTime,
    defaultWorkLocationId,
    todayOutsideWork,
    notes,
    setNotes,
    earlyCheckoutReason,
    setEarlyCheckoutReason,
    resetCheckInFlow: () => geofence.resetCheckInFlow(),
    showToast,
    loadRecords,
  });

  const geofence = useGeofenceCheckIn({
    branch,
    branchLoading,
    onWithinRange: (dist) => clockActions.handleClockIn(dist),
    showToast,
  });

  const handleRequestClockIn = useCallback(async () => {
    const hasOutsideWork = Boolean(todayOutsideWork && todayOutsideWork.work_status !== "checked_out");
    clockActions.setProcessing(true);
    try {
      await geofence.requestGeofenceVerification(hasOutsideWork);
    } finally {
      clockActions.setProcessing(false);
    }
  }, [geofence, todayOutsideWork, clockActions]);

  const handleConfirmClockIn = useCallback(async () => {
    clockActions.setProcessing(true);
    await clockActions.handleClockIn();
  }, [clockActions]);

  const handleClockOut = useCallback(async (opts?: { skipLocationCheck?: boolean }) => {
    if (todayOutsideWork && todayOutsideWork.work_status !== "checked_out") {
      showToast("error", "You have an outside work assignment today. Please check out via Task Management.");
      return;
    }
    if (!todayRecord) return;

    let distance: number | null = null;
    if (!opts?.skipLocationCheck) {
      clockActions.setProcessing(true);
      const res = await geofence.verifyLocation("check out");
      clockActions.setProcessing(false);
      if (!res.allowed) {
        return;
      }
      distance = res.distance;
    }

    clockActions.setProcessing(true);
    try {
      await clockActions.handleClockOut({ distance });
    } finally {
      clockActions.setProcessing(false);
    }
  }, [todayOutsideWork, todayRecord, showToast, geofence, clockActions]);

  // Auto check-in handler when query param triggers
  const autoStartHandled = useRef(false);
  useEffect(() => {
    if (!autoStart || autoStartHandled.current || loading || branchLoading || isCheckedIn || isCheckedOut) return;
    autoStartHandled.current = true;
    handleRequestClockIn();
  }, [autoStart, loading, branchLoading, isCheckedIn, isCheckedOut, handleRequestClockIn]);

  // Auto check-out handler when query param triggers
  const autoOutHandled = useRef(false);
  useEffect(() => {
    if (!autoCheckOut || autoOutHandled.current || loading || !isCheckedIn || isCheckedOut) return;
    autoOutHandled.current = true;
    if (isEarlyCheckoutNow) {
      setEarlyCheckoutReason("Auto check-out triggered via quick action");
    }
    handleClockOut();
  }, [autoCheckOut, loading, isCheckedIn, isCheckedOut, isEarlyCheckoutNow, handleClockOut]);

  return {
    toast,
    notes,
    setNotes,
    earlyCheckoutReason,
    setEarlyCheckoutReason,
    processing: clockActions.processing,
    checkInStep: geofence.checkInStep,
    checkInMessage: geofence.checkInMessage,
    checkInDistance: geofence.checkInDistance,
    checkInAccuracy: geofence.checkInAccuracy,
    verifyLocation: geofence.verifyLocation,
    handleRequestClockIn,
    handleConfirmClockIn,
    handleClockIn: clockActions.handleClockIn,
    handleClockOut,
    resetCheckInFlow: geofence.resetCheckInFlow,
  };
}

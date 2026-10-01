import { useState, useCallback } from "react";
import { distanceMeters, getCurrentPosition } from "@/lib/geo";
import type { BranchGeofence, CheckInStep } from "../types";

interface UseGeofenceCheckInProps {
  branch: BranchGeofence | null;
  branchLoading: boolean;
  onWithinRange: () => void;
  showToast: (type: string, message: string) => void;
}

export function useGeofenceCheckIn({
  branch,
  branchLoading,
  onWithinRange,
  showToast,
}: UseGeofenceCheckInProps) {
  const [checkInStep, setCheckInStep] = useState<CheckInStep>("idle");
  const [checkInMessage, setCheckInMessage] = useState("");
  const [checkInDistance, setCheckInDistance] = useState<number | null>(null);
  const [checkInAccuracy, setCheckInAccuracy] = useState<number | null>(null);

  const resetCheckInFlow = useCallback(() => {
    setCheckInStep("idle");
    setCheckInMessage("");
    setCheckInDistance(null);
    setCheckInAccuracy(null);
  }, []);

  const requestGeofenceVerification = useCallback(async (hasOutsideWork: boolean) => {
    if (hasOutsideWork) {
      showToast("error", "You have an outside work task today. Please check in via Task Management.");
      return;
    }
    if (branchLoading) return;
    if (!branch?.latitude || !branch?.longitude) {
      onWithinRange();
      return;
    }

    setCheckInStep("locating");
    try {
      const pos = await getCurrentPosition();
      const dist = Math.round(distanceMeters(pos.coords.latitude, pos.coords.longitude, branch.latitude, branch.longitude));
      const accuracy = Math.round(pos.coords.accuracy);
      setCheckInDistance(dist);
      setCheckInAccuracy(accuracy);

      if (dist <= branch.geofence_radius_m) {
        setCheckInMessage(`You're ${dist}m from ${branch.name} — within range. Confirm to check in.`);
        setCheckInStep("confirm");
      } else {
        const accuracyNote =
          accuracy > branch.geofence_radius_m
            ? ` Your device's location is only accurate to about ±${accuracy}m right now (common on desktop/laptop computers without GPS), so this reading may not be exact — try again on a phone with GPS/location services on for a more precise result.`
            : "";
        setCheckInMessage(`You're ${dist}m from ${branch.name} — you need to be within ${branch.geofence_radius_m}m to check in.${accuracyNote}`);
        setCheckInStep("denied");
      }
    } catch (err: any) {
      const codeNote = err?.code != null ? ` (code ${err.code}${err?.message ? `: ${err.message}` : ""})` : err?.message ? ` (${err.message})` : "";
      if (err?.code === 1) {
        setCheckInMessage(
          `Location access was denied. Please check: 1) In Chrome address bar, click the tune/lock icon next to the URL and set Location to "Allow". 2) In Windows Settings > Privacy & security > Location, ensure "Location services" & "Let desktop apps access your location" are ON.${codeNote}`
        );
      } else {
        setCheckInMessage(
          `Couldn't get your location. On a laptop/desktop, ensure OS-level Location Services are ON (Windows Settings > Privacy > Location or Mac System Settings > Privacy > Location Services) and Wi-Fi is active, then try again.${codeNote}`
        );
      }
      setCheckInStep("error");
    }
  }, [branch, branchLoading, onWithinRange, showToast]);

  return {
    checkInStep,
    checkInMessage,
    checkInDistance,
    checkInAccuracy,
    resetCheckInFlow,
    requestGeofenceVerification,
  };
}

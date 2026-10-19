import { useState, useCallback } from "react";
import { distanceMeters, getCurrentPosition } from "@/lib/geo";
import type { BranchGeofence, CheckInStep } from "../types";

interface UseGeofenceCheckInProps {
  branch: BranchGeofence | null;
  branchLoading: boolean;
  onWithinRange: (dist: number) => Promise<void> | void;
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

  const verifyLocation = useCallback(
    async (action: "check in" | "check out" = "check in"): Promise<{ allowed: boolean; distance: number | null }> => {
      // If branch coordinates are still loading, wait briefly instead of failing prematurely
      if (branchLoading) {
        let attempts = 0;
        while (branchLoading && attempts < 15) {
          await new Promise((r) => setTimeout(r, 200));
          attempts++;
        }
      }

      if (!branch?.latitude || !branch?.longitude) {
        const msg = `Branch GPS coordinates are not configured for "${branch?.name || "your branch"}". Check-${action === "check in" ? "in" : "out"} is strictly restricted to within ${branch?.geofence_radius_m || 100}m of the office building. Please contact HR Admin.`;
        setCheckInMessage(msg);
        setCheckInStep("denied");
        showToast("error", msg);
        return { allowed: false, distance: null };
      }

      setCheckInStep("locating");
      try {
        const pos = await getCurrentPosition();
        const dist = Math.round(distanceMeters(pos.coords.latitude, pos.coords.longitude, branch.latitude, branch.longitude));
        const accuracy = Math.round(pos.coords.accuracy);
        const maxRadius = branch.geofence_radius_m || 100;
        setCheckInDistance(dist);
        setCheckInAccuracy(accuracy);

        if (dist <= maxRadius) {
          setCheckInStep("idle");
          setCheckInMessage("");
          return { allowed: true, distance: dist };
        } else {
          const accuracyNote = accuracy > maxRadius ? ` (Device GPS accuracy ±${accuracy}m)` : "";
          const msg = `You are ${dist}m away from ${branch.name}. You must be within ${maxRadius}m around the building to ${action}.${accuracyNote}`;
          setCheckInMessage(msg);
          setCheckInStep("denied");
          showToast("error", `📍 Location outside 100m: You are ${dist}m from ${branch.name}. Must be within ${maxRadius}m to ${action}.`);
          return { allowed: false, distance: dist };
        }
      } catch (err: any) {
        const codeNote = err?.code != null ? ` (code ${err.code}${err?.message ? `: ${err.message}` : ""})` : err?.message ? ` (${err.message})` : "";
        let msg = "";
        if (err?.code === 1) {
          msg = `Location access was denied. Please allow location access in your browser to verify you are within 100m of the office building.${codeNote}`;
        } else {
          msg = `Couldn't get your GPS location. Please ensure location services are turned ON on your device to verify you are within 100m of the office building.${codeNote}`;
        }
        setCheckInMessage(msg);
        setCheckInStep("error");
        showToast("error", msg);
        return { allowed: false, distance: null };
      }
    },
    [branch, branchLoading, showToast]
  );

  const requestGeofenceVerification = useCallback(
    async (hasOutsideWork: boolean) => {
      if (hasOutsideWork) {
        showToast("error", "You have an outside work task today. Please check in via Task Management.");
        return;
      }
      const { allowed, distance } = await verifyLocation("check in");
      if (allowed && distance != null) {
        // Direct single-click execution without extra confirmation step
        await onWithinRange(distance);
      }
    },
    [verifyLocation, onWithinRange, showToast]
  );

  return {
    checkInStep,
    checkInMessage,
    checkInDistance,
    checkInAccuracy,
    resetCheckInFlow,
    verifyLocation,
    requestGeofenceVerification,
  };
}

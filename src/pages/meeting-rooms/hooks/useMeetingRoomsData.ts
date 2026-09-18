import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import type { Booking } from "../types";
import { toYMD } from "../roomUtils";
import { useRoomsManagement } from "./useRoomsManagement";
import { useCurrentBookingEmployee } from "./useCurrentBookingEmployee";
import { mapTrainingCoursesToBookings } from "../trainingBookingAdapter";

export function useMeetingRoomsData(selectedDate: string) {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const {
    isSuperAdmin,
    isBranchAdmin,
    effectiveBranchId,
    effectiveBranchName,
    userBranchId,
    userBranchName,
    targetBranch,
    isPartnerBranchBlocked,
    visibleBranches,
    branches,
    isHrDivision,
  } = useBranchScope();

  const isHrDivisionBranch =
    /hr\s*division/i.test(effectiveBranchName || "") ||
    Boolean(
      userBranchName &&
        /hr\s*division/i.test(userBranchName) &&
        (!effectiveBranchId || effectiveBranchId === userBranchId)
    );
  const isAllBranches = !effectiveBranchId || effectiveBranchId === "all";
  const canViewCrossBranch = Boolean((isSuperAdmin || isHrDivision) && (isAllBranches || isHrDivisionBranch));

  const canApprove = Boolean(
    (isAdmin ||
      isSuperAdmin ||
      isBranchAdmin ||
      canViewCrossBranch ||
      role?.name === "Super Admin" ||
      /branch\s*admin|bu\s*.*admin|bu\s*ceo/i.test(role?.name || "") ||
      role?.name === "Admin" ||
      role?.name === "HR Manager" ||
      role?.meeting_rooms_approve) &&
      !isPartnerBranchBlocked
  );

  const { rooms, loadRooms, deleteRoom } = useRoomsManagement({
    isPartnerBranchBlocked,
    targetBranch,
    canViewCrossBranch,
  });

  const { employeeId, currentEmployee } = useCurrentBookingEmployee(
    user?.email,
    isPartnerBranchBlocked,
    targetBranch
  );

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Bookings
  const loadBookings = useCallback(async () => {
    if (isPartnerBranchBlocked) {
      setBookings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const d = new Date(`${selectedDate}T00:00:00`);
    const from = toYMD(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const to = toYMD(new Date(d.getFullYear(), d.getMonth() + 2, 0));

    const { data, error } = await supabase
      .from("room_bookings")
      .select("*, employees:booked_by(id, first_name, last_name, department, role, avatar_url, email, branch_id)")
      .gte("date", from)
      .lte("date", to)
      .order("start_time");

    const { data: dbRooms } = await supabase
      .from("meeting_rooms")
      .select("id, name, floor, capacity, color, branch_id")
      .is("deleted_at", null);

    const { data: trainingData } = await supabase
      .from("training_courses")
      .select("*")
      .is("deleted_at", null);

    const roomsList = (dbRooms && dbRooms.length > 0 ? dbRooms : rooms).filter((r: any) => {
      if (canViewCrossBranch || !targetBranch) return true;
      return !r.branch_id || r.branch_id === targetBranch;
    });
    const validRoomIds = new Set(roomsList.map((r: any) => r.id));

    if (error) {
      console.error("Failed to load bookings:", error);
    } else {
      const filtered = (data || []).filter((b: any) => validRoomIds.has(b.room_id));
      const normalized = filtered.map((b: any) => ({
        ...b,
        status: b.status || "approved",
        attendees_count: b.attendees_count || 1,
        special_requirements: b.special_requirements || "None",
        refreshments: b.refreshments || "None",
      }));

      const trainingBookings = mapTrainingCoursesToBookings({
        trainingData: trainingData || [],
        roomsList,
        from,
        to,
        canViewCrossBranch,
        targetBranch,
        existingBookings: data || [],
      });

      setBookings([...normalized, ...trainingBookings]);
    }
    setLoading(false);
  }, [selectedDate, isPartnerBranchBlocked, targetBranch, rooms, canViewCrossBranch]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Real-time subscription for room_bookings and training_courses
  useEffect(() => {
    const channel = supabase
      .channel("room_bookings_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "room_bookings" }, () => {
        loadBookings();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "training_courses" }, () => {
        loadBookings();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadBookings]);

  return {
    user,
    role,
    isAdmin,
    isSuperAdmin,
    isHrDivision,
    isHrDivisionScope: canViewCrossBranch,
    canViewCrossBranch,
    isPartnerBranchBlocked,
    userBranchId,
    userBranchName,
    effectiveBranchName,
    targetBranch,
    branches,
    visibleBranches,
    canApprove,
    rooms,
    bookings,
    employeeId,
    currentEmployee,
    loading,
    loadBookings,
    loadRooms,
    deleteRoom,
  };
}

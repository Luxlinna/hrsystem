import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import type { MeetingRoom, Booking, BookingEmployee } from "../types";
import { ROOM_FLOORS, ROOM_AMENITIES, DEFAULT_AMENITIES } from "../constants";
import { toYMD } from "../roomUtils";

export function useMeetingRoomsData(selectedDate: string) {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const {
    isSuperAdmin,
    effectiveBranchId,
    effectiveBranchName,
    userBranchId,
    userBranchName,
    targetBranch,
    isPartnerBranchBlocked,
    visibleBranches,
    branches,
  } = useBranchScope();

  const canApprove = Boolean(
    (isAdmin ||
    role?.name === "Super Admin" ||
    role?.name === "HR Manager" ||
    role?.meeting_rooms_approve) && !isPartnerBranchBlocked
  );

  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [currentEmployee, setCurrentEmployee] = useState<BookingEmployee | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch rooms
  const loadRooms = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setRooms([]);
      return;
    }

    const { data, error } = await supabase
      .from("meeting_rooms")
      .select("id, name, capacity, color, floor, branch_id, deleted_at, amenities")
      .is("deleted_at", null)
      .order("capacity");

    if (error) {
      console.error("Failed to load rooms:", error);
      return;
    }

    // Rooms belonging to this branch, plus legacy global rooms (branch_id is null)
    const roomsToEnrich = (data || []).filter(
      (r: any) => r.branch_id === targetBranch || !r.branch_id
    );

    const enrichedRooms: MeetingRoom[] = roomsToEnrich.map((r: any) => {
      const floor = r.floor || ROOM_FLOORS[r.name] || (r.name.toLowerCase().includes("vip") ? 5 : 3);
      const amenities = (Array.isArray(r.amenities) && r.amenities.length > 0)
        ? r.amenities
        : (ROOM_AMENITIES[r.name] || DEFAULT_AMENITIES);

      return {
        ...r,
        floor,
        amenities,
      };
    });

    setRooms(enrichedRooms);
  }, [isPartnerBranchBlocked, targetBranch]);

  const deleteRoom = useCallback(async (roomId: string, roomName: string) => {
    if (!confirm(`Are you sure you want to remove room "${roomName}"?`)) return false;
    try {
      const { error } = await supabase
        .from("meeting_rooms")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", roomId);

      if (error) throw error;
      await loadRooms();
      return true;
    } catch (err: any) {
      console.error("Failed to delete room:", err);
      return false;
    }
  }, [loadRooms]);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Fetch current user employee profile
  useEffect(() => {
    if (!user?.email || isPartnerBranchBlocked || !targetBranch) {
      setCurrentEmployee(null);
      setEmployeeId("");
      return;
    }
    supabase
      .from("employees")
      .select("id, first_name, last_name, department, role, avatar_url, email, branch_id")
      .eq("email", user.email)
      .eq("branch_id", targetBranch)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setEmployeeId(data.id);
          setCurrentEmployee({
            id: data.id,
            first_name: data.first_name,
            last_name: data.last_name,
            department: data.department,
            role: data.role,
            avatar_url: data.avatar_url,
            email: data.email,
          });
        }
      });
  }, [user?.email, isPartnerBranchBlocked, targetBranch]);

  // Load Bookings
  const loadBookings = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
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

    if (error) {
      console.error("Failed to load bookings:", error);
    } else {
      const filtered = (data || []).filter(
        (b: any) => !b.employees || b.employees.branch_id === targetBranch
      );
      const normalized = filtered.map((b: any) => ({
        ...b,
        status: b.status || "approved",
        attendees_count: b.attendees_count || 1,
        special_requirements: b.special_requirements || "None",
        refreshments: b.refreshments || "None",
      }));
      setBookings(normalized);
    }
    setLoading(false);
  }, [selectedDate, isPartnerBranchBlocked, targetBranch]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("room_bookings_realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "room_bookings" }, () => {
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

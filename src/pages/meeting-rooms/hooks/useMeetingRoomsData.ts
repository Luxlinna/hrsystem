import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import type { MeetingRoom, Booking, BookingEmployee } from "../types";
import { ROOM_FLOORS, ROOM_AMENITIES, DEFAULT_AMENITIES } from "../constants";
import { toYMD } from "../roomUtils";
import { decodeCourseDescription } from "@/pages/training/components/modals/courseModalUtils";

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
  } = useBranchScope();

  const canApprove = Boolean(
    (isAdmin ||
    isSuperAdmin ||
    isBranchAdmin ||
    role?.name === "Super Admin" ||
    role?.name === "Branch Admin" ||
    role?.name === "Admin" ||
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
    if (isPartnerBranchBlocked) {
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

    // Also load meeting rooms directly so matching never depends on initial state
    const { data: dbRooms } = await supabase
      .from("meeting_rooms")
      .select("id, name, floor, capacity, color, branch_id")
      .is("deleted_at", null);

    // Also load training courses that booked meeting rooms
    const { data: trainingData } = await supabase
      .from("training_courses")
      .select("*")
      .is("deleted_at", null);

    const roomsList = (dbRooms && dbRooms.length > 0 ? dbRooms : rooms).filter(
      (r: any) => !targetBranch || r.branch_id === targetBranch || !r.branch_id
    );
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

      // Map training courses to meeting room bookings
      const trainingBookings: Booking[] = [];

      (trainingData || []).forEach((rawTc) => {
        const { meta } = decodeCourseDescription(rawTc.description);
        const scheduledDate = rawTc.scheduled_date || meta.scheduled_date;
        const startTime = rawTc.start_time || meta.start_time;
        const endTime = rawTc.end_time || meta.end_time;
        const location = rawTc.location || meta.location;

        if (!location || !scheduledDate || !startTime || !endTime) return;
        const dateStr = scheduledDate.slice(0, 10);
        if (dateStr < from || dateStr > to) return;

        // Find room by matching name
        const locLower = location.toLowerCase().trim();
        const matchedRoom = roomsList.find((r) => {
          const rNameLower = r.name.toLowerCase().trim();
          return (
            locLower === rNameLower ||
            locLower.includes(rNameLower) ||
            rNameLower.includes(locLower.split(" (")[0].trim())
          );
        });

        if (matchedRoom) {
          // If already in room_bookings table, keep the official record with its actual approval status
          const alreadyInRoomBookings = normalized.some(
            (b) =>
              b.room_id === matchedRoom.id &&
              b.date === dateStr &&
              ((b.start_time || "").slice(0, 5) === (startTime || "").slice(0, 5) ||
                (b.title && b.title.toLowerCase().includes(rawTc.title.toLowerCase())))
          );
          if (alreadyInRoomBookings) {
            return;
          }

          // If branch filtering applies, ensure room or course matches targetBranch
          if (
            targetBranch &&
            matchedRoom.branch_id &&
            matchedRoom.branch_id !== targetBranch &&
            rawTc.branch_id &&
            rawTc.branch_id !== targetBranch
          ) {
            return;
          }

          const hostName = rawTc.created_by_name || meta.created_by_name || rawTc.instructor || "Training Host";
          const nameParts = hostName.split(" ");
          const fName = nameParts[0] || "Training";
          const lName = nameParts.slice(1).join(" ") || "Host";

          trainingBookings.push({
            id: `training-${rawTc.id}`,
            room_id: matchedRoom.id,
            title: `🎓 Training: ${rawTc.title}`,
            booked_by: hostName,
            date: dateStr,
            start_time: startTime,
            end_time: endTime,
            attendees_count: matchedRoom.capacity || 10,
            status: "pending",
            special_requirements: `Category: ${rawTc.category || "Training"} · Host: ${hostName} · Purpose: Training Course Session`,
            refreshments: "None",
            employees: {
              first_name: fName,
              last_name: lName,
              department: rawTc.category || "Training",
              role: "Instructor",
              branch_id: rawTc.branch_id || matchedRoom.branch_id || targetBranch,
            },
          });
        }
      });

      setBookings([...normalized, ...trainingBookings]);
    }
    setLoading(false);
  }, [selectedDate, isPartnerBranchBlocked, targetBranch, rooms]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Real-time subscription for both room_bookings and training_courses
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

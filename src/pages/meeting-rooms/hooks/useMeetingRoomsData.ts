import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { MeetingRoom, Booking, BookingEmployee } from "../types";
import { ROOM_FLOORS, ROOM_AMENITIES, DEFAULT_AMENITIES } from "../constants";
import { toYMD } from "../roomUtils";

export function useMeetingRoomsData(selectedDate: string) {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();

  const canApprove = Boolean(
    isAdmin ||
    role?.name === "Super Admin" ||
    role?.name === "HR Manager" ||
    role?.meeting_rooms_approve
  );

  const [rooms, setRooms] = useState<MeetingRoom[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [employeeId, setEmployeeId] = useState<string>("");
  const [currentEmployee, setCurrentEmployee] = useState<BookingEmployee | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch rooms
  const loadRooms = useCallback(async () => {
    let { data, error } = await supabase.from("meeting_rooms").select("id, name, capacity, color, floor").order("capacity");
    if (error) {
      console.error("Failed to load rooms:", error);
      return;
    }

    // Rename Big Meeting Room -> VIP Room if present in DB and set floor = 5
    if (data && data.some((r) => r.name === "Big Meeting Room")) {
      await supabase
        .from("meeting_rooms")
        .update({ name: "VIP Room", floor: 5 })
        .eq("name", "Big Meeting Room");

      data = data.map((r) => (r.name === "Big Meeting Room" ? { ...r, name: "VIP Room", floor: 5 } : r));
    }

    // Auto-seed Training Room if it does not exist in DB yet (Floor 3)
    if (data && !data.some((r) => r.name.toLowerCase().includes("training"))) {
      const { data: newRoom } = await supabase
        .from("meeting_rooms")
        .insert({
          name: "Training Room",
          capacity: 30,
          color: "#059669",
          floor: 3,
        })
        .select()
        .single();

      if (newRoom) {
        data = [...data, newRoom].sort((a, b) => (a.capacity || 0) - (b.capacity || 0));
      }
    }

    const enrichedRooms = (data || []).map((r) => {
      const floor = r.floor || ROOM_FLOORS[r.name] || (r.name.toLowerCase().includes("vip") ? 5 : 3);
      return {
        ...r,
        floor,
        amenities: ROOM_AMENITIES[r.name] || DEFAULT_AMENITIES,
      };
    });
    setRooms(enrichedRooms);
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Fetch current user employee profile
  useEffect(() => {
    if (!user?.email) return;
    supabase
      .from("employees")
      .select("id, first_name, last_name, department, role, avatar_url, email")
      .eq("email", user.email)
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
  }, [user?.email]);

  // Load Bookings
  const loadBookings = useCallback(async () => {
    setLoading(true);
    const d = new Date(`${selectedDate}T00:00:00`);
    const from = toYMD(new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const to = toYMD(new Date(d.getFullYear(), d.getMonth() + 2, 0));

    const { data, error } = await supabase
      .from("room_bookings")
      .select("*, employees:booked_by(id, first_name, last_name, department, role, avatar_url, email)")
      .gte("date", from)
      .lte("date", to)
      .order("start_time");

    if (error) {
      console.error("Failed to load bookings:", error);
    } else {
      const normalized = (data || []).map((b: any) => ({
        ...b,
        status: b.status || "approved",
        attendees_count: b.attendees_count || 1,
        special_requirements: b.special_requirements || "None",
        refreshments: b.refreshments || "None",
      }));
      setBookings(normalized);
    }
    setLoading(false);
  }, [selectedDate]);

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
    canApprove,
    rooms,
    bookings,
    employeeId,
    currentEmployee,
    loading,
    loadBookings,
    loadRooms,
  };
}

import { useState, useMemo, useCallback } from "react";
import type { Booking, MeetingRoom } from "../types";
import { toYMD, getRoomFloor } from "../roomUtils";

export function useMeetingRoomsFilters(
  rooms: MeetingRoom[],
  bookings: Booking[],
  employeeId: string,
  userEmail?: string | null
) {
  const [selectedDate, setSelectedDate] = useState(toYMD(new Date()));
  const [viewMode, setViewMode] = useState<"timeline" | "month" | "cards">("timeline");
  const [filterFloor, setFilterFloor] = useState<string>("all");
  const [filterRoomId, setFilterRoomId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusTab, setStatusTab] = useState<"all" | "pending" | "my">("all");

  const shiftDate = useCallback((days: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDate(toYMD(d));
  }, [selectedDate]);

  const shiftMonth = useCallback((delta: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setMonth(d.getMonth() + delta, 1);
    setSelectedDate(toYMD(d));
  }, [selectedDate]);

  const jumpToToday = useCallback(() => {
    setSelectedDate(toYMD(new Date()));
  }, []);

  // Distinct floors available across registered rooms
  const availableFloors = useMemo(() => {
    const set = new Set<number>();
    rooms.forEach((r) => set.add(getRoomFloor(r)));
    return Array.from(set).sort((a, b) => a - b);
  }, [rooms]);

  // Filtered rooms based on floor and selected room dropdown
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const fl = getRoomFloor(r);
      if (filterFloor !== "all" && String(fl) !== filterFloor) return false;
      if (filterRoomId !== "all" && r.id !== filterRoomId) return false;
      return true;
    });
  }, [rooms, filterFloor, filterRoomId]);

  // Filtered bookings for the active date and search query / status tab
  const activeDateBookings = useMemo(() => {
    return bookings.filter((b) => {
      if (b.date !== selectedDate) return false;
      if (b.status === "cancelled" || b.status === "rejected") return false;

      if (statusTab === "pending" && b.status !== "pending") return false;
      if (statusTab === "my") {
        const isMe =
          b.booked_by === employeeId ||
          (Boolean(userEmail) && b.employees?.email === userEmail);
        if (!isMe) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (b.title || "").toLowerCase();
        const empName = `${b.employees?.first_name || ""} ${b.employees?.last_name || ""}`.toLowerCase();
        const dept = (b.employees?.department || "").toLowerCase();
        if (!title.includes(q) && !empName.includes(q) && !dept.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, selectedDate, statusTab, searchQuery, employeeId, userEmail]);

  // Operational stats
  const pendingCount = useMemo(() => {
    return bookings.filter((b) => b.status === "pending").length;
  }, [bookings]);

  const todayBookingsCount = useMemo(() => {
    const todayStr = toYMD(new Date());
    return bookings.filter(
      (b) => b.date === todayStr && b.status !== "cancelled" && b.status !== "rejected"
    ).length;
  }, [bookings]);

  const floorCounts = useMemo(() => {
    const map = new Map<number, number>();
    rooms.forEach((r) => {
      const fl = getRoomFloor(r);
      map.set(fl, (map.get(fl) || 0) + 1);
    });
    return map;
  }, [rooms]);

  const floor3RoomsCount = useMemo(() => floorCounts.get(3) || 0, [floorCounts]);
  const floor5RoomsCount = useMemo(() => floorCounts.get(5) || 0, [floorCounts]);

  return {
    selectedDate,
    setSelectedDate,
    viewMode,
    setViewMode,
    filterFloor,
    setFilterFloor,
    filterRoomId,
    setFilterRoomId,
    searchQuery,
    setSearchQuery,
    statusTab,
    setStatusTab,
    shiftDate,
    shiftMonth,
    jumpToToday,
    filteredRooms,
    activeDateBookings,
    pendingCount,
    todayBookingsCount,
    floor3RoomsCount,
    floor5RoomsCount,
    availableFloors,
    floorCounts,
  };
}

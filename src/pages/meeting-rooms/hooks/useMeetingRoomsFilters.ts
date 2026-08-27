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
  const [filterFloor, setFilterFloor] = useState<"all" | "3" | "5">("all");
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

  // Filtered rooms based on floor and selected room dropdown
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const fl = getRoomFloor(r);
      if (filterFloor === "3" && fl !== 3) return false;
      if (filterFloor === "5" && fl !== 5) return false;
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

  const floor3RoomsCount = useMemo(() => {
    return rooms.filter((r) => getRoomFloor(r) === 3).length;
  }, [rooms]);

  const floor5RoomsCount = useMemo(() => {
    return rooms.filter((r) => getRoomFloor(r) === 5).length;
  }, [rooms]);

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
  };
}

import { useState, useCallback, useEffect } from "react";
import { useMeetingRoomsData } from "./useMeetingRoomsData";
import { useMeetingRoomsFilters } from "./useMeetingRoomsFilters";
import { useBookingMutations } from "./useBookingMutations";

export function useMeetingRooms() {
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  const showToast = useCallback((type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // 1. Filter state initial
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  // 2. Data hook
  const data = useMeetingRoomsData(selectedDate);

  // 3. Filters hook
  const filters = useMeetingRoomsFilters(
    data.rooms,
    data.bookings,
    data.employeeId,
    data.user?.email
  );

  // Sync selectedDate between data and filters
  useEffect(() => {
    setSelectedDate(filters.selectedDate);
  }, [filters.selectedDate]);

  // 4. Mutations hook
  const mutations = useBookingMutations({
    rooms: data.rooms,
    bookings: data.bookings,
    employeeId: data.employeeId,
    currentEmployee: data.currentEmployee,
    selectedDate: filters.selectedDate,
    roleName: data.role?.name,
    userEmail: data.user?.email,
    loadBookings: data.loadBookings,
    showToast,
  });

  return {
    toast,
    showToast,
    ...data,
    ...filters,
    ...mutations,
  };
}

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { MeetingRoomOption } from "../../types";
import { decodeCourseDescription } from "./courseModalUtils";

export interface RoomBookingItem {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
}

export function useRoomSchedule(
  selectedRoom: MeetingRoomOption | null,
  scheduledDate?: string,
  currentTitle?: string,
  startTime?: string,
  endTime?: string
) {
  const [roomBookings, setRoomBookings] = useState<RoomBookingItem[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  useEffect(() => {
    if (!selectedRoom || !scheduledDate) {
      setRoomBookings([]);
      return;
    }
    let cancelled = false;
    setLoadingSchedule(true);

    const loadRoomSchedule = async () => {
      const { data: rb } = await supabase
        .from("room_bookings")
        .select("id, title, start_time, end_time, status")
        .eq("room_id", selectedRoom.id)
        .eq("date", scheduledDate)
        .neq("status", "rejected")
        .neq("status", "cancelled");

      const { data: tc } = await supabase
        .from("training_courses")
        .select("id, title, description")
        .is("deleted_at", null);

      if (cancelled) return;

      const merged: RoomBookingItem[] = [];
      const seenTimes = new Set<string>();

      (rb || []).forEach((b) => {
        if (b.start_time && b.end_time) {
          const sTime = b.start_time.slice(0, 5);
          const eTime = b.end_time.slice(0, 5);
          const timeKey = `${sTime}-${eTime}`;
          seenTimes.add(timeKey);
          merged.push({ id: b.id, title: b.title, start_time: sTime, end_time: eTime });
        }
      });

      (tc || []).forEach((c) => {
        if (c.title === currentTitle) return;
        const { meta } = decodeCourseDescription(c.description);
        if (
          meta.scheduled_date === scheduledDate &&
          meta.location &&
          meta.location.toLowerCase().includes(selectedRoom.name.toLowerCase()) &&
          meta.start_time &&
          meta.end_time
        ) {
          const sTime = meta.start_time.slice(0, 5);
          const eTime = meta.end_time.slice(0, 5);
          const timeKey = `${sTime}-${eTime}`;
          if (!seenTimes.has(timeKey)) {
            seenTimes.add(timeKey);
            merged.push({
              id: c.id,
              title: `🎓 Training: ${c.title}`,
              start_time: sTime,
              end_time: eTime,
            });
          }
        }
      });

      merged.sort((a, b) => a.start_time.localeCompare(b.start_time));
      setRoomBookings(merged);
      setLoadingSchedule(false);
    };

    loadRoomSchedule();
    return () => {
      cancelled = true;
    };
  }, [selectedRoom, scheduledDate, currentTitle]);

  const conflict = useMemo(() => {
    if (!startTime || !endTime || roomBookings.length === 0) return null;
    return (
      roomBookings.find((b) => {
        return startTime < b.end_time && endTime > b.start_time;
      }) || null
    );
  }, [roomBookings, startTime, endTime]);

  return { roomBookings, loadingSchedule, conflict };
}

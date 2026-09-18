import type { Booking } from "./types";
import { decodeCourseDescription } from "@/pages/training/components/modals/courseModalUtils";

interface MapTrainingCoursesParams {
  trainingData: any[];
  roomsList: any[];
  from: string;
  to: string;
  canViewCrossBranch: boolean;
  targetBranch: string;
  existingBookings: any[];
}

export function mapTrainingCoursesToBookings({
  trainingData,
  roomsList,
  from,
  to,
  canViewCrossBranch,
  targetBranch,
  existingBookings,
}: MapTrainingCoursesParams): Booking[] {
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
    const matchedRoom = roomsList.find((r: any) => {
      const rNameLower = r.name.toLowerCase().trim();
      return (
        locLower === rNameLower ||
        locLower.includes(rNameLower) ||
        rNameLower.includes(locLower.split(" (")[0].trim())
      );
    });

    if (!matchedRoom) return;

    const alreadyInRoomBookings = (existingBookings || []).some(
      (b: any) =>
        b.room_id === matchedRoom.id &&
        b.date === dateStr &&
        ((b.start_time || "").slice(0, 5) === (startTime || "").slice(0, 5) ||
          (b.title && b.title.toLowerCase().includes(rawTc.title.toLowerCase())))
    );
    if (alreadyInRoomBookings) return;

    // If branch filtering applies, ensure room or course matches targetBranch
    if (
      !canViewCrossBranch &&
      targetBranch &&
      matchedRoom.branch_id &&
      matchedRoom.branch_id !== targetBranch &&
      rawTc.branch_id &&
      rawTc.branch_id !== targetBranch
    ) {
      return;
    }

    const hostName =
      rawTc.created_by_name || meta.created_by_name || rawTc.instructor || "Training Host";
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
  });

  return trainingBookings;
}

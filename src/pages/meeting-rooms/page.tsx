import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { notify } from "@/lib/notify";
import { logActivity } from "@/lib/audit";

interface MeetingRoom {
  id: string;
  name: string;
  capacity: number | null;
  color: string;
  floor?: number;
  amenities?: string[];
}

interface BookingEmployee {
  id?: string;
  first_name: string;
  last_name: string;
  department: string;
  role?: string;
  avatar_url?: string | null;
  email?: string;
}

interface Booking {
  id: string;
  room_id: string;
  title: string;
  booked_by: string;
  date: string;
  start_time: string;
  end_time: string;
  attendees_count?: number | null;
  special_requirements?: string | null;
  refreshments?: string | null;
  approved_requirements?: string | null;
  declined_requirements?: string | null;
  approved_refreshments?: string | null;
  declined_refreshments?: string | null;
  approval_notes?: string | null;
  status: "pending" | "approved" | "rejected" | "cancelled";
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  cancelled_by?: string | null;
  cancelled_at?: string | null;
  created_at?: string;
  employees?: BookingEmployee | null;
}

const ROOM_FLOORS: Record<string, number> = {
  "Small Meeting Room": 3,
  "Training Room": 3,
  "VIP Room": 5,
  "Big Meeting Room": 5,
};

const ROOM_FLOOR_DESCRIPTIONS: Record<string, string> = {
  "Small Meeting Room": "Floor 3 · Team Sync, Interviews & Quick Huddles",
  "Training Room": "Floor 3 · Workshops, Seminars & Large Training Sessions",
  "VIP Room": "Floor 5 · Executive Board & VIP Presentations",
};

const getRoomFloor = (roomOrName?: MeetingRoom | string | null): number => {
  if (!roomOrName) return 3;
  if (typeof roomOrName === "object") {
    if (roomOrName.floor) return roomOrName.floor;
    return ROOM_FLOORS[roomOrName.name] || (roomOrName.name.toLowerCase().includes("vip") ? 5 : 3);
  }
  return ROOM_FLOORS[roomOrName] || (roomOrName.toLowerCase().includes("vip") ? 5 : 3);
};

function FloorBadge({
  floor,
  size = "md",
  isVIP = false,
}: {
  floor: number;
  size?: "sm" | "md" | "lg";
  isVIP?: boolean;
}) {
  if (floor === 5 || isVIP) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-lg shrink-0 ${
          size === "sm"
            ? "px-1.5 py-0.5 text-[10px] bg-purple-50 text-purple-700 border border-purple-200/80"
            : size === "lg"
            ? "px-2.5 py-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs"
            : "px-2 py-0.5 text-[11px] bg-purple-50 text-purple-700 border border-purple-200"
        }`}
      >
        <i className="ri-vip-crown-line text-purple-600" />
        <span>Floor 5</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-lg shrink-0 ${
        size === "sm"
          ? "px-1.5 py-0.5 text-[10px] bg-sky-50 text-sky-700 border border-sky-200/80"
          : size === "lg"
          ? "px-2.5 py-1 text-xs bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
          : "px-2 py-0.5 text-[11px] bg-sky-50 text-sky-700 border border-sky-200"
      }`}
    >
      <i className="ri-building-line text-sky-600" />
      <span>Floor 3</span>
    </span>
  );
}

const ROOM_AMENITIES: Record<string, string[]> = {
  "Small Meeting Room": ["4K Display TV", "Polycom Conference Mic", "Whiteboard", "High-speed Wi-Fi", "AC Climate"],
  "VIP Room": ["Dual 75\" 4K Displays", "Cisco Video Conf System", "Interactive Smartboard", "Conference Mic Array", "AC Climate"],
  "Big Meeting Room": ["Dual 75\" 4K Displays", "Cisco Video Conf System", "Interactive Smartboard", "Conference Mic Array", "AC Climate"],
  "Training Room": ["Dual 4K Projector & Screens", "Wireless Mics & Audio PA", "Modular Desks & Chairs", "Trainer Podium & Clicker", "High-speed Wi-Fi", "AC Climate"],
};

const DEFAULT_AMENITIES = ["4K Display", "Video Conference", "Whiteboard", "High-speed Wi-Fi"];

const QUICK_TITLES = [
  "Operation Team Meeting",
  "Ballangk Mall Sync",
  "Client Presentation",
  "Sprint Standup",
  "Design Review",
  "1-on-1 Check-in",
  "Interview",
  "Budget Review",
];

const DURATION_OPTIONS = [
  { label: "15m", mins: 15 },
  { label: "30m", mins: 30 },
  { label: "45m", mins: 45 },
  { label: "1 hr", mins: 60 },
  { label: "1.5 hr", mins: 90 },
  { label: "2 hr", mins: 120 },
  { label: "3 hr", mins: 180 },
];

const SPECIAL_REQUIREMENTS_OPTIONS = [
  { label: "IT Support Assistance", icon: "ri-customer-service-2-line" },
  { label: "4K Camera & Conf Mic", icon: "ri-camera-line" },
  { label: "Projector & Screen", icon: "ri-tv-line" },
  { label: "Video Conference (Zoom/Teams)", icon: "ri-vidicon-line" },
  { label: "Whiteboard & Markers", icon: "ri-artboard-line" },
  { label: "Extra Power Outlets", icon: "ri-plug-line" },
  { label: "Extra Chairs", icon: "ri-armchair-line" },
  { label: "Wireless Presenter Clicker", icon: "ri-remote-control-line" },
];

const REFRESHMENTS_OPTIONS = [
  { label: "Bottled Drinking Water", icon: "ri-drop-line" },
  { label: "Hot Coffee & Tea", icon: "ri-cup-line" },
  { label: "Fresh Pastries & Snacks", icon: "ri-restaurant-line" },
  { label: "Fresh Fruit Platter", icon: "ri-cake-line" },
];

const PRESET_CANCELLATION_REASONS = [
  "Executive management urgent priority meeting",
  "Technical maintenance / AV equipment repair in room",
  "Room schedule reallocation for corporate event",
  "Facility maintenance & air conditioning servicing",
  "Double booked / scheduling conflict",
];

const TIMELINE_HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00

const fmtTime = (t: string) => {
  if (!t) return "";
  const cleanTime = t.length === 5 ? `${t}:00` : t;
  const d = new Date(`2000-01-01T${cleanTime}`);
  return isNaN(d.getTime())
    ? t
    : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const addMinutesToTime = (timeStr: string, minutesToAdd: number): string => {
  const [hStr, mStr] = timeStr.split(":");
  let totalMins = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + minutesToAdd;
  if (totalMins >= 24 * 60) totalMins = 24 * 60 - 1;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

const timeToMinutes = (timeStr: string): number => {
  const [h, m] = timeStr.slice(0, 5).split(":").map(Number);
  return h * 60 + (m || 0);
};

export default function MeetingRoomsPage() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();

  // Role-based permission: Admin, Super Admin, HR Manager, or ANY role with meeting_rooms_approve = true
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
  const [selectedDate, setSelectedDate] = useState(toYMD(new Date()));
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);

  // View state
  const [viewMode, setViewMode] = useState<"timeline" | "month" | "cards">("timeline");
  const [filterFloor, setFilterFloor] = useState<"all" | "3" | "5">("all");
  const [filterRoomId, setFilterRoomId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusTab, setStatusTab] = useState<"all" | "pending" | "my">("all");

  // Modals & Form State
  const [modalRoom, setModalRoom] = useState<MeetingRoom | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [bookingForm, setBookingForm] = useState({
    title: "",
    date: toYMD(new Date()),
    start_time: "14:00",
    end_time: "16:00",
    attendees_count: 5,
    selected_requirements: ["IT Support Assistance", "4K Camera & Conf Mic"] as string[],
    custom_requirements: "",
    selected_refreshments: ["Bottled Drinking Water"] as string[],
    custom_refreshments: "",
  });
  const [saving, setSaving] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Cancellation / Rejection modal state for Admin/HR
  const [reasonModal, setReasonModal] = useState<{
    isOpen: boolean;
    booking: Booking | null;
    action: "reject" | "cancel";
    reason: string;
  }>({
    isOpen: false,
    booking: null,
    action: "cancel",
    reason: "",
  });

  // Approval with selective requirements & refreshments review modal for Admin/HR
  const [approvalModal, setApprovalModal] = useState<{
    isOpen: boolean;
    booking: Booking | null;
    approvedReqs: string[];
    declinedReqs: string[];
    approvedRef: string[];
    declinedRef: string[];
    notes: string;
  }>({
    isOpen: false,
    booking: null,
    approvedReqs: [],
    declinedReqs: [],
    approvedRef: [],
    declinedRef: [],
    notes: "",
  });
  const [processingAction, setProcessingAction] = useState(false);

  const showToast = (type: "success" | "error" | "info", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch rooms
  const loadRooms = useCallback(async () => {
    let { data, error } = await supabase.from("meeting_rooms").select("*").order("capacity");
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
      showToast("error", "Failed to fetch room bookings.");
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

  // Real-time subscription to room bookings
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

  // Navigation helpers
  const shiftDate = (days: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + days);
    setSelectedDate(toYMD(d));
  };

  const shiftMonth = (delta: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setMonth(d.getMonth() + delta, 1);
    setSelectedDate(toYMD(d));
  };

  const openBookModal = (room?: MeetingRoom, date?: string, startTime?: string) => {
    const targetRoom = room || rooms[0] || null;
    const start = startTime || "14:00";
    const end = addMinutesToTime(start, 120); // default 2 hrs
    setEditingBooking(null);
    setModalRoom(targetRoom);
    setBookingForm({
      title: "",
      date: date || selectedDate,
      start_time: start,
      end_time: end,
      attendees_count: targetRoom?.capacity ? Math.min(5, targetRoom.capacity) : 5,
      selected_requirements: ["IT Support Assistance", "4K Camera & Conf Mic"],
      custom_requirements: "",
      selected_refreshments: ["Bottled Drinking Water"],
      custom_refreshments: "",
    });
  };

  // Open Edit Modal (ONLY for the employee who created the booking AND ONLY BEFORE approval)
  const openEditModal = (booking: Booking) => {
    const isCreator =
      booking.booked_by === employeeId ||
      (!!user?.email && booking.employees?.email === user.email);

    if (!isCreator) {
      showToast("error", "You can only edit your own reservations.");
      return;
    }

    if (booking.status !== "pending") {
      showToast("error", "Bookings can only be edited before Admin/HR approval. Approved bookings cannot be edited.");
      return;
    }

    const targetRoom = rooms.find((r) => r.id === booking.room_id) || rooms[0] || null;
    setEditingBooking(booking);
    setModalRoom(targetRoom);

    // Parse selected requirements
    const rawReqs = (booking.special_requirements || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const knownReqs = SPECIAL_REQUIREMENTS_OPTIONS.map((o) => o.label);
    const selectedReqs = rawReqs.filter((r) => knownReqs.includes(r));
    const customReqs = rawReqs.filter((r) => !knownReqs.includes(r)).join(", ");

    // Parse selected refreshments
    const rawRef = (booking.refreshments || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const knownRef = REFRESHMENTS_OPTIONS.map((o) => o.label);
    const selectedRef = rawRef.filter((r) => knownRef.includes(r));
    const customRef = rawRef.filter((r) => !knownRef.includes(r)).join(", ");

    setBookingForm({
      title: booking.title,
      date: booking.date,
      start_time: booking.start_time,
      end_time: booking.end_time,
      attendees_count: booking.attendees_count || 1,
      selected_requirements: selectedReqs,
      custom_requirements: customReqs,
      selected_refreshments: selectedRef,
      custom_refreshments: customRef,
    });

    if (selectedBooking) {
      setSelectedBooking(null);
    }
  };

  // Conflict detection: Both pending and approved bookings block the slot to prevent double-booking!
  // Cancelled or rejected bookings release the slot so anyone can book again.
  const checkOverlap = (
    roomId: string,
    date: string,
    start: string,
    end: string,
    excludeBookingId?: string
  ): Booking | undefined => {
    return bookings.find((b) => {
      if (b.room_id !== roomId || b.date !== date) return false;
      if (excludeBookingId && b.id === excludeBookingId) return false;
      // Cancelled and rejected bookings DO NOT block
      if (b.status === "cancelled" || b.status === "rejected") return false;
      // Both 'pending' and 'approved' strictly block duplicate bookings
      return start < b.end_time && end > b.start_time;
    });
  };

  // Submit new booking request
  const handleBook = async () => {
    if (!modalRoom) return showToast("error", "Please select a meeting room.");
    if (!employeeId) return showToast("error", "Employee profile not loaded. Please reload.");
    if (!bookingForm.title.trim()) return showToast("error", "Please enter a meeting title.");
    if (bookingForm.end_time <= bookingForm.start_time) {
      return showToast("error", "End time must be after start time.");
    }

    if (modalRoom.capacity && bookingForm.attendees_count > modalRoom.capacity) {
      return showToast(
        "error",
        `Attendees (${bookingForm.attendees_count} ppl) exceeds ${modalRoom.name} capacity (max ${modalRoom.capacity} ppl).`
      );
    }

    const conflict = checkOverlap(
      modalRoom.id,
      bookingForm.date,
      bookingForm.start_time,
      bookingForm.end_time,
      editingBooking?.id
    );
    if (conflict) {
      return showToast(
        "error",
        `${modalRoom.name} is already booked (${conflict.status}) by ${
          conflict.employees?.first_name || "another member"
        } from ${fmtTime(conflict.start_time)} to ${fmtTime(conflict.end_time)}.`
      );
    }

    setSaving(true);

    // Combine multi-selected requirements with any custom note
    const finalRequirements = [
      ...bookingForm.selected_requirements,
      bookingForm.custom_requirements.trim(),
    ]
      .filter(Boolean)
      .join(", ") || "None";

    // Combine multi-selected refreshments with any custom note
    const finalRefreshments = [
      ...bookingForm.selected_refreshments,
      bookingForm.custom_refreshments.trim(),
    ]
      .filter(Boolean)
      .join(", ") || "None";

    const empName = currentEmployee
      ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
      : "An employee";

    // 1. UPDATE EXISTING BOOKING (ONLY IF PENDING BEFORE APPROVAL)
    if (editingBooking) {
      if (editingBooking.status !== "pending") {
        setSaving(false);
        showToast("error", "Approved reservations cannot be edited. Please cancel and re-book if changes are needed.");
        return;
      }

      const { error } = await supabase
        .from("room_bookings")
        .update({
          room_id: modalRoom.id,
          title: bookingForm.title.trim(),
          date: bookingForm.date,
          start_time: bookingForm.start_time,
          end_time: bookingForm.end_time,
          attendees_count: Number(bookingForm.attendees_count) || 1,
          special_requirements: finalRequirements,
          refreshments: finalRefreshments,
        })
        .eq("id", editingBooking.id);

      setSaving(false);

      if (error) {
        console.error("Update booking error:", error);
        showToast(
          "error",
          error.code === "23P01"
            ? `${modalRoom.name} has a conflict for that new time.`
            : "Failed to update reservation."
        );
        return;
      }

      await notify({
        source: "meeting_rooms",
        type: "info",
        title: "Meeting Room Booking Modified",
        message: `${empName} modified reservation for ${modalRoom.name} (Floor ${modalRoom.floor || 3}) on ${bookingForm.date} (${fmtTime(
          bookingForm.start_time
        )}–${fmtTime(bookingForm.end_time)}) "${bookingForm.title}".`,
        entityId: editingBooking.id,
      });

      logActivity({
        module: "meeting_rooms",
        action: "updated",
        entityType: "room_booking",
        entityId: editingBooking.id,
        actorName: empName,
        actorRole: role?.name || "Staff",
        description: `Modified booking for ${modalRoom.name} (Floor ${modalRoom.floor || 3}): "${bookingForm.title}" (${bookingForm.attendees_count} ppl, Snacks: ${finalRefreshments})`,
        metadata: {
          booking_id: editingBooking.id,
          room: modalRoom.name,
          floor: modalRoom.floor || 3,
          date: bookingForm.date,
          start_time: bookingForm.start_time,
          end_time: bookingForm.end_time,
          attendees: bookingForm.attendees_count,
        },
      });

      showToast("success", "Booking updated successfully!");
      setEditingBooking(null);
      setModalRoom(null);
      loadBookings();
      return;
    }

    // 2. CREATE NEW BOOKING
    const initialStatus = "pending";

    const { data, error } = await supabase
      .from("room_bookings")
      .insert({
        room_id: modalRoom.id,
        title: bookingForm.title.trim(),
        booked_by: employeeId,
        date: bookingForm.date,
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
        attendees_count: Number(bookingForm.attendees_count) || 1,
        special_requirements: finalRequirements,
        refreshments: finalRefreshments,
        status: initialStatus,
      })
      .select("id")
      .single();

    setSaving(false);

    if (error) {
      console.error("Booking error:", error);
      showToast(
        "error",
        error.code === "23P01"
          ? `${modalRoom.name} was just booked for that slot. Please choose another time.`
          : "Couldn't create the booking. Please try again."
      );
      return;
    }

    // Notify Admin & HR Manager
    await notify({
      source: "meeting_rooms",
      type: "info",
      title: "New Room Booking Request",
      message: `${empName} requested ${modalRoom.name} (Floor ${modalRoom.floor || 3}, ${bookingForm.attendees_count} ppl) for "${bookingForm.title}" on ${bookingForm.date} (${fmtTime(
        bookingForm.start_time
      )}–${fmtTime(bookingForm.end_time)}). Refreshments: ${finalRefreshments}. Requirements: ${finalRequirements}. Pending Admin/HR approval.`,
      entityId: data?.id || null,
    });

    logActivity({
      module: "meeting_rooms",
      action: "created",
      entityType: "room_booking",
      entityId: data?.id || null,
      actorName: empName,
      actorRole: role?.name || "Staff",
      description: `Submitted booking for ${modalRoom.name} (Floor ${modalRoom.floor || 3}): "${bookingForm.title}" (${bookingForm.attendees_count} ppl, Refreshments: ${finalRefreshments}, Requirements: ${finalRequirements})`,
      metadata: {
        room: modalRoom.name,
        floor: modalRoom.floor || 3,
        date: bookingForm.date,
        start_time: bookingForm.start_time,
        end_time: bookingForm.end_time,
        attendees: bookingForm.attendees_count,
        special_requirements: finalRequirements,
        refreshments: finalRefreshments,
      },
    });

    showToast(
      "success",
      `Booking request submitted for ${modalRoom.name}! Awaiting Admin / HR Manager approval.`
    );
    setModalRoom(null);
    loadBookings();
  };

  // Open Approval Review Modal (Admin / HR Manager can selectively approve/decline requirements & refreshments)
  const openApprovalModal = (booking: Booking) => {
    if (!canApprove) {
      return showToast("error", "Permission denied: Only Admin and HR Manager can approve meeting room bookings.");
    }

    const reqList = (booking.special_requirements || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && s !== "None");

    const refList = (booking.refreshments || "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s && s !== "None");

    setApprovalModal({
      isOpen: true,
      booking,
      approvedReqs: reqList,
      declinedReqs: [],
      approvedRef: refList,
      declinedRef: [],
      notes: "",
    });
  };

  // Toggle a special requirement between Approved and Declined
  const toggleRequirementApproval = (item: string) => {
    setApprovalModal((prev) => {
      const isCurrentlyApproved = prev.approvedReqs.includes(item);
      if (isCurrentlyApproved) {
        return {
          ...prev,
          approvedReqs: prev.approvedReqs.filter((r) => r !== item),
          declinedReqs: [...prev.declinedReqs, item],
        };
      } else {
        return {
          ...prev,
          approvedReqs: [...prev.approvedReqs, item],
          declinedReqs: prev.declinedReqs.filter((r) => r !== item),
        };
      }
    });
  };

  // Toggle a refreshment between Approved and Declined
  const toggleRefreshmentApproval = (item: string) => {
    setApprovalModal((prev) => {
      const isCurrentlyApproved = prev.approvedRef.includes(item);
      if (isCurrentlyApproved) {
        return {
          ...prev,
          approvedRef: prev.approvedRef.filter((r) => r !== item),
          declinedRef: [...prev.declinedRef, item],
        };
      } else {
        return {
          ...prev,
          approvedRef: [...prev.approvedRef, item],
          declinedRef: prev.declinedRef.filter((r) => r !== item),
        };
      }
    });
  };

  // Admin / HR Manager Confirm Approval with adjustments
  const handleConfirmApprove = async () => {
    const { booking, approvedReqs, declinedReqs, approvedRef, declinedRef, notes } = approvalModal;
    if (!booking || !canApprove) return;

    setProcessingAction(true);
    const room = rooms.find((r) => r.id === booking.room_id);
    const bookerName = booking.employees
      ? `${booking.employees.first_name} ${booking.employees.last_name}`
      : "Employee";
    const approverName = currentEmployee
      ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
      : "Admin/HR Manager";

    const finalApprovedReqs = approvedReqs.length > 0 ? approvedReqs.join(", ") : (declinedReqs.length > 0 ? "None" : (booking.special_requirements || "None"));
    const finalDeclinedReqs = declinedReqs.length > 0 ? declinedReqs.join(", ") : null;
    const finalApprovedRef = approvedRef.length > 0 ? approvedRef.join(", ") : (declinedRef.length > 0 ? "None" : (booking.refreshments || "None"));
    const finalDeclinedRef = declinedRef.length > 0 ? declinedRef.join(", ") : null;
    const finalNotes = notes.trim() || null;

    const { error } = await supabase
      .from("room_bookings")
      .update({
        status: "approved",
        approved_by: employeeId || null,
        approved_at: new Date().toISOString(),
        approved_requirements: finalApprovedReqs,
        declined_requirements: finalDeclinedReqs,
        approved_refreshments: finalApprovedRef,
        declined_refreshments: finalDeclinedRef,
        approval_notes: finalNotes,
      })
      .eq("id", booking.id);

    setProcessingAction(false);

    if (error) {
      console.error("Approval error:", error);
      showToast("error", "Failed to approve booking.");
      return;
    }

    const hasDeclined = declinedReqs.length > 0 || declinedRef.length > 0;
    const declinedList = [...declinedReqs, ...declinedRef].join(", ");
    const approvedList = [...approvedReqs, ...approvedRef].join(", ");

    // Send notification to the employee who booked
    let notifMsg = `Your booking for ${room?.name || "Room"} on ${booking.date} (${fmtTime(
      booking.start_time
    )}–${fmtTime(booking.end_time)}) "${booking.title}" was APPROVED by ${approverName}.`;

    if (hasDeclined) {
      notifMsg += ` Note: Approved items [${approvedList || "Standard Room"}], Declined items [${declinedList}].`;
    }
    if (finalNotes) {
      notifMsg += ` Admin Note: "${finalNotes}".`;
    }

    await notify({
      source: "meeting_rooms",
      type: "success",
      title: hasDeclined ? "Room Booking Approved (With Adjustments)" : "Room Booking Approved",
      message: notifMsg,
      entityId: booking.id,
    });

    logActivity({
      module: "meeting_rooms",
      action: "approved",
      entityType: "room_booking",
      entityId: booking.id,
      actorName: approverName,
      actorRole: role?.name || "HR Manager",
      description: `Approved ${bookerName}'s booking for ${room?.name}: "${booking.title}"${
        hasDeclined ? ` (Declined: ${declinedList})` : ""
      }`,
      metadata: {
        booking_id: booking.id,
        title: booking.title,
        date: booking.date,
        approved_requirements: finalApprovedReqs,
        declined_requirements: finalDeclinedReqs,
        approved_refreshments: finalApprovedRef,
        declined_refreshments: finalDeclinedRef,
        notes: finalNotes,
      },
    });

    showToast(
      "success",
      `Approved reservation for "${booking.title}". Notification sent to ${bookerName}.`
    );

    if (selectedBooking?.id === booking.id) {
      setSelectedBooking({
        ...selectedBooking,
        status: "approved",
        approved_requirements: finalApprovedReqs,
        declined_requirements: finalDeclinedReqs,
        approved_refreshments: finalApprovedRef,
        declined_refreshments: finalDeclinedRef,
        approval_notes: finalNotes,
      });
    }

    setApprovalModal({
      isOpen: false,
      booking: null,
      approvedReqs: [],
      declinedReqs: [],
      approvedRef: [],
      declinedRef: [],
      notes: "",
    });

    loadBookings();
  };

  // Open Rejection / Cancellation Modal with Reason (Admin/HR Only)
  const openReasonModal = (booking: Booking, action: "reject" | "cancel") => {
    if (!canApprove) {
      return showToast("error", "Permission denied: Only Admin and HR Manager can perform this action.");
    }
    setSelectedBooking(null); // Dismiss details modal so reason modal is front & center
    setReasonModal({
      isOpen: true,
      booking,
      action,
      reason: PRESET_CANCELLATION_REASONS[0],
    });
  };

  // Confirm Rejection or Cancellation with Reason (Admin/HR Only)
  const confirmReasonAction = async () => {
    const { booking, action, reason } = reasonModal;
    if (!booking) return;

    if (!canApprove) {
      return showToast("error", "Permission denied: Only Admin and HR Manager can reject or cancel bookings.");
    }

    if (!reason.trim()) {
      return showToast("error", "Please provide a reason.");
    }

    setProcessingAction(true);
    const room = rooms.find((r) => r.id === booking.room_id);
    const bookerName = booking.employees
      ? `${booking.employees.first_name} ${booking.employees.last_name}`
      : "Employee";
    const actorName = currentEmployee
      ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
      : "Admin/HR Manager";

    const targetStatus = action === "reject" ? "rejected" : "cancelled";

    const { error } = await supabase
      .from("room_bookings")
      .update({
        status: targetStatus,
        rejection_reason: reason.trim(),
        cancelled_by: employeeId || null,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    setProcessingAction(false);

    if (error) {
      console.error("Action error:", error);
      showToast("error", `Failed to ${action} booking.`);
      return;
    }

    const actionLabel = action === "reject" ? "Rejected" : "Cancelled";

    await notify({
      source: "meeting_rooms",
      type: "warning",
      title: `Meeting Room Booking ${actionLabel}`,
      message: `Your booking for ${room?.name || "Room"} on ${booking.date} (${fmtTime(
        booking.start_time
      )}–${fmtTime(booking.end_time)}) "${booking.title}" was ${targetStatus} by ${actorName}. Reason: "${reason.trim()}". The slot has been freed and you may book again.`,
      entityId: booking.id,
    });

    logActivity({
      module: "meeting_rooms",
      action: action === "reject" ? "rejected" : "cancelled",
      entityType: "room_booking",
      entityId: booking.id,
      actorName,
      actorRole: role?.name || "HR Manager",
      description: `${actionLabel} booking for ${room?.name} by ${bookerName}. Reason: ${reason.trim()}`,
      metadata: { booking_id: booking.id, reason: reason.trim(), title: booking.title },
    });

    showToast(
      "success",
      `Booking ${targetStatus}. Notification sent to ${bookerName} with reason. Slot is now available for new bookings!`
    );

    setReasonModal({ isOpen: false, booking: null, action: "cancel", reason: "" });
    if (selectedBooking?.id === booking.id) {
      setSelectedBooking(null);
    }
    loadBookings();
  };

  // Employee Self-Cancellation (Normal Quick Cancel)
  const handleSelfCancel = async (booking: Booking) => {
    if (!confirm(`Cancel your reservation for "${booking.title}"?`)) return;

    setProcessingAction(true);
    const room = rooms.find((r) => r.id === booking.room_id);
    const empName = currentEmployee
      ? `${currentEmployee.first_name} ${currentEmployee.last_name}`
      : "Employee";

    const { error } = await supabase
      .from("room_bookings")
      .update({
        status: "cancelled",
        rejection_reason: "Cancelled by employee",
        cancelled_by: employeeId || null,
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", booking.id);

    setProcessingAction(false);

    if (error) {
      console.error("Cancel error:", error);
      showToast("error", "Failed to cancel booking.");
      return;
    }

    await notify({
      source: "meeting_rooms",
      type: "info",
      title: "Booking Cancelled by User",
      message: `${empName} cancelled their reservation for ${room?.name || "Room"} on ${booking.date} (${fmtTime(
        booking.start_time
      )}–${fmtTime(booking.end_time)}).`,
      entityId: booking.id,
    });

    logActivity({
      module: "meeting_rooms",
      action: "cancelled",
      entityType: "room_booking",
      entityId: booking.id,
      actorName: empName,
      actorRole: role?.name || "Staff",
      description: `Cancelled own reservation for ${room?.name}: "${booking.title}"`,
      metadata: { booking_id: booking.id, title: booking.title },
    });

    showToast("success", "Your booking has been cancelled. The time slot is now open.");
    setSelectedBooking(null);
    loadBookings();
  };

  // Pending bookings count
  const pendingBookings = useMemo(() => {
    return bookings.filter((b) => b.status === "pending");
  }, [bookings]);

  // Filtered bookings based on tabs, search, floor, and room
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const isCreator =
        b.booked_by === employeeId ||
        (!!user?.email && b.employees?.email === user.email);

      const targetRoom = rooms.find((r) => r.id === b.room_id);
      const roomFloor = targetRoom?.floor || ROOM_FLOORS[targetRoom?.name || ""] || (targetRoom?.name?.includes("VIP") ? 5 : 3);

      if (filterFloor !== "all" && roomFloor !== parseInt(filterFloor, 10)) {
        return false;
      }

      if (filterRoomId !== "all" && b.room_id !== filterRoomId) return false;

      // Status tab filters
      if (statusTab === "pending" && b.status !== "pending") return false;
      if (statusTab === "my" && !isCreator) return false;
      // Cancelled and rejected bookings are omitted from active schedule so slots appear free
      if (b.status === "cancelled" || b.status === "rejected") {
        return false;
      }

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = b.title.toLowerCase().includes(query);
        const nameMatch = `${b.employees?.first_name || ""} ${b.employees?.last_name || ""}`
          .toLowerCase()
          .includes(query);
        const deptMatch = (b.employees?.department || "").toLowerCase().includes(query);
        const roomName = targetRoom?.name.toLowerCase() || "";
        const floorMatch = `floor ${roomFloor}`.includes(query) || `${roomFloor}f`.includes(query);
        if (!titleMatch && !nameMatch && !deptMatch && !roomName.includes(query) && !floorMatch) return false;
      }
      return true;
    });
  }, [bookings, filterFloor, filterRoomId, statusTab, employeeId, searchQuery, rooms, canApprove, user?.email]);

  const bookingsForSelectedDate = useMemo(() => {
    return filteredBookings.filter((b) => b.date === selectedDate);
  }, [filteredBookings, selectedDate]);

  // Dynamic statistics
  const stats = useMemo(() => {
    const todayStr = toYMD(new Date());
    const isViewingToday = selectedDate === todayStr;
    const dateActiveBookings = filteredBookings.filter(
      (b) => b.date === selectedDate && (b.status === "approved" || b.status === "pending")
    );
    const monthActiveBookings = filteredBookings.filter(
      (b) => b.status === "approved" || b.status === "pending"
    );
    const myBookingsCount = bookings.filter(
      (b) => b.booked_by === employeeId || (!!user?.email && b.employees?.email === user.email)
    ).length;

    // Room live status for today: room is occupied ONLY if there is an APPROVED booking currently ongoing
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    const roomStatusMap = rooms.map((r) => {
      const roomTodayBookings = bookings
        .filter(
          (b) =>
            b.room_id === r.id &&
            b.date === todayStr &&
            b.status === "approved"
        )
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      const activeBooking = roomTodayBookings.find((b) => {
        const startM = timeToMinutes(b.start_time);
        const endM = timeToMinutes(b.end_time);
        return nowMinutes >= startM && nowMinutes < endM;
      });

      const nextBooking = roomTodayBookings.find((b) => timeToMinutes(b.start_time) > nowMinutes);

      return {
        room: r,
        isOccupied: !!activeBooking,
        activeBooking,
        nextBooking,
        todayCount: roomTodayBookings.length,
      };
    });

    return {
      isViewingToday,
      todayCount: dateActiveBookings.length,
      monthCount: monthActiveBookings.length,
      pendingCount: pendingBookings.length,
      myBookingsCount,
      roomStatusMap,
    };
  }, [bookings, filteredBookings, selectedDate, employeeId, rooms, pendingBookings, user?.email]);

  // Month grid generator
  const monthGridCells = useMemo(() => {
    const d = new Date(`${selectedDate}T00:00:00`);
    const year = d.getFullYear();
    const month = d.getMonth();
    const startOffset = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = Array(startOffset).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(toYMD(new Date(year, month, day)));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [selectedDate]);

  const activeConflict = useMemo(() => {
    if (!modalRoom) return null;
    return checkOverlap(
      modalRoom.id,
      bookingForm.date,
      bookingForm.start_time,
      bookingForm.end_time,
      editingBooking?.id
    );
  }, [modalRoom, bookingForm, bookings, editingBooking]);

  const isToday = selectedDate === toYMD(new Date());

  // Calculate duration in hours and mins
  const durationLabel = useMemo(() => {
    const startM = timeToMinutes(bookingForm.start_time);
    const endM = timeToMinutes(bookingForm.end_time);
    const diff = endM - startM;
    if (diff <= 0) return "0 min";
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m (${diff} mins)`;
    if (hrs > 0) return `${hrs} hr${hrs > 1 ? "s" : ""}`;
    return `${mins} mins`;
  }, [bookingForm.start_time, bookingForm.end_time]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 sm:p-6 lg:p-8 text-[#0F172A]">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-5 py-3.5 rounded-xl text-sm font-semibold text-white shadow-xl flex items-center gap-2.5 transition-all duration-300 transform translate-y-0 ${
            toast.type === "success"
              ? "bg-[#1E293B] border border-emerald-500/30"
              : toast.type === "error"
              ? "bg-rose-600"
              : "bg-[#253C7D]"
          }`}
        >
          <i
            className={`text-lg ${
              toast.type === "success"
                ? "ri-checkbox-circle-fill text-emerald-400"
                : toast.type === "error"
                ? "ri-error-warning-fill"
                : "ri-information-fill"
            }`}
          />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#253C7D] to-[#1E293B] flex items-center justify-center text-white shadow-md shadow-[#253C7D]/20">
              <i className="ri-community-line text-xl" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                  Meeting Rooms
                </h1>
                {canApprove && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#253C7D] text-xs font-bold border border-blue-200">
                    Admin / HR Approver
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                Everyone can reserve rooms. Admin & HR Managers approve bookings and manage cancellations with instant notifications.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/reports?module=meeting-rooms"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 hover:text-[#253C7D] hover:bg-gray-50 transition shadow-sm text-sm font-semibold cursor-pointer"
            title="View Booking Reports"
          >
            <i className="ri-file-chart-line text-lg text-rose-600" />
            <span>Booking Reports</span>
          </Link>
          <button
            onClick={() => loadBookings()}
            className="p-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition shadow-sm cursor-pointer"
            title="Refresh bookings"
          >
            <i className={`ri-refresh-line text-base ${loading ? "animate-spin text-[#253C7D]" : ""}`} />
          </button>
          <button
            onClick={() => openBookModal()}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1C2E60] text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-md shadow-[#253C7D]/25 transition cursor-pointer active:scale-95"
          >
            <i className="ri-add-circle-fill text-lg" />
            <span>Book a Room</span>
          </button>
        </div>
      </div>

      {/* Admin / HR Manager Pending Approval Alert Banner */}
      {canApprove && stats.pendingCount > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
              <i className="ri-time-line text-lg" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">
                {stats.pendingCount} Meeting Room {stats.pendingCount === 1 ? "Booking Needs" : "Bookings Need"} Your Approval
              </p>
              <p className="text-xs text-amber-700 mt-0.5">
                Employees have submitted reservation requests awaiting Admin or HR Manager review.
              </p>
            </div>
          </div>
          <button
            onClick={() => setStatusTab("pending")}
            className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition shrink-0 cursor-pointer"
          >
            Review Pending ({stats.pendingCount})
          </button>
        </div>
      )}

      {/* Live Status & Pulse KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {/* Card 1: Selected Day / Total Bookings */}
        <div className="bg-white border border-slate-100/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {viewMode === "month" ? "Monthly Bookings" : isToday ? "Today's Bookings" : "Selected Date"}
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#253C7D] flex items-center justify-center">
              <i className="ri-calendar-event-line text-base" />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {viewMode === "month" ? stats.monthCount : bookingsForSelectedDate.length}
            </span>
            <span className="text-xs text-gray-500">
              {viewMode === "month" ? "reservations in month" : "active scheduled"}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Live approvals sync</span>
          </div>
        </div>

        {/* Card 2 & 3 & 4: Rooms Live Pulse */}
        {stats.roomStatusMap
          .filter((roomStat) => filterFloor === "all" || (roomStat.room.floor || 3) === parseInt(filterFloor, 10))
          .map((roomStat) => (
            <div
              key={roomStat.room.id}
              className="bg-white border border-slate-100/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: roomStat.room.color }}
                    />
                    <span className="text-xs font-bold text-gray-900 truncate">
                      {roomStat.room.name}
                    </span>
                  </div>
                  <FloorBadge
                    floor={roomStat.room.floor || 3}
                    size="sm"
                    isVIP={roomStat.room.name.includes("VIP")}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between gap-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      roomStat.isOccupied
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        roomStat.isOccupied ? "bg-rose-500" : "bg-emerald-500"
                      }`}
                    />
                    {roomStat.isOccupied ? "Occupied" : "Free Now"}
                  </span>
                  <span className="text-xs text-gray-500 font-medium">
                    {roomStat.room.capacity || "—"} seats
                  </span>
                </div>
              </div>
              <p className="mt-2.5 text-[11px] text-gray-600 truncate">
                {roomStat.isOccupied && roomStat.activeBooking
                  ? `Until ${fmtTime(roomStat.activeBooking.end_time)} · ${roomStat.activeBooking.title}`
                  : roomStat.nextBooking
                  ? `Next: ${fmtTime(roomStat.nextBooking.start_time)} (${roomStat.nextBooking.title})`
                  : "No more bookings today"}
              </p>
            </div>
          ))}

        {/* Card 4: Pending Approvals for Admin/HR OR My Bookings for Employee */}
        <div className="bg-white border border-slate-100/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {canApprove ? "Pending Review" : "My Bookings"}
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                stats.pendingCount > 0 && canApprove
                  ? "bg-amber-50 text-amber-600"
                  : "bg-indigo-50 text-indigo-600"
              }`}
            >
              <i className={canApprove ? "ri-time-line text-base" : "ri-user-star-line text-base"} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-gray-900">
              {canApprove ? stats.pendingCount : stats.myBookingsCount}
            </span>
            <span className="text-xs text-gray-500">
              {canApprove ? "pending approvals" : "reservations created"}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-gray-500">
              {canApprove ? `${stats.myBookingsCount} created by you` : `${stats.pendingCount} pending review`}
            </span>
            <button
              onClick={() => setStatusTab(statusTab === "pending" ? "all" : "pending")}
              className="font-semibold text-[#253C7D] hover:underline cursor-pointer"
            >
              {statusTab === "pending" ? "Show all" : "View queue"}
            </button>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 mb-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Date Navigation */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl p-1">
            <button
              onClick={() => (viewMode === "month" ? shiftMonth(-1) : shiftDate(-1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-700 transition cursor-pointer"
              title="Previous"
            >
              <i className="ri-arrow-left-s-line text-lg" />
            </button>
            <button
              onClick={() => (viewMode === "month" ? shiftMonth(1) : shiftDate(1))}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white hover:shadow-sm text-gray-700 transition cursor-pointer"
              title="Next"
            >
              <i className="ri-arrow-right-s-line text-lg" />
            </button>
          </div>

          {viewMode === "month" ? (
            <div className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-800 flex items-center gap-2">
              <i className="ri-calendar-2-line text-[#253C7D]" />
              <span>
                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-200 bg-gray-50 rounded-xl text-sm font-semibold px-3 py-1.5 focus:bg-white focus:outline-none focus:border-[#253C7D] transition shadow-inner"
              />
              <span className="text-xs font-semibold text-gray-600 hidden sm:inline-block">
                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "short" })}
              </span>
            </div>
          )}

          {!isToday && (
            <button
              onClick={() => setSelectedDate(toYMD(new Date()))}
              className="px-3 py-1.5 bg-[#253C7D]/10 text-[#253C7D] hover:bg-[#253C7D]/20 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Today
            </button>
          )}

          {/* Role-Based Schedule Tabs */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
            <button
              onClick={() => setStatusTab("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusTab === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Schedule
            </button>

            {/* ONLY Admin / HR Approvers see the Pending Approvals tab */}
            {canApprove && (
              <button
                onClick={() => setStatusTab("pending")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  statusTab === "pending" ? "bg-white text-amber-700 shadow-sm" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <i className="ri-time-line text-xs" />
                <span>Pending Approvals</span>
                {stats.pendingCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    {stats.pendingCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={() => setStatusTab("my")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                statusTab === "my" ? "bg-white text-[#253C7D] shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <i className="ri-user-star-line text-xs" />
              <span>My Bookings</span>
            </button>
          </div>
        </div>

        {/* Right: Search, Floor Filter, Room Filter, View Modes */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search box */}
          <div className="relative flex-1 sm:w-44">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              placeholder="Search meetings, floors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:border-[#253C7D] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                <i className="ri-close-circle-fill" />
              </button>
            )}
          </div>

          {/* Floor Quick Filter Tabs */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/80">
            <button
              onClick={() => {
                setFilterFloor("all");
                setFilterRoomId("all");
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterFloor === "all" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              All Floors
            </button>
            <button
              onClick={() => {
                setFilterFloor("3");
                setFilterRoomId("all");
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                filterFloor === "3" ? "bg-white text-sky-800 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
              title="Filter Floor 3 (Training & Small Room)"
            >
              <i className="ri-building-line text-xs text-sky-600" />
              <span>Floor 3</span>
            </button>
            <button
              onClick={() => {
                setFilterFloor("5");
                setFilterRoomId("all");
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                filterFloor === "5" ? "bg-white text-purple-800 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
              title="Filter Floor 5 (VIP Room)"
            >
              <i className="ri-vip-crown-line text-xs text-purple-600" />
              <span>Floor 5</span>
            </button>
          </div>

          {/* Room Filter Select */}
          <select
            value={filterRoomId}
            onChange={(e) => setFilterRoomId(e.target.value)}
            className="border border-gray-200 bg-gray-50 rounded-xl text-xs sm:text-sm px-3 py-1.5 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium text-gray-700 cursor-pointer"
          >
            <option value="all">
              {filterFloor === "all"
                ? `All Rooms (${rooms.length})`
                : `All Floor ${filterFloor} Rooms (${
                    rooms.filter((r) => (r.floor || 3) === parseInt(filterFloor, 10)).length
                  })`}
            </option>
            {rooms
              .filter((r) => filterFloor === "all" || (r.floor || 3) === parseInt(filterFloor, 10))
              .map((r) => (
                <option key={r.id} value={r.id}>
                  [Floor {r.floor || 3}] {r.name} ({r.capacity} seats)
                </option>
              ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/80">
            <button
              onClick={() => setViewMode("timeline")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === "timeline" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
              title="Hourly Timeline Schedule"
            >
              <i className="ri-time-line" />
              <span className="hidden sm:inline">Timeline</span>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === "cards" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
              title="Room Cards & Slots"
            >
              <i className="ri-layout-grid-line" />
              <span className="hidden sm:inline">Rooms</span>
            </button>
            <button
              onClick={() => setViewMode("month")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                viewMode === "month" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
              title="Full Month Calendar View"
            >
              <i className="ri-calendar-2-line" />
              <span className="hidden sm:inline">Month Review</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium text-gray-500">Loading meeting room reservations...</p>
        </div>
      ) : viewMode === "timeline" ? (
        /* ================= TIMELINE VIEW ================= */
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
          {/* Header Info */}
          <div className="px-5 py-3.5 border-b border-gray-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">
                {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-gray-200 text-gray-700 font-semibold">
                {bookingsForSelectedDate.length} {bookingsForSelectedDate.length === 1 ? "booking" : "bookings"}
              </span>
            </div>
            <div className="text-xs text-gray-500 flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                Approved
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                Pending Approval
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded border border-dashed border-emerald-400 bg-emerald-50/50" />
                Click empty slot to reserve
              </span>
            </div>
          </div>

          {/* Timeline Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              {/* Room Header Columns */}
              <div className="grid grid-cols-[100px_repeat(auto-fit,minmax(280px,1fr))] border-b border-gray-200 bg-gray-50 text-xs font-bold text-gray-600">
                <div className="p-3.5 text-center border-r border-gray-200 flex flex-col justify-center">
                  <span>Time</span>
                  <span className="text-[10px] text-gray-400 font-normal">8:00 – 20:00</span>
                </div>
                {rooms
                  .filter(
                    (r) =>
                      (filterFloor === "all" || (r.floor || 3) === parseInt(filterFloor, 10)) &&
                      (filterRoomId === "all" || r.id === filterRoomId)
                  )
                  .map((room) => (
                    <div
                      key={room.id}
                      className="p-3.5 border-r border-gray-200 last:border-r-0 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: room.color }} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900 text-sm truncate">{room.name}</span>
                            <FloorBadge
                              floor={room.floor || 3}
                              size="sm"
                              isVIP={room.name.includes("VIP")}
                            />
                          </div>
                          <p className="text-[11px] text-gray-500 font-normal mt-0.5 truncate">
                            {room.capacity} seats · Level {room.floor || 3}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => openBookModal(room)}
                        className="text-xs text-[#253C7D] hover:bg-[#253C7D]/10 px-2 py-1 rounded-lg font-bold cursor-pointer transition border border-transparent hover:border-[#253C7D]/20 shrink-0"
                      >
                        + Book
                      </button>
                    </div>
                  ))}
              </div>

              {/* Hourly Slots */}
              <div className="divide-y divide-gray-100">
                {TIMELINE_HOURS.map((hour) => {
                  const hourStartStr = `${String(hour).padStart(2, "0")}:00`;
                  const hourEndStr = `${String(hour + 1).padStart(2, "0")}:00`;
                  const displayTime = fmtTime(hourStartStr);

                  return (
                    <div
                      key={hour}
                      className="grid grid-cols-[100px_repeat(auto-fit,minmax(280px,1fr))] min-h-[70px] hover:bg-slate-50/40 transition-colors"
                    >
                      {/* Hour Label */}
                      <div className="p-3 text-center border-r border-gray-200 bg-gray-50/70 text-xs font-semibold text-gray-500 flex flex-col justify-center">
                        <span>{displayTime}</span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          {fmtTime(hourEndStr)}
                        </span>
                      </div>

                      {/* Room Slots */}
                      {rooms
                        .filter(
                          (r) =>
                            (filterFloor === "all" || (r.floor || 3) === parseInt(filterFloor, 10)) &&
                            (filterRoomId === "all" || r.id === filterRoomId)
                        )
                        .map((room) => {
                          const slotBookings = bookingsForSelectedDate.filter((b) => {
                            if (b.room_id !== room.id) return false;
                            return b.start_time < hourEndStr && b.end_time > hourStartStr;
                          });

                          return (
                            <div
                              key={room.id}
                              className="p-1.5 border-r border-gray-200 last:border-r-0 relative group flex flex-col gap-1.5 justify-center"
                            >
                              {slotBookings.length > 0 ? (
                                slotBookings.map((b) => {
                                  const isCreator = b.booked_by === employeeId;
                                  const isPending = b.status === "pending";

                                  return (
                                    <div
                                      key={b.id}
                                      onClick={() => setSelectedBooking(b)}
                                      className={`p-2.5 rounded-xl text-left shadow-sm hover:shadow transition-all cursor-pointer border flex items-center justify-between gap-2 overflow-hidden ${
                                        isPending ? "border-amber-300 bg-amber-50/70" : ""
                                      }`}
                                      style={
                                        !isPending
                                          ? {
                                              backgroundColor: room.color + "14",
                                              borderColor: room.color + "40",
                                            }
                                          : undefined
                                      }
                                    >
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                          <span
                                            className={`w-2 h-2 rounded-full shrink-0 ${
                                              isPending ? "bg-amber-500 animate-pulse" : ""
                                            }`}
                                            style={!isPending ? { backgroundColor: room.color } : undefined}
                                          />
                                          <p className="text-xs font-bold text-gray-900 truncate">
                                            {b.title}
                                          </p>
                                          {isPending && (
                                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-200 shrink-0">
                                              Pending
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-gray-600">
                                          <span className="font-semibold text-gray-800">
                                            {fmtTime(b.start_time)} – {fmtTime(b.end_time)}
                                          </span>
                                          {b.attendees_count && (
                                            <span className="text-gray-500 inline-flex items-center gap-1">
                                              · <i className="ri-team-line text-xs" /> {b.attendees_count} ppl
                                            </span>
                                          )}
                                          {b.refreshments && b.refreshments !== "None" && (
                                            <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                                              <i className="ri-cup-line text-xs text-blue-600" /> {b.refreshments}
                                            </span>
                                          )}
                                          <span className="truncate text-gray-500">
                                            · {b.employees ? `${b.employees.first_name} ${b.employees.last_name}` : "Member"}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Action buttons: ONLY Admin/HR can see Approve */}
                                      <div className="flex items-center gap-1 shrink-0">
                                        {canApprove && isPending && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              openApprovalModal(b);
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                                            title="Quick Approve (Admin/HR)"
                                          >
                                            Approve
                                          </button>
                                        )}
                                        {isCreator && (
                                          <span className="text-[10px] bg-white/80 font-bold px-1.5 py-0.5 rounded border border-gray-200 text-gray-700">
                                            You
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <button
                                  onClick={() => openBookModal(room, selectedDate, hourStartStr)}
                                  className="w-full h-full min-h-[48px] rounded-xl border border-dashed border-transparent hover:border-emerald-400 hover:bg-emerald-50/50 flex items-center justify-center gap-1.5 text-xs text-gray-400 hover:text-emerald-700 opacity-0 group-hover:opacity-100 transition cursor-pointer font-medium"
                                >
                                  <i className="ri-add-line text-sm" />
                                  <span>Reserve {displayTime}</span>
                                </button>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === "cards" ? (
        /* ================= ROOM CARDS & UPCOMING LIST ================= */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {rooms
            .filter(
              (r) =>
                (filterFloor === "all" || (r.floor || 3) === parseInt(filterFloor, 10)) &&
                (filterRoomId === "all" || r.id === filterRoomId)
            )
            .map((room) => {
              const roomBookings = bookingsForSelectedDate.filter((b) => b.room_id === room.id);
              const roomStat = stats.roomStatusMap.find((s) => s.room.id === room.id);

              return (
                <div
                  key={room.id}
                  className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
                >
                  <div className="h-2" style={{ backgroundColor: room.color }} />
                  <div className="p-6 flex-1 flex flex-col">
                    {/* Top Room Banner */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h2 className="text-xl font-bold text-gray-900">{room.name}</h2>
                          <FloorBadge
                            floor={room.floor || 3}
                            size="md"
                            isVIP={room.name.includes("VIP")}
                          />
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              roomStat?.isOccupied
                                ? "bg-rose-50 text-rose-700 border border-rose-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                roomStat?.isOccupied ? "bg-rose-500" : "bg-emerald-500"
                              }`}
                            />
                            {roomStat?.isOccupied ? "In Use" : "Available"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-700">Capacity: {room.capacity} seats</span>
                          <span>•</span>
                          <span className="text-gray-600 font-medium">
                            {ROOM_FLOOR_DESCRIPTIONS[room.name] || `Floor ${room.floor || 3}`}
                          </span>
                          <span>•</span>
                          <span>{roomBookings.length} {roomBookings.length === 1 ? "booking" : "bookings"} on this date</span>
                        </p>
                      </div>

                      <button
                        onClick={() => openBookModal(room)}
                        className="bg-[#253C7D] hover:bg-[#1C2E60] text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                        <i className="ri-add-line text-sm" />
                        Book Now
                      </button>
                    </div>

                    {/* Amenities Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-5">
                      {room.amenities?.map((amenity) => (
                        <span
                          key={amenity}
                          className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-[11px] font-semibold text-gray-600 flex items-center gap-1"
                        >
                          <i className="ri-check-line text-emerald-600 text-xs" />
                          {amenity}
                        </span>
                      ))}
                    </div>

                    {/* Bookings for selected date */}
                    <div className="mt-auto">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                        <span>Schedule for {new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                        <span className="text-[11px] text-gray-400 font-normal">{roomBookings.length} slots</span>
                      </h3>

                      {roomBookings.length === 0 ? (
                        <div className="bg-gray-50 rounded-xl p-6 text-center text-gray-400 border border-dashed border-gray-200">
                          <i className="ri-checkbox-circle-line text-2xl text-emerald-500 mb-1 block" />
                          <p className="text-xs font-semibold text-gray-700">Available all day</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">No reservations have been scheduled yet.</p>
                          <button
                            onClick={() => openBookModal(room)}
                            className="mt-3 text-xs text-[#253C7D] font-bold hover:underline cursor-pointer"
                          >
                            + Reserve first slot
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {roomBookings.map((b) => {
                            const isCreator = b.booked_by === employeeId;
                            const isPending = b.status === "pending";
                            const isApproved = b.status === "approved";

                            return (
                              <div
                                key={b.id}
                                className={`border rounded-xl p-3.5 flex items-start justify-between gap-3 hover:border-gray-300 transition ${
                                  isPending
                                    ? "border-amber-200 bg-amber-50/50"
                                    : "border-gray-200"
                                }`}
                                style={!isPending ? { backgroundColor: room.color + "08" } : undefined}
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-[#253C7D] bg-[#253C7D]/10 px-2 py-0.5 rounded-md">
                                      {fmtTime(b.start_time)} – {fmtTime(b.end_time)}
                                    </span>
                                    <span className="text-xs font-bold text-gray-900 truncate">
                                      {b.title}
                                    </span>
                                    {isPending && (
                                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded border border-amber-200">
                                        Pending Approval
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-gray-500">
                                    <span className="inline-flex items-center gap-1">
                                      <i className="ri-team-line text-xs" /> {b.attendees_count || 1} attendees
                                    </span>
                                    <span>·</span>
                                    <span>{b.employees ? `${b.employees.first_name} ${b.employees.last_name}` : "Unknown"}</span>
                                    {b.refreshments && b.refreshments !== "None" && (
                                      <>
                                        <span>·</span>
                                        <span className="text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                                          <i className="ri-cup-line text-xs text-blue-600" /> {b.refreshments}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  {/* ONLY Admin/HR can see Approve / Reject buttons */}
                                  {canApprove && isPending && (
                                    <>
                                      <button
                                        onClick={() => openApprovalModal(b)}
                                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                                        title="Approve Booking (Admin/HR)"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => openReasonModal(b, "reject")}
                                        className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer"
                                        title="Reject with Reason"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}

                                  {/* If creator: normal cancel */}
                                  {isCreator && (
                                    <button
                                      onClick={() => handleSelfCancel(b)}
                                      className="px-2 py-1 rounded-lg text-gray-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                                      title="Cancel My Booking"
                                    >
                                      <i className="ri-close-circle-line text-sm" />
                                      <span>Cancel</span>
                                    </button>
                                  )}

                                  {/* If Admin/HR and NOT own booking: Cancel with Reason modal */}
                                  {canApprove && !isCreator && isApproved && (
                                    <button
                                      onClick={() => openReasonModal(b, "cancel")}
                                      className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition cursor-pointer flex items-center gap-1"
                                      title="Admin Cancel with Reason & Notification"
                                    >
                                      <i className="ri-delete-bin-line text-sm" />
                                      <span>Cancel (Admin)</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setSelectedBooking(b)}
                                    className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                                    title="View Details"
                                  >
                                    <i className="ri-information-line text-base" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        /* ================= MONTH REVIEW CALENDAR ================= */
        <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm">
          {/* Calendar Header Day Names */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((dayName) => (
              <div
                key={dayName}
                className="py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Month Grid Cells */}
          <div className="grid grid-cols-7 divide-x divide-y divide-gray-100">
            {monthGridCells.map((dateStr, idx) => {
              if (!dateStr) {
                return (
                  <div
                    key={`empty-${idx}`}
                    className="min-h-[110px] sm:min-h-[125px] bg-gray-50/50 p-2 text-gray-300"
                  />
                );
              }

              const cellDate = new Date(`${dateStr}T00:00:00`);
              const dayNum = cellDate.getDate();
              const isCellToday = dateStr === toYMD(new Date());
              const isCellSelected = dateStr === selectedDate;
              const dayBookings = filteredBookings.filter((b) => b.date === dateStr);

              return (
                <div
                  key={dateStr}
                  onClick={() => {
                    setSelectedDate(dateStr);
                  }}
                  onDoubleClick={() => {
                    setSelectedDate(dateStr);
                    setViewMode("timeline");
                  }}
                  className={`min-h-[110px] sm:min-h-[125px] p-2 text-left transition relative group cursor-pointer ${
                    isCellToday
                      ? "bg-blue-50/40 ring-1 ring-inset ring-[#253C7D]/30"
                      : isCellSelected
                      ? "bg-slate-50"
                      : "hover:bg-gray-50/80"
                  }`}
                >
                  {/* Day Number Header */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        isCellToday
                          ? "bg-[#253C7D] text-white shadow-sm"
                          : isCellSelected
                          ? "bg-gray-800 text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {dayNum}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openBookModal(undefined, dateStr);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-md hover:bg-gray-200 text-gray-600 flex items-center justify-center text-xs transition cursor-pointer"
                      title="Book on this day"
                    >
                      <i className="ri-add-line" />
                    </button>
                  </div>

                  {/* Day Bookings List */}
                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map((b) => {
                      const room = rooms.find((r) => r.id === b.room_id);
                      const isPending = b.status === "pending";

                      return (
                        <div
                          key={b.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBooking(b);
                          }}
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md truncate border-l-2 shadow-xs transition hover:brightness-95 cursor-pointer ${
                            isPending ? "border-l-amber-500 bg-amber-50 text-amber-900" : ""
                          }`}
                          style={
                            !isPending
                              ? {
                                  backgroundColor: (room?.color || "#253C7D") + "18",
                                  borderColor: room?.color || "#253C7D",
                                  color: "#1E293B",
                                }
                              : undefined
                          }
                          title={`${room?.name || "Room"}: ${b.title} (${fmtTime(b.start_time)} - ${fmtTime(b.end_time)}) [${b.status}] - ${b.attendees_count || 1} ppl`}
                        >
                          <span className="font-bold mr-1">{fmtTime(b.start_time)}</span>
                          <span>{b.title}</span>
                        </div>
                      );
                    })}

                    {dayBookings.length > 3 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(dateStr);
                          setViewMode("timeline");
                        }}
                        className="text-[10px] font-bold text-[#253C7D] hover:underline px-1 block text-left cursor-pointer"
                      >
                        +{dayBookings.length - 3} more meetings
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= BOOKING CREATION MODAL ================= */}
      {modalRoom && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !saving && setModalRoom(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#253C7D] to-[#1E293B] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <i className={`${editingBooking ? "ri-edit-box-fill text-amber-400" : "ri-calendar-check-fill text-emerald-400"} text-xl`} />
                <div>
                  <h3 className="text-base font-bold">
                    {editingBooking ? "Edit Meeting Reservation" : "Reserve Meeting Room"}
                  </h3>
                  <p className="text-xs text-gray-300">
                    {editingBooking ? `Modifying "${editingBooking.title}"` : "Requires Admin / HR Manager approval"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!saving) {
                    setModalRoom(null);
                    setEditingBooking(null);
                  }
                }}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* 1. Room Selector Pills with Floor Indicators */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                    Select Room & Floor
                  </label>
                  <span className="text-[11px] font-semibold text-gray-500">
                    Floor 3: Training & Small · Floor 5: VIP
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {rooms.map((r) => {
                    const isSelected = modalRoom.id === r.id;
                    const floor = r.floor || ROOM_FLOORS[r.name] || 3;
                    const isVIP = r.name.includes("VIP") || floor === 5;

                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => {
                          setModalRoom(r);
                          if (r.capacity && bookingForm.attendees_count > r.capacity) {
                            setBookingForm({ ...bookingForm, attendees_count: r.capacity });
                          }
                        }}
                        className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-2 relative ${
                          isSelected
                            ? "border-[#253C7D] bg-[#253C7D]/5 ring-2 ring-[#253C7D]/20 shadow-xs"
                            : "border-gray-200 hover:border-gray-300 bg-gray-50/50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: r.color }}
                            />
                            <p className="text-xs font-bold text-gray-900 truncate">{r.name}</p>
                          </div>
                          {isSelected && (
                            <i className="ri-checkbox-circle-fill text-[#253C7D] text-sm shrink-0" />
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-1 text-[11px]">
                          <span
                            className={`font-bold px-1.5 py-0.5 rounded ${
                              isVIP
                                ? "bg-purple-100 text-purple-800 border border-purple-200"
                                : "bg-sky-100 text-sky-800 border border-sky-200"
                            }`}
                          >
                            Floor {floor}
                          </span>
                          <span className="text-gray-500 font-medium">{r.capacity} seats</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Room Location Banner */}
                <div className="mt-2.5 p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: modalRoom.color }}
                    />
                    <span className="font-bold text-gray-900">{modalRoom.name}</span>
                    <FloorBadge
                      floor={modalRoom.floor || 3}
                      size="sm"
                      isVIP={modalRoom.name.includes("VIP")}
                    />
                  </div>
                  <span className="text-gray-500 font-medium text-[11px]">
                    {modalRoom.floor === 5
                      ? "📍 5th Floor · Executive VIP Suite"
                      : modalRoom.name.toLowerCase().includes("training")
                      ? "📍 3rd Floor · Training & Workshop Hall"
                      : "📍 3rd Floor · Small Meeting Room"}
                  </span>
                </div>
              </div>

              {/* 2. Meeting Title */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                  Meeting Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ballangk Mall operation team Meeting"
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 transition font-medium"
                  autoFocus
                />
                {/* Quick Title Chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {QUICK_TITLES.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setBookingForm({ ...bookingForm, title: tag })}
                      className="px-2 py-0.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-medium transition cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Date & Time Range & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    value={bookingForm.date}
                    onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:border-[#253C7D] transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={bookingForm.start_time}
                    onChange={(e) => {
                      const newStart = e.target.value;
                      const newEnd = addMinutesToTime(newStart, 120);
                      setBookingForm({ ...bookingForm, start_time: newStart, end_time: newEnd });
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#253C7D] transition font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={bookingForm.end_time}
                    onChange={(e) => setBookingForm({ ...bookingForm, end_time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#253C7D] transition font-medium"
                  />
                </div>
              </div>

              {/* Duration Presets */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold text-gray-500 mr-1">Duration:</span>
                  {DURATION_OPTIONS.map((dur) => (
                    <button
                      key={dur.label}
                      type="button"
                      onClick={() => {
                        const newEnd = addMinutesToTime(bookingForm.start_time, dur.mins);
                        setBookingForm({ ...bookingForm, end_time: newEnd });
                      }}
                      className="px-2.5 py-1 rounded-lg border border-gray-200 hover:border-[#253C7D] hover:bg-[#253C7D]/5 text-xs font-bold text-gray-700 transition cursor-pointer"
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-[#253C7D] bg-blue-50 px-2 py-0.5 rounded">
                  {durationLabel}
                </span>
              </div>

              {/* 4. Number of Attendees */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Number of Attendees
                  </label>
                  <span className="text-[11px] text-gray-500">
                    Max capacity: {modalRoom.capacity || 20} ppl
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        setBookingForm({
                          ...bookingForm,
                          attendees_count: Math.max(1, (bookingForm.attendees_count || 1) - 1),
                        })
                      }
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-200 text-gray-700 transition cursor-pointer"
                    >
                      <i className="ri-subtract-line font-bold" />
                    </button>
                    <input
                      type="number"
                      min={1}
                      max={modalRoom.capacity || 50}
                      value={bookingForm.attendees_count}
                      onChange={(e) =>
                        setBookingForm({
                          ...bookingForm,
                          attendees_count: Math.max(1, parseInt(e.target.value, 10) || 1),
                        })
                      }
                      className="w-14 text-center font-bold text-sm bg-transparent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setBookingForm({
                          ...bookingForm,
                          attendees_count: Math.min(
                            modalRoom.capacity || 50,
                            (bookingForm.attendees_count || 1) + 1
                          ),
                        })
                      }
                      className="w-9 h-9 flex items-center justify-center hover:bg-gray-200 text-gray-700 transition cursor-pointer"
                    >
                      <i className="ri-add-line font-bold" />
                    </button>
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    {bookingForm.attendees_count} people attending
                  </span>
                </div>
              </div>

              {/* 5. Special Requirements (Multi-Select + Custom Request) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="ri-settings-3-line text-[#253C7D]" />
                    <span>Special Requirements & Equipment</span>
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() =>
                        setBookingForm({
                          ...bookingForm,
                          selected_requirements: SPECIAL_REQUIREMENTS_OPTIONS.map((o) => o.label),
                        })
                      }
                      className="text-[#253C7D] font-bold hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setBookingForm({
                          ...bookingForm,
                          selected_requirements: [],
                        })
                      }
                      className="text-gray-500 font-semibold hover:text-gray-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Multi-Select Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {SPECIAL_REQUIREMENTS_OPTIONS.map((opt) => {
                    const isSelected = bookingForm.selected_requirements.includes(opt.label);
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          const exists = bookingForm.selected_requirements.includes(opt.label);
                          const updated = exists
                            ? bookingForm.selected_requirements.filter((item) => item !== opt.label)
                            : [...bookingForm.selected_requirements, opt.label];
                          setBookingForm({ ...bookingForm, selected_requirements: updated });
                        }}
                        className={`px-2.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer text-left ${
                          isSelected
                            ? "bg-[#253C7D] border-[#253C7D] text-white shadow-xs"
                            : "bg-gray-50/70 border-gray-200 text-gray-700 hover:bg-gray-100/80 hover:border-gray-300"
                        }`}
                      >
                        <i
                          className={`text-sm shrink-0 ${
                            isSelected
                              ? "ri-checkbox-circle-fill text-emerald-300"
                              : `${opt.icon} text-gray-400`
                          }`}
                        />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Requirements Text */}
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Additional equipment or support details (e.g. Need IT support to setup HDMI adapter)..."
                    value={bookingForm.custom_requirements}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, custom_requirements: e.target.value })
                    }
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#253C7D] transition"
                  />
                </div>
              </div>

              {/* 6. Snacks & Refreshments (Multi-Select + Custom Request) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="ri-cup-line text-blue-600" />
                    <span>Snacks & Refreshments</span>
                  </label>
                  <div className="flex items-center gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() =>
                        setBookingForm({
                          ...bookingForm,
                          selected_refreshments: REFRESHMENTS_OPTIONS.map((o) => o.label),
                        })
                      }
                      className="text-[#253C7D] font-bold hover:underline cursor-pointer"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() =>
                        setBookingForm({
                          ...bookingForm,
                          selected_refreshments: [],
                        })
                      }
                      className="text-gray-500 font-semibold hover:text-gray-700 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* Multi-Select Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {REFRESHMENTS_OPTIONS.map((opt) => {
                    const isSelected = bookingForm.selected_refreshments.includes(opt.label);
                    return (
                      <button
                        key={opt.label}
                        type="button"
                        onClick={() => {
                          const exists = bookingForm.selected_refreshments.includes(opt.label);
                          const updated = exists
                            ? bookingForm.selected_refreshments.filter((item) => item !== opt.label)
                            : [...bookingForm.selected_refreshments, opt.label];
                          setBookingForm({ ...bookingForm, selected_refreshments: updated });
                        }}
                        className={`px-2.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition cursor-pointer text-left ${
                          isSelected
                            ? "bg-[#253C7D] border-[#253C7D] text-white shadow-xs"
                            : "bg-gray-50/70 border-gray-200 text-gray-700 hover:bg-gray-100/80 hover:border-gray-300"
                        }`}
                      >
                        <i
                          className={`text-sm shrink-0 ${
                            isSelected
                              ? "ri-checkbox-circle-fill text-emerald-300"
                              : `${opt.icon} text-gray-400`
                          }`}
                        />
                        <span className="truncate">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Refreshments Text */}
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="Additional refreshment requests (e.g. 10 bottles of cold water, extra cups)..."
                    value={bookingForm.custom_refreshments}
                    onChange={(e) =>
                      setBookingForm({ ...bookingForm, custom_refreshments: e.target.value })
                    }
                    className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#253C7D] transition"
                  />
                </div>
              </div>

              {/* Live Conflict Feedback */}
              {activeConflict ? (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                  <i className="ri-error-warning-fill text-rose-600 text-base shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Time Conflict Detected</p>
                    <p className="mt-0.5 text-rose-700">
                      "{activeConflict.title}" is already scheduled in {modalRoom.name} from{" "}
                      {fmtTime(activeConflict.start_time)} to {fmtTime(activeConflict.end_time)} by{" "}
                      {activeConflict.employees?.first_name || "another member"} ({activeConflict.status}).
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <i className="ri-checkbox-circle-fill text-emerald-600 text-base" />
                  <span className="font-semibold">
                    {modalRoom.name} is available for this slot.
                  </span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (!saving) {
                    setModalRoom(null);
                    setEditingBooking(null);
                  }
                }}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-bold transition cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBook}
                disabled={saving || !!activeConflict}
                className="px-5 py-2.5 rounded-xl bg-[#253C7D] hover:bg-[#1C2E60] text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>{editingBooking ? "Saving Changes..." : "Submitting..."}</span>
                  </>
                ) : (
                  <>
                    <i className={editingBooking ? "ri-save-3-line text-base" : "ri-send-plane-fill text-base"} />
                    <span>{editingBooking ? "Save Changes" : "Submit Reservation Request"}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= REASON MODAL (ADMIN / HR REJECT OR CANCEL ONLY) ================= */}
      {reasonModal.isOpen && reasonModal.booking && canApprove && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[70] flex items-center justify-center p-4"
          onClick={() => !processingAction && setReasonModal({ ...reasonModal, isOpen: false })}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden transform transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-rose-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <i className="ri-error-warning-line text-xl" />
                <div>
                  <h3 className="text-base font-bold">
                    {reasonModal.action === "reject" ? "Reject Room Booking" : "Cancel Approved Booking"}
                  </h3>
                  <p className="text-xs text-rose-100">
                    A notification with this reason will be sent to the employee
                  </p>
                </div>
              </div>
              <button
                onClick={() => !processingAction && setReasonModal({ ...reasonModal, isOpen: false })}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                <p className="font-bold text-gray-900">{reasonModal.booking.title}</p>
                <p className="text-gray-600 mt-0.5">
                  Booked by:{" "}
                  <span className="font-semibold text-gray-800">
                    {reasonModal.booking.employees
                      ? `${reasonModal.booking.employees.first_name} ${reasonModal.booking.employees.last_name}`
                      : "Employee"}
                  </span>{" "}
                  ({reasonModal.booking.employees?.department || "General"})
                </p>
                <p className="text-gray-500 mt-0.5">
                  {reasonModal.booking.date} · {fmtTime(reasonModal.booking.start_time)} to{" "}
                  {fmtTime(reasonModal.booking.end_time)}
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block mb-1.5">
                  Reason for {reasonModal.action === "reject" ? "Rejection" : "Cancellation"} <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={reasonModal.reason}
                  onChange={(e) => setReasonModal({ ...reasonModal, reason: e.target.value })}
                  placeholder="Explain why this reservation is being cancelled or rejected..."
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-rose-500 transition"
                  autoFocus
                />

                {/* Preset Reasons */}
                <div className="mt-2">
                  <span className="text-[11px] font-semibold text-gray-500 block mb-1">
                    Quick Preset Reasons:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_CANCELLATION_REASONS.map((pr) => (
                      <button
                        key={pr}
                        type="button"
                        onClick={() => setReasonModal({ ...reasonModal, reason: pr })}
                        className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] text-left transition cursor-pointer"
                      >
                        {pr}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                <i className="ri-information-line text-blue-600 text-sm mt-0.5 shrink-0" />
                <p>
                  After cancellation, this time slot will be <strong>immediately released</strong> on the calendar so that the employee (or anyone else) can book again!
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => !processingAction && setReasonModal({ ...reasonModal, isOpen: false })}
                disabled={processingAction}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-bold transition cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={confirmReasonAction}
                disabled={processingAction || !reasonModal.reason.trim()}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {processingAction ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-delete-bin-line text-sm" />
                    <span>Confirm & Notify Employee</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= APPROVAL REVIEW MODAL (ADMIN / HR SELECTIVE APPROVAL) ================= */}
      {approvalModal.isOpen && approvalModal.booking && canApprove && (
        <div
          className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[70] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !processingAction && setApprovalModal({ ...approvalModal, isOpen: false })}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 overflow-hidden transform transition-all my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <i className="ri-checkbox-circle-fill text-xl text-emerald-200" />
                <div>
                  <h3 className="text-base font-bold">Review & Approve Reservation</h3>
                  <p className="text-xs text-emerald-100">
                    Selectively approve or decline requested items
                  </p>
                </div>
              </div>
              <button
                onClick={() => !processingAction && setApprovalModal({ ...approvalModal, isOpen: false })}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
              >
                <i className="ri-close-line text-xl" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
              {/* Booker Info & Room Location */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                {(() => {
                  const bRoom = rooms.find((r) => r.id === approvalModal.booking.room_id);
                  const bFloor = bRoom?.floor || (bRoom?.name?.includes("VIP") ? 5 : 3);
                  return (
                    <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-200/70">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bRoom?.color || "#253C7D" }} />
                        <span className="font-bold text-slate-900 text-sm">{bRoom?.name || "Meeting Room"}</span>
                      </div>
                      <FloorBadge floor={bFloor} size="sm" isVIP={bRoom?.name?.includes("VIP")} />
                    </div>
                  );
                })()}
                <p className="font-bold text-slate-900 text-sm">{approvalModal.booking.title}</p>
                <p className="text-slate-600 mt-0.5">
                  Booked by:{" "}
                  <span className="font-semibold text-slate-800">
                    {approvalModal.booking.employees
                      ? `${approvalModal.booking.employees.first_name} ${approvalModal.booking.employees.last_name}`
                      : "Employee"}
                  </span>{" "}
                  ({approvalModal.booking.employees?.department || "General"})
                </p>
                <p className="text-slate-500 mt-0.5">
                  {approvalModal.booking.date} · {fmtTime(approvalModal.booking.start_time)} to{" "}
                  {fmtTime(approvalModal.booking.end_time)} · {approvalModal.booking.attendees_count || 1} attendees
                </p>
              </div>

              {/* Special Requirements Approval Checklist */}
              {(() => {
                const raw = approvalModal.booking.special_requirements;
                const items = (raw || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter((s) => s && s !== "None");

                if (items.length === 0) return null;

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <i className="ri-settings-3-line text-[#253C7D]" />
                        <span>Special Requirements & Equipment</span>
                      </label>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            setApprovalModal((prev) => ({
                              ...prev,
                              approvedReqs: items,
                              declinedReqs: [],
                            }));
                          }}
                          className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                        >
                          Approve All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setApprovalModal((prev) => ({
                              ...prev,
                              approvedReqs: [],
                              declinedReqs: items,
                            }));
                          }}
                          className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                        >
                          Decline All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {items.map((item) => {
                        const isApproved = approvalModal.approvedReqs.includes(item);
                        return (
                          <div
                            key={item}
                            onClick={() => toggleRequirementApproval(item)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer select-none ${
                              isApproved
                                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 hover:bg-emerald-50"
                                : "bg-rose-50/50 border-rose-300 text-rose-900 hover:bg-rose-50 opacity-85"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <i
                                className={`text-base ${
                                  isApproved
                                    ? "ri-checkbox-circle-fill text-emerald-600"
                                    : "ri-close-circle-fill text-rose-500"
                                }`}
                              />
                              <span className={`font-semibold ${!isApproved ? "line-through text-slate-500" : ""}`}>
                                {item}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                isApproved
                                  ? "bg-emerald-200/70 text-emerald-800"
                                  : "bg-rose-200/70 text-rose-800"
                              }`}
                            >
                              {isApproved ? "Approved" : "Declined"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Snacks & Refreshments Approval Checklist */}
              {(() => {
                const raw = approvalModal.booking.refreshments;
                const items = (raw || "")
                  .split(",")
                  .map((s) => s.trim())
                  .filter((s) => s && s !== "None");

                if (items.length === 0) return null;

                return (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <i className="ri-cup-line text-blue-600" />
                        <span>Snacks & Refreshments</span>
                      </label>
                      <div className="flex items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => {
                            setApprovalModal((prev) => ({
                              ...prev,
                              approvedRef: items,
                              declinedRef: [],
                            }));
                          }}
                          className="text-emerald-700 hover:text-emerald-900 font-bold cursor-pointer"
                        >
                          Approve All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={() => {
                            setApprovalModal((prev) => ({
                              ...prev,
                              approvedRef: [],
                              declinedRef: items,
                            }));
                          }}
                          className="text-rose-600 hover:text-rose-800 font-bold cursor-pointer"
                        >
                          Decline All
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {items.map((item) => {
                        const isApproved = approvalModal.approvedRef.includes(item);
                        return (
                          <div
                            key={item}
                            onClick={() => toggleRefreshmentApproval(item)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between transition cursor-pointer select-none ${
                              isApproved
                                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 hover:bg-emerald-50"
                                : "bg-rose-50/50 border-rose-300 text-rose-900 hover:bg-rose-50 opacity-85"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <i
                                className={`text-base ${
                                  isApproved
                                    ? "ri-checkbox-circle-fill text-emerald-600"
                                    : "ri-close-circle-fill text-rose-500"
                                }`}
                              />
                              <span className={`font-semibold ${!isApproved ? "line-through text-slate-500" : ""}`}>
                                {item}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                isApproved
                                  ? "bg-emerald-200/70 text-emerald-800"
                                  : "bg-rose-200/70 text-rose-800"
                              }`}
                            >
                              {isApproved ? "Approved" : "Declined"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* Admin Note / Instructions */}
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Approval Notes / Instructions for Employee (Optional)
                </label>
                <textarea
                  rows={2}
                  value={approvalModal.notes}
                  onChange={(e) => setApprovalModal({ ...approvalModal, notes: e.target.value })}
                  placeholder="e.g. Bottled water will be prepared. Projector is undergoing maintenance..."
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => !processingAction && setApprovalModal({ ...approvalModal, isOpen: false })}
                disabled={processingAction}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={processingAction}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {processingAction ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-check-double-line text-sm" />
                    <span>Confirm & Approve</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= BOOKING DETAILS DRAWER / MODAL ================= */}
      {selectedBooking && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedBooking(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            {(() => {
              const room = rooms.find((r) => r.id === selectedBooking.room_id);
              const isCreator =
                selectedBooking.booked_by === employeeId ||
                (!!user?.email && selectedBooking.employees?.email === user.email);
              const isPending = selectedBooking.status === "pending";
              const isApproved = selectedBooking.status === "approved";
              const isCancelled = selectedBooking.status === "cancelled" || selectedBooking.status === "rejected";

              // Approved & Declined lists
              const approvedReqList = selectedBooking.approved_requirements
                ? selectedBooking.approved_requirements.split(",").map((s) => s.trim()).filter((s) => s && s !== "None")
                : (isApproved && selectedBooking.special_requirements ? selectedBooking.special_requirements.split(",").map((s) => s.trim()).filter((s) => s && s !== "None") : []);
              const declinedReqList = selectedBooking.declined_requirements
                ? selectedBooking.declined_requirements.split(",").map((s) => s.trim()).filter(Boolean)
                : [];

              const approvedRefList = selectedBooking.approved_refreshments
                ? selectedBooking.approved_refreshments.split(",").map((s) => s.trim()).filter((s) => s && s !== "None")
                : (isApproved && selectedBooking.refreshments ? selectedBooking.refreshments.split(",").map((s) => s.trim()).filter((s) => s && s !== "None") : []);
              const declinedRefList = selectedBooking.declined_refreshments
                ? selectedBooking.declined_refreshments.split(",").map((s) => s.trim()).filter(Boolean)
                : [];

              return (
                <>
                  <div
                    className="p-5 sm:p-6 text-white relative"
                    style={{
                      backgroundColor: isPending
                        ? "#D97706"
                        : isCancelled
                        ? "#64748B"
                        : room?.color || "#253C7D",
                    }}
                  >
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition cursor-pointer"
                    >
                      <i className="ri-close-line text-lg" />
                    </button>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/80">
                      <i className="ri-door-open-line" />
                      <span>{room?.name || "Meeting Room"}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase">
                        Floor {room?.floor || (room?.name?.includes("VIP") ? 5 : 3)}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase">
                        {selectedBooking.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mt-1.5">{selectedBooking.title}</h3>
                    <p className="text-xs text-white/90 mt-1 flex items-center gap-1.5 font-medium">
                      <i className="ri-time-line" />
                      <span>
                        {fmtTime(selectedBooking.start_time)} – {fmtTime(selectedBooking.end_time)}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(`${selectedBooking.date}T00:00:00`).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </p>
                  </div>

                  {/* Body */}
                  <div className="p-5 sm:p-6 space-y-3.5 text-xs max-h-[65vh] overflow-y-auto">
                    {/* Location Card */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#253C7D] shadow-2xs">
                          <i className="ri-map-pin-2-line text-base" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-xs">
                            {room?.name} · Floor {room?.floor || (room?.name?.includes("VIP") ? 5 : 3)}
                          </p>
                          <p className="text-slate-500 text-[11px]">
                            {room?.floor === 5
                              ? "5th Floor Executive VIP Suite"
                              : room?.name.toLowerCase().includes("training")
                              ? "3rd Floor Training & Workshop Hall"
                              : "3rd Floor Small Meeting Room"}
                          </p>
                        </div>
                      </div>
                      <FloorBadge
                        floor={room?.floor || (room?.name?.includes("VIP") ? 5 : 3)}
                        size="md"
                        isVIP={room?.name?.includes("VIP")}
                      />
                    </div>

                    {/* Booker profile card */}
                    <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <div className="flex items-center gap-3">
                        {selectedBooking.employees?.avatar_url ? (
                          <img
                            src={selectedBooking.employees.avatar_url}
                            alt="Booker"
                            className="w-10 h-10 rounded-full object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#253C7D] to-[#1E293B] text-white font-bold flex items-center justify-center text-sm shadow-xs">
                            {selectedBooking.employees?.first_name?.[0] || "U"}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 text-sm">
                            {selectedBooking.employees
                              ? `${selectedBooking.employees.first_name} ${selectedBooking.employees.last_name}`
                              : "Unknown Member"}
                          </p>
                          <p className="text-slate-500 text-xs">
                            {selectedBooking.employees?.role || "Staff"} ·{" "}
                            <span className="font-medium text-slate-700">
                              {selectedBooking.employees?.department || "General"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">
                        Organizer
                      </span>
                    </div>

                    {/* Quick Metric Stats (Attendees & Duration side by side) */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] uppercase tracking-wider mb-1">
                          <i className="ri-team-line text-[#253C7D] text-sm" />
                          <span>Attendees</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                          {selectedBooking.attendees_count || 1} people{" "}
                          <span className="text-xs text-slate-400 font-normal">
                            (max {room?.capacity || "—"})
                          </span>
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold text-[11px] uppercase tracking-wider mb-1">
                          <i className="ri-timer-line text-indigo-600 text-sm" />
                          <span>Duration</span>
                        </div>
                        <p className="text-sm font-bold text-slate-900">
                          {Math.round(
                            timeToMinutes(selectedBooking.end_time) - timeToMinutes(selectedBooking.start_time)
                          )}{" "}
                          minutes
                        </p>
                      </div>
                    </div>

                    {/* Snacks & Refreshments structured chips */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <i className="ri-cup-line text-blue-600 text-sm" />
                          <span>Snacks & Refreshments</span>
                        </span>
                        {isApproved && (declinedRefList.length > 0 || approvedRefList.length > 0) && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Reviewed by Admin
                          </span>
                        )}
                      </div>

                      {/* Display for Approved Booking with selective approved/declined */}
                      {isApproved && (approvedRefList.length > 0 || declinedRefList.length > 0) ? (
                        <div className="flex flex-wrap gap-1.5">
                          {approvedRefList.map((item) => (
                            <span
                              key={item}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50/80 text-emerald-900 font-semibold text-xs border border-emerald-200 shadow-2xs flex items-center gap-1.5"
                            >
                              <i className="ri-checkbox-circle-fill text-emerald-600 text-xs" />
                              <span>{item}</span>
                              <span className="text-[10px] bg-emerald-200/60 text-emerald-800 font-bold px-1 rounded">Approved</span>
                            </span>
                          ))}
                          {declinedRefList.map((item) => (
                            <span
                              key={item}
                              className="px-2.5 py-1 rounded-lg bg-rose-50/80 text-rose-800 font-semibold text-xs border border-rose-200 line-through opacity-75 flex items-center gap-1.5"
                            >
                              <i className="ri-close-circle-fill text-rose-500 text-xs" />
                              <span>{item}</span>
                              <span className="text-[10px] bg-rose-200/70 text-rose-800 font-bold px-1 rounded no-underline">Declined</span>
                            </span>
                          ))}
                        </div>
                      ) : selectedBooking.refreshments && selectedBooking.refreshments !== "None" ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedBooking.refreshments.split(",").map((item) => {
                            const trimmed = item.trim();
                            if (!trimmed) return null;
                            const isWater = /water/i.test(trimmed);
                            const isCoffee = /coffee|tea/i.test(trimmed);
                            const isPastry = /pastr|snack|food/i.test(trimmed);
                            const isFruit = /fruit/i.test(trimmed);

                            return (
                              <span
                                key={trimmed}
                                className="px-2.5 py-1 rounded-lg bg-white text-slate-800 font-semibold text-xs border border-slate-200 shadow-2xs flex items-center gap-1.5"
                              >
                                <i
                                  className={`text-xs ${
                                    isWater
                                      ? "ri-drop-line text-sky-500"
                                      : isCoffee
                                      ? "ri-cup-line text-amber-600"
                                      : isPastry
                                      ? "ri-restaurant-line text-emerald-600"
                                      : isFruit
                                      ? "ri-cake-line text-rose-500"
                                      : "ri-goblet-line text-blue-600"
                                  }`}
                                />
                                <span>{trimmed}</span>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs italic">No refreshments requested.</p>
                      )}
                    </div>

                    {/* Special Requirements structured chips */}
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                          <i className="ri-settings-3-line text-[#253C7D] text-sm" />
                          <span>Special Requirements & Equipment</span>
                        </span>
                        {isApproved && (declinedReqList.length > 0 || approvedReqList.length > 0) && (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            Reviewed by Admin
                          </span>
                        )}
                      </div>

                      {/* Display for Approved Booking with selective approved/declined */}
                      {isApproved && (approvedReqList.length > 0 || declinedReqList.length > 0) ? (
                        <div className="flex flex-wrap gap-1.5">
                          {approvedReqList.map((item) => (
                            <span
                              key={item}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50/80 text-emerald-900 font-semibold text-xs border border-emerald-200 shadow-2xs flex items-center gap-1.5"
                            >
                              <i className="ri-checkbox-circle-fill text-emerald-600 text-xs" />
                              <span>{item}</span>
                              <span className="text-[10px] bg-emerald-200/60 text-emerald-800 font-bold px-1 rounded">Approved</span>
                            </span>
                          ))}
                          {declinedReqList.map((item) => (
                            <span
                              key={item}
                              className="px-2.5 py-1 rounded-lg bg-rose-50/80 text-rose-800 font-semibold text-xs border border-rose-200 line-through opacity-75 flex items-center gap-1.5"
                            >
                              <i className="ri-close-circle-fill text-rose-500 text-xs" />
                              <span>{item}</span>
                              <span className="text-[10px] bg-rose-200/70 text-rose-800 font-bold px-1 rounded no-underline">Declined</span>
                            </span>
                          ))}
                        </div>
                      ) : selectedBooking.special_requirements && selectedBooking.special_requirements !== "None" ? (
                        <div className="flex flex-wrap gap-1.5">
                          {selectedBooking.special_requirements.split(",").map((item) => {
                            const trimmed = item.trim();
                            if (!trimmed) return null;
                            const isSupport = /support|help/i.test(trimmed);
                            const isCam = /camera|mic/i.test(trimmed);
                            const isProjector = /projector|screen|display/i.test(trimmed);
                            const isVideo = /video|zoom|teams/i.test(trimmed);
                            const isBoard = /whiteboard|marker/i.test(trimmed);
                            const isPower = /power|outlet|plug/i.test(trimmed);
                            const isChair = /chair|seat/i.test(trimmed);

                            return (
                              <span
                                key={trimmed}
                                className="px-2.5 py-1 rounded-lg bg-white text-slate-800 font-semibold text-xs border border-slate-200 shadow-2xs flex items-center gap-1.5"
                              >
                                <i
                                  className={`text-xs ${
                                    isSupport
                                      ? "ri-customer-service-2-line text-blue-600"
                                      : isCam
                                      ? "ri-camera-line text-indigo-600"
                                      : isProjector
                                      ? "ri-tv-line text-purple-600"
                                      : isVideo
                                      ? "ri-vidicon-line text-sky-600"
                                      : isBoard
                                      ? "ri-artboard-line text-emerald-600"
                                      : isPower
                                      ? "ri-plug-line text-amber-600"
                                      : isChair
                                      ? "ri-armchair-line text-teal-600"
                                      : "ri-tools-line text-indigo-600"
                                  }`}
                                />
                                <span>{trimmed}</span>
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-slate-400 text-xs italic">No special equipment requested.</p>
                      )}
                    </div>

                    {/* Admin Approval Note / Instructions if available */}
                    {selectedBooking.approval_notes && (
                      <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-blue-950">
                        <p className="font-bold flex items-center gap-1.5 text-blue-800 text-xs">
                          <i className="ri-information-fill text-blue-600" />
                          Admin Approval Note:
                        </p>
                        <p className="mt-1 text-xs text-blue-900 leading-relaxed font-medium">
                          {selectedBooking.approval_notes}
                        </p>
                      </div>
                    )}

                    {/* Cancellation / Rejection reason message if cancelled */}
                    {selectedBooking.rejection_reason && (
                      <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
                        <p className="font-bold flex items-center gap-1 text-rose-700">
                          <i className="ri-error-warning-line" />
                          Cancellation / Rejection Reason:
                        </p>
                        <p className="mt-1 text-xs">{selectedBooking.rejection_reason}</p>
                      </div>
                    )}

                    {/* Room Built-in Amenities */}
                    {room?.amenities && room.amenities.length > 0 && (
                      <div className="pt-1">
                        <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider block mb-1.5">
                          Room Built-in Equipment
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {room.amenities.map((a) => (
                            <span
                              key={a}
                              className="px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[11px] font-medium flex items-center gap-1 border border-slate-200/50"
                            >
                              <i className="ri-check-line text-emerald-600 text-xs" />
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="px-5 sm:px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `Meeting: ${selectedBooking.title}\nRoom: ${room?.name}\nDate: ${selectedBooking.date}\nTime: ${fmtTime(
                            selectedBooking.start_time
                          )} - ${fmtTime(selectedBooking.end_time)}\nAttendees: ${selectedBooking.attendees_count || 1}\nRefreshments: ${selectedBooking.refreshments || "None"}\nRequirements: ${selectedBooking.special_requirements || "None"}\nStatus: ${selectedBooking.status}`
                        );
                        showToast("info", "Meeting details copied to clipboard!");
                      }}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer py-1"
                    >
                      <i className="ri-file-copy-line text-sm" />
                      Copy Info
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* ONLY Admin/HR can Approve */}
                      {canApprove && isPending && (
                        <button
                          type="button"
                          onClick={() => openApprovalModal(selectedBooking)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer flex items-center gap-1"
                        >
                          <i className="ri-check-line text-sm" />
                          <span>Approve</span>
                        </button>
                      )}

                      {/* ONLY Admin/HR can Reject with reason */}
                      {canApprove && isPending && (
                        <button
                          type="button"
                          onClick={() => openReasonModal(selectedBooking, "reject")}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition cursor-pointer flex items-center gap-1"
                        >
                          <i className="ri-close-line text-sm" />
                          <span>Reject</span>
                        </button>
                      )}

                      {/* Edit Booking Button (ONLY for the creator while pending approval) */}
                      {isCreator && isPending && (
                        <button
                          type="button"
                          onClick={() => openEditModal(selectedBooking)}
                          className="px-3 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#253C7D] font-bold text-xs border border-blue-200 transition cursor-pointer flex items-center gap-1"
                        >
                          <i className="ri-edit-line text-sm" />
                          <span>Edit Booking</span>
                        </button>
                      )}

                      {/* Employee self-cancellation: direct normal cancel for creator */}
                      {isCreator && !isCancelled && (
                        <button
                          type="button"
                          onClick={() => handleSelfCancel(selectedBooking)}
                          className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 font-bold text-xs border border-slate-200 transition cursor-pointer flex items-center gap-1"
                        >
                          <i className="ri-close-circle-line text-sm" />
                          <span>Cancel Booking</span>
                        </button>
                      )}

                      {/* Admin/HR Cancel another employee's approved booking with Reason modal */}
                      {canApprove && !isCreator && isApproved && (
                        <button
                          type="button"
                          onClick={() => openReasonModal(selectedBooking, "cancel")}
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition cursor-pointer flex items-center gap-1"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                          <span>Cancel Booking</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedBooking(null)}
                        className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

export interface MeetingRoom {
  id: string;
  name: string;
  capacity: number | null;
  color: string;
  floor?: number;
  branch_id?: string | null;
  deleted_at?: string | null;
  amenities?: string[];
}

export interface BookingEmployee {
  id?: string;
  first_name: string;
  last_name: string;
  department: string;
  role?: string;
  avatar_url?: string | null;
  email?: string;
  branch_id?: string | null;
}

export interface Booking {
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

export interface BookingFormData {
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  attendees_count: number;
  selected_requirements: string[];
  custom_requirements: string;
  selected_refreshments: string[];
  custom_refreshments: string;
}

export interface ReasonModalState {
  isOpen: boolean;
  booking: Booking | null;
  action: "reject" | "cancel";
  reason: string;
}

export interface ApprovalModalState {
  isOpen: boolean;
  booking: Booking | null;
  approvedReqs: string[];
  declinedReqs: string[];
  approvedRef: string[];
  declinedRef: string[];
  notes: string;
}

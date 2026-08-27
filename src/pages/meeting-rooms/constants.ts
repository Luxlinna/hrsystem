import type { BookingFormData } from "./types";

export const ROOM_FLOORS: Record<string, number> = {
  "Small Meeting Room": 3,
  "Training Room": 3,
  "VIP Room": 5,
  "Big Meeting Room": 5,
};

export const ROOM_FLOOR_DESCRIPTIONS: Record<string, string> = {
  "Small Meeting Room": "Floor 3 · Team Sync, Interviews & Quick Huddles",
  "Training Room": "Floor 3 · Workshops, Seminars & Large Training Sessions",
  "VIP Room": "Floor 5 · Executive Board & VIP Presentations",
};

export const ROOM_AMENITIES: Record<string, string[]> = {
  "Small Meeting Room": ["4K Display TV", "Polycom Conference Mic", "Whiteboard", "High-speed Wi-Fi", "AC Climate"],
  "VIP Room": ["Dual 75\" 4K Displays", "Cisco Video Conf System", "Interactive Smartboard", "Conference Mic Array", "AC Climate"],
  "Big Meeting Room": ["Dual 75\" 4K Displays", "Cisco Video Conf System", "Interactive Smartboard", "Conference Mic Array", "AC Climate"],
  "Training Room": ["Dual 4K Projector & Screens", "Wireless Mics & Audio PA", "Modular Desks & Chairs", "Trainer Podium & Clicker", "High-speed Wi-Fi", "AC Climate"],
};

export const DEFAULT_AMENITIES = ["4K Display", "Video Conference", "Whiteboard", "High-speed Wi-Fi"];

export const QUICK_TITLES = [
  "Operation Team Meeting",
  "Ballangk Mall Sync",
  "Client Presentation",
  "Sprint Standup",
  "Design Review",
  "1-on-1 Check-in",
  "Interview",
  "Budget Review",
];

export const DURATION_OPTIONS = [
  { label: "15m", mins: 15 },
  { label: "30m", mins: 30 },
  { label: "45m", mins: 45 },
  { label: "1 hr", mins: 60 },
  { label: "1.5 hr", mins: 90 },
  { label: "2 hr", mins: 120 },
  { label: "3 hr", mins: 180 },
];

export const SPECIAL_REQUIREMENTS_OPTIONS = [
  { label: "IT Support Assistance", icon: "ri-customer-service-2-line" },
  { label: "4K Camera & Conf Mic", icon: "ri-camera-line" },
  { label: "Projector & Screen", icon: "ri-tv-line" },
  { label: "Video Conference (Zoom/Teams)", icon: "ri-vidicon-line" },
  { label: "Whiteboard & Markers", icon: "ri-artboard-line" },
  { label: "Extra Power Outlets", icon: "ri-plug-line" },
  { label: "Extra Chairs", icon: "ri-armchair-line" },
  { label: "Wireless Presenter Clicker", icon: "ri-remote-control-line" },
];

export const REFRESHMENTS_OPTIONS = [
  { label: "Bottled Drinking Water", icon: "ri-drop-line" },
  { label: "Hot Coffee & Tea", icon: "ri-cup-line" },
  { label: "Fresh Pastries & Snacks", icon: "ri-restaurant-line" },
  { label: "Fresh Fruit Platter", icon: "ri-cake-line" },
];

export const PRESET_CANCELLATION_REASONS = [
  "Executive management urgent priority meeting",
  "Technical maintenance / AV equipment repair in room",
  "Room schedule reallocation for corporate event",
  "Facility maintenance & air conditioning servicing",
  "Double booked / scheduling conflict",
];

export const TIMELINE_HOURS = Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00

export const INITIAL_BOOKING_FORM: BookingFormData = {
  title: "",
  date: "",
  start_time: "14:00",
  end_time: "16:00",
  attendees_count: 5,
  selected_requirements: ["IT Support Assistance", "4K Camera & Conf Mic"],
  custom_requirements: "",
  selected_refreshments: ["Bottled Drinking Water"],
  custom_refreshments: "",
};

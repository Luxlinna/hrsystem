export interface ScheduleTemplateDayAssignment {
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
  sat: string;
  sun: string;
}

export interface ScheduleTemplate {
  id: string;
  title: string;
  site_id?: string;
  site_name?: string;
  days: ScheduleTemplateDayAssignment;
  total_employee: number;
  assigned_employee_ids: string[];
  remark?: string;
  status: "Active" | "Disabled";
  created_at?: string;
}

export const AVAILABLE_SHIFT_OPTIONS = [
  { code: "OFF", label: "OFF - Day Off", color: "bg-gray-100 text-gray-600" },
  { code: "1704", label: "1704 - 07:00 PM - 04:00 AM (Overnight)", color: "bg-amber-100 text-amber-800" },
  { code: "2005", label: "2005 - 08:00 PM - 05:00 AM (Overnight, Break: 60m)", color: "bg-rose-100 text-rose-800" },
  { code: "TH13", label: "TH13 - 07:00 PM - 04:00 AM (Scan Break 4x)", color: "bg-indigo-100 text-indigo-800" },
  { code: "F053", label: "F053 - 05:30 AM - 02:30 PM (Morning)", color: "bg-emerald-100 text-emerald-800" },
  { code: "FAI1", label: "FAI1 - 07:00 AM - 11:00 PM & 06:30 PM - 10:30 PM (Split)", color: "bg-orange-100 text-orange-800" },
  { code: "FAI2", label: "FAI2 - 07:00 AM - 11:00 PM & 06:00 PM - 10:00 PM", color: "bg-orange-100 text-orange-800" },
  { code: "FAI3", label: "FAI3 - 06:00 AM - 11:00 AM & 05:00 PM - 08:00 PM", color: "bg-orange-100 text-orange-800" },
  { code: "0812", label: "0812 - 08:00 AM - 12:00 PM (Part Time 4h)", color: "bg-pink-100 text-pink-800" },
  { code: "1204", label: "1204 - 12:00 PM - 04:00 PM (Afternoon 4h)", color: "bg-yellow-100 text-yellow-800" },
  { code: "NMS1", label: "NMS1 - 09:00 AM - 06:00 PM (Standard 8h)", color: "bg-blue-100 text-blue-800" },
  { code: "NMS2", label: "NMS2 - 11:00 AM - 08:00 PM (Scan Break)", color: "bg-sky-100 text-sky-800" },
  { code: "RPS2", label: "RPS2 - 11:30 AM - 08:30 PM (Scan Break)", color: "bg-blue-100 text-blue-800" },
];

export const INITIAL_SCHEDULE_TEMPLATES: ScheduleTemplate[] = [];

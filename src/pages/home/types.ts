export interface DateRange {
  from: string; // ISO date string YYYY-MM-DD
  to: string;   // ISO date string YYYY-MM-DD
  label: string;
}

export interface LiveStats {
  branches: number;
  employees: number;
  activeEmployees: number;
  onboardingPending: number;
  leavePending: number;
  payrollProcessed: number;
  payrollTotal: number;
  openJobs: number;
  totalCandidates: number;
  hiredThisMonth: number;
  notificationsUnread: number;
}

export interface HrKpiState {
  attendanceRate: number;
  avgHoursWorked: number;
  lateRate: number;
  trainingCompletionRate: number;
  openDisciplinaryCases: number;
  inProgressTrainings: number;
  attendanceTrend: { day: string; rate: number }[];
}

export interface AttendanceBucket {
  day: string;
  present: number;
  absent: number;
  late: number;
}

export interface HiringTrendItem {
  month: string;
  hires: number;
  terminations: number;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  content?: string;
  category: string;
  pinned: boolean;
  published_at: string;
  author_name?: string;
}

export interface QuickActionItem {
  label: string;
  icon: string;
  path: string;
  module: string;
  color: string;
  note: string;
}

export interface AdminActionItem {
  label: string;
  icon: string;
  path: string;
  module: string;
}

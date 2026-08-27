export const CATEGORY_CONFIG: Record<
  string,
  { color: string; bg: string; icon: string; label: string; desc: string }
> = {
  news: { color: "text-slate-600", bg: "bg-slate-100 border-slate-200", icon: "ri-newspaper-line", label: "Company News", desc: "General releases & milestones" },
  event: { color: "text-[#253C7D]", bg: "bg-[#253C7D]/10 border-[#253C7D]/20", icon: "ri-calendar-event-line", label: "Event", desc: "Townhalls, parties & dates" },
  policy: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "ri-file-text-line", label: "Policy", desc: "SOPs & rule changes" },
  benefits: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", icon: "ri-heart-pulse-line", label: "Benefits & Perks", desc: "Health, insurance & rewards" },
  compliance: { color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: "ri-shield-check-line", label: "Compliance", desc: "Legal, safety & audits" },
  hr: { color: "text-[#253C7D]", bg: "bg-[#253C7D]/10 border-[#253C7D]/20", icon: "ri-user-settings-line", label: "HR Updates", desc: "Staffing, shifts & org notes" },
  general: { color: "text-slate-600", bg: "bg-slate-100 border-slate-200", icon: "ri-information-line", label: "General Notice", desc: "General information" },
};

export const PRIORITY_CONFIG: Record<
  string,
  { label: string; badge: string; dot: string; desc: string }
> = {
  normal: { label: "Normal", badge: "bg-gray-100 text-gray-700 border-gray-200 font-medium", dot: "bg-gray-400", desc: "Standard feed update" },
  high: { label: "High Priority", badge: "bg-amber-50 text-amber-700 border-amber-200 font-bold", dot: "bg-amber-500", desc: "Highlighted on boards" },
  urgent: { label: "Urgent Alert", badge: "bg-rose-50 text-rose-700 border-rose-200 ring-1 ring-rose-500/20 font-black", dot: "bg-rose-500", desc: "Requires staff acknowledgment" },
};

export const AUDIENCE_CONFIG: Record<
  string,
  { label: string; badge: string; icon: string }
> = {
  all: { label: "All Employees", badge: "bg-gray-100 text-gray-600 border-gray-200", icon: "ri-global-line" },
  hq: { label: "HQ Staff Only", badge: "bg-gray-100 text-gray-600 border-gray-200", icon: "ri-building-line" },
  management: { label: "Management Only", badge: "bg-[#253C7D]/10 text-[#253C7D] border-[#253C7D]/20", icon: "ri-shield-user-line" },
};

export const QUICK_EMOJIS = ["📢", "🎉", "🚨", "📅", "💡", "📌", "🎯", "⚠️", "🌟", "🏆"] as const;

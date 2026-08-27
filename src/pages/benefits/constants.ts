export const PLAN_TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; color: string; bg: string }
> = {
  health: { label: "Medical Health", icon: "ri-heart-pulse-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  dental: { label: "Dental Care", icon: "ri-empathize-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  vision: { label: "Vision & Optical", icon: "ri-eye-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  life: { label: "Life Insurance", icon: "ri-shield-star-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  retirement: { label: "Retirement & 401(k)", icon: "ri-safe-2-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  commuter: { label: "Commuter & Transit", icon: "ri-car-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  wellness: { label: "Wellness & Gym", icon: "ri-run-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  other: { label: "Other Perk", icon: "ri-gift-line", color: "text-slate-600", bg: "bg-slate-100" },
};

export const initials = (first?: string, last?: string) =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

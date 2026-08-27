export const scoreColor = (s: number): string => {
  if (s >= 4.5) return "text-emerald-600";
  if (s >= 3.5) return "text-[#253C7D]";
  if (s >= 2.5) return "text-amber-600";
  return "text-red-500";
};

export const scoreBg = (s: number): string => {
  if (s >= 4.5) return "bg-emerald-50";
  if (s >= 3.5) return "bg-[#253C7D]/10";
  if (s >= 2.5) return "bg-amber-50";
  return "bg-red-50";
};

export const progressColor = (p: number): string => {
  if (p >= 80) return "bg-emerald-500";
  if (p >= 50) return "bg-[#253C7D]";
  if (p >= 25) return "bg-amber-500";
  return "bg-red-400";
};

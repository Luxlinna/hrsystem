export const initials = (first?: string, last?: string): string =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

export const formatRelativeDays = (dateStr: string): string => {
  if (!dateStr) return "—";
  const target = new Date(`${dateStr}T00:00:00`);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Last day is Today";
  if (diffDays === 1) return "Last day is Tomorrow";
  if (diffDays > 1) return `${diffDays} days remaining`;
  if (diffDays === -1) return "Departed yesterday";
  return `Departed ${Math.abs(diffDays)} days ago`;
};

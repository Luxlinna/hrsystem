export const initials = (first?: string, last?: string): string =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

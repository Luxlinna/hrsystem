export const fmt = (n: number): string => `$${(n / 1000).toFixed(1)}k`;

export const fmtFull = (n: number): string => `$${Number(n).toLocaleString()}`;

export const initials = (first?: string, last?: string): string =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

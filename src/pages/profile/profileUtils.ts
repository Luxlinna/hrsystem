export const fmtDateTime = (iso?: string | null): string =>
  iso
    ? new Date(iso).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

export const calculateTenure = (joinDate?: string | null): number | null =>
  joinDate
    ? Math.floor((Date.now() - new Date(joinDate).getTime()) / (365.25 * 86400000))
    : null;

export const getUserInitials = (displayName?: string, email?: string): string =>
  (displayName || email || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

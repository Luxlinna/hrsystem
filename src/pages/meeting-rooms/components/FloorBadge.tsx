import { memo } from "react";

interface FloorBadgeProps {
  floor: number;
  size?: "sm" | "md" | "lg";
  isVIP?: boolean;
}

export const FloorBadge = memo(function FloorBadge({
  floor,
  size = "md",
  isVIP = false,
}: FloorBadgeProps) {
  if (floor === 5 || isVIP) {
    return (
      <span
        className={`inline-flex items-center gap-1 font-bold rounded-lg shrink-0 ${
          size === "sm"
            ? "px-1.5 py-0.5 text-[10px] bg-purple-50 text-purple-700 border border-purple-200/80"
            : size === "lg"
            ? "px-2.5 py-1 text-xs bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs"
            : "px-2 py-0.5 text-[11px] bg-purple-50 text-purple-700 border border-purple-200"
        }`}
      >
        <i className="ri-vip-crown-line text-purple-600" />
        <span>Floor 5</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-lg shrink-0 ${
        size === "sm"
          ? "px-1.5 py-0.5 text-[10px] bg-sky-50 text-sky-700 border border-sky-200/80"
          : size === "lg"
          ? "px-2.5 py-1 text-xs bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs"
          : "px-2 py-0.5 text-[11px] bg-sky-50 text-sky-700 border border-sky-200"
      }`}
    >
      <i className="ri-building-line text-sky-600" />
      <span>Floor 3</span>
    </span>
  );
});

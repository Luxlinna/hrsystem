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
  const isFloor5 = floor === 5 || isVIP;
  return (
    <span
      className={`inline-flex items-center gap-1 font-bold rounded-lg shrink-0 ${
        isFloor5
          ? "bg-purple-50 text-purple-700 border border-purple-200"
          : "bg-sky-50 text-sky-700 border border-sky-200"
      } ${
        size === "sm"
          ? "px-1.5 py-0.5 text-[10px]"
          : size === "lg"
          ? "px-2.5 py-1 text-xs shadow-2xs"
          : "px-2 py-0.5 text-[11px]"
      }`}
    >
      <i className={isFloor5 ? "ri-vip-crown-line text-purple-600" : "ri-building-line text-sky-600"} />
      <span>Floor {floor}</span>
    </span>
  );
});

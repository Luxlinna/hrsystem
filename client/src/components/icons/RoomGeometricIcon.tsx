import { memo } from "react";

interface RoomGeometricIconProps {
  className?: string;
  size?: number;
}

export const RoomGeometricIcon = memo(function RoomGeometricIcon({
  className = "w-6 h-6",
  size,
}: RoomGeometricIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      {/* Outer rounded room container */}
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
      {/* Inner nested top-left corner */}
      <path d="M8.5 11.5V8.5H11.5" />
      {/* Inner G-shaped room loop */}
      <path d="M15.5 8.5V15.5H8.5V12.5H12" />
    </svg>
  );
});

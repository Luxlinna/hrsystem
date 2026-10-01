import { memo } from "react";
import { DefaultAvatarSvg } from "@/components/DefaultAvatarSvg";

interface GoldFramedAvatarProps {
  avatarUrl?: string | null;
  initials?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export const GoldFramedAvatar = memo(function GoldFramedAvatar({
  avatarUrl,
  initials = "?",
  size = "lg",
  className = "",
}: GoldFramedAvatarProps) {
  // Proportional dimensions for the Super Admin royal frame
  const config = {
    sm: { box: 104, inner: 60 },
    md: { box: 144, inner: 84 },
    lg: { box: 196, inner: 114 },
    xl: { box: 240, inner: 140 },
  }[size] || { box: 196, inner: 114 };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${className}`}
      style={{ width: config.box, height: config.box }}
    >
      {/* Inner Avatar Image (Circular Crop positioned in frame window) */}
      <div
        className="absolute rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-amber-300/40 shadow-inner z-0"
        style={{
          width: config.inner,
          height: config.inner,
          top: "49.2%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Profile Avatar"
            className="w-full h-full object-cover object-center"
          />
        ) : (
          <DefaultAvatarSvg />
        )}
      </div>

      {/* Super Admin Gold Frame Overlay */}
      <img
        src="/frames/super-admin-frame-v2.png"
        alt="Super Admin Royal Frame"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none z-10 drop-shadow-[0_4px_12px_rgba(0,0,0,0.18)] select-none"
      />
    </div>
  );
});

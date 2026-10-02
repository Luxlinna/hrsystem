import { memo } from "react";
import { DefaultAvatarSvg } from "@/components/DefaultAvatarSvg";

interface GoldFramedAvatarProps {
  avatarUrl?: string | null;
  initials?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  isSuperAdmin?: boolean;
}

export const GoldFramedAvatar = memo(function GoldFramedAvatar({
  avatarUrl,
  initials = "?",
  size = "lg",
  className = "",
  isSuperAdmin = false,
}: GoldFramedAvatarProps) {
  // Proportional dimensions for the Super Admin royal frame
  const framedConfig = {
    sm: { box: 104, inner: 60 },
    md: { box: 144, inner: 84 },
    lg: { box: 196, inner: 114 },
    xl: { box: 240, inner: 140 },
  }[size] || { box: 196, inner: 114 };

  const standardSizeClass = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-28 h-28",
    xl: "w-36 h-36",
  }[size] || "w-28 h-28";

  // Standard clean avatar for non-super-admin users
  if (!isSuperAdmin) {
    return (
      <div
        className={`relative inline-flex items-center justify-center select-none shrink-0 ${standardSizeClass} ${className}`}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-200 dark:border-slate-700 shadow-md">
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
      </div>
    );
  }

  // Golden Frame Avatar strictly for Super Admin
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${className}`}
      style={{ width: framedConfig.box, height: framedConfig.box }}
    >
      {/* Inner Avatar Image (Circular Crop positioned in frame window) */}
      <div
        className="absolute rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-amber-300/40 shadow-inner z-0"
        style={{
          width: framedConfig.inner,
          height: framedConfig.inner,
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

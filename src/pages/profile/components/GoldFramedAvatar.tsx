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
  // Dimensions for different sizes
  const config = {
    sm: { box: 60, inner: 44, offset: 4 },
    md: { box: 90, inner: 66, offset: 6 },
    lg: { box: 130, inner: 96, offset: 8 },
    xl: { box: 160, inner: 118, offset: 10 },
  }[size] || { box: 130, inner: 96, offset: 8 };

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${className}`}
      style={{ width: config.box, height: config.box }}
    >
      {/* Inner Avatar Image (Circular) */}
      <div
        className="rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-amber-300/40 shadow-inner z-0"
        style={{
          width: config.inner,
          height: config.inner,
          marginTop: -config.offset,
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

      {/* Golden Ornate Frame & Lotus Pedestal SVG Overlay */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]"
        viewBox="0 0 160 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="khmerGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF275" />
            <stop offset="25%" stopColor="#F5CE42" />
            <stop offset="60%" stopColor="#D49A1F" />
            <stop offset="85%" stopColor="#B3740A" />
            <stop offset="100%" stopColor="#8C5403" />
          </linearGradient>

          <linearGradient id="khmerGoldHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF9A6" />
            <stop offset="50%" stopColor="#E5B224" />
            <stop offset="100%" stopColor="#996008" />
          </linearGradient>

          <filter id="goldShine" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#422006" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Outer Circular Golden Rim */}
        <circle
          cx="80"
          cy="72"
          r="56"
          stroke="url(#khmerGoldGrad)"
          strokeWidth="4.5"
          fill="none"
        />

        {/* Inner Subtle Bevel Ring */}
        <circle
          cx="80"
          cy="72"
          r="53.5"
          stroke="#FFF9A6"
          strokeWidth="0.8"
          strokeOpacity="0.8"
          fill="none"
        />
        <circle
          cx="80"
          cy="72"
          r="58.5"
          stroke="#78350F"
          strokeWidth="0.8"
          strokeOpacity="0.4"
          fill="none"
        />

        {/* Khmer Ornate Pedestal / Crest at Bottom */}
        <g filter="url(#goldShine)">
          {/* Main Bottom Flourish / Base Wing Left */}
          <path
            d="M 32 108 C 30 118 42 128 54 133 C 66 138 74 135 78 132 C 70 128 60 122 52 114 C 44 107 38 102 32 108 Z"
            fill="url(#khmerGoldGrad)"
            stroke="#8C5403"
            strokeWidth="0.75"
          />

          {/* Main Bottom Flourish / Base Wing Right */}
          <path
            d="M 128 108 C 130 118 118 128 106 133 C 94 138 86 135 82 132 C 90 128 100 122 108 114 C 116 107 122 102 128 108 Z"
            fill="url(#khmerGoldGrad)"
            stroke="#8C5403"
            strokeWidth="0.75"
          />

          {/* Outer Curved Wings / Acanthus Curls Left */}
          <path
            d="M 28 102 C 24 112 34 124 48 132 C 40 126 34 116 36 106 C 36 103 32 98 28 102 Z"
            fill="url(#khmerGoldHighlight)"
            stroke="#78350F"
            strokeWidth="0.5"
          />

          {/* Outer Curved Wings / Acanthus Curls Right */}
          <path
            d="M 132 102 C 136 112 126 124 112 132 C 120 126 126 116 124 106 C 124 103 128 98 132 102 Z"
            fill="url(#khmerGoldHighlight)"
            stroke="#78350F"
            strokeWidth="0.5"
          />

          {/* Lotus Pedestal Petals (Layer 1) */}
          <path
            d="M 52 130 C 62 144 76 148 80 148 C 84 148 98 144 108 130 C 98 138 88 141 80 141 C 72 141 62 138 52 130 Z"
            fill="url(#khmerGoldGrad)"
            stroke="#8C5403"
            strokeWidth="0.75"
          />

          {/* Center Pointed Lotus Finial / Kbach Phni Tes Central Ornament */}
          <path
            d="M 80 98 C 85 108 94 116 94 124 C 94 132 88 138 80 138 C 72 138 66 132 66 124 C 66 116 75 108 80 98 Z"
            fill="url(#khmerGoldGrad)"
            stroke="#78350F"
            strokeWidth="0.75"
          />

          {/* Center Petal Inner Carving */}
          <path
            d="M 80 106 C 83 113 88 118 88 124 C 88 129 84 132 80 132 C 76 132 72 129 72 124 C 72 118 77 113 80 106 Z"
            fill="url(#khmerGoldHighlight)"
            stroke="#8C5403"
            strokeWidth="0.5"
          />

          {/* Inner Teardrop Center Jewel */}
          <path
            d="M 80 113 C 82 117 84 120 84 124 C 84 126 82 128 80 128 C 78 128 76 126 76 124 C 76 120 78 117 80 113 Z"
            fill="#78350F"
            opacity="0.85"
          />

          {/* Left Decorative Scroll */}
          <path
            d="M 64 122 C 58 118 54 112 56 106 C 58 110 62 116 68 119 Z"
            fill="url(#khmerGoldHighlight)"
          />

          {/* Right Decorative Scroll */}
          <path
            d="M 96 122 C 102 118 106 112 104 106 C 102 110 98 116 92 119 Z"
            fill="url(#khmerGoldHighlight)"
          />
        </g>
      </svg>
    </div>
  );
});

import { memo } from "react";

interface DefaultAvatarSvgProps {
  className?: string;
}

export const DefaultAvatarSvg = memo(function DefaultAvatarSvg({
  className = "w-full h-full",
}: DefaultAvatarSvgProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Soft circular background */}
      <circle cx="100" cy="100" r="100" fill="#EDF0F3" />
      {/* Suit Shoulders */}
      <path
        d="M34 182 C44 146 72 130 90 125 L100 152 L110 125 C128 130 156 146 166 182 C148 198 125 200 100 200 C75 200 52 198 34 182 Z"
        fill="#CFD4DC"
      />
      {/* V-Collar Shirt Area */}
      <path d="M84 125 L116 125 L100 158 Z" fill="#EDF0F3" />
      {/* Necktie */}
      <path d="M96 128 L104 128 L106 137 L100 141 L94 137 Z" fill="#CFD4DC" />
      <path d="M97 141 L103 141 L106 172 L100 178 L94 172 Z" fill="#CFD4DC" />
      {/* Neck */}
      <path d="M86 106 C86 120 91 127 100 127 C109 127 114 120 114 106 Z" fill="#CFD4DC" />
      {/* Head */}
      <path
        d="M72 78 C72 98 83 113 100 113 C117 113 128 98 128 78 C128 58 117 44 100 44 C83 44 72 58 72 78 Z"
        fill="#CFD4DC"
      />
      {/* Hair & Ears Contour */}
      <path
        d="M68 76 C66 71 67 60 72 52 C77 43 86 37 98 37 C111 37 122 43 127 50 C132 56 133 67 129 76 C132 80 133 87 129 93 C127 96 124 97 121 97 C121 82 116 61 100 61 C86 61 80 72 79 97 C76 97 73 96 71 93 C67 87 68 80 68 76 Z"
        fill="#CFD4DC"
      />
    </svg>
  );
});

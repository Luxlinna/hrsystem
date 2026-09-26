export function getShiftPillStyle(code: string, isHoliday: boolean): { bg: string; text: string; border?: string } {
  const c = (code || "").trim().toUpperCase();

  // Public Holiday shifts (Orange styling)
  if (c.startsWith("PB_") || c.startsWith("CDKF_") || isHoliday) {
    if (c.includes("OFF")) {
      return { bg: "bg-[#EA580C]", text: "text-white" };
    }
    return { bg: "bg-[#F97316]", text: "text-white" };
  }

  // Rest Day / Day Off
  if (c === "OFF" || c === "REST") {
    return { bg: "bg-[#1E293B]", text: "text-white" };
  }

  // Normal Headquarter
  if (c === "NMHQ" || c.startsWith("NM")) {
    return { bg: "bg-[#E8618C]", text: "text-white" };
  }

  // Headquarter 2 / Maroon
  if (c === "HQ-2" || c === "HQ2" || c.startsWith("HQ")) {
    return { bg: "bg-[#852C36]", text: "text-white" };
  }

  // Town / Toul Kork / TH series (Blue or Teal)
  if (c === "TH") {
    return { bg: "bg-[#2563EB]", text: "text-white" };
  }
  if (c.startsWith("TH")) {
    return { bg: "bg-[#0D9488]", text: "text-white" };
  }

  // Numeric time shifts (e.g. 0812, 1704, 2005)
  if (c === "0812") {
    return { bg: "bg-[#F472B6]", text: "text-pink-950" };
  }
  if (c === "1204") {
    return { bg: "bg-[#FBBF24]", text: "text-amber-950" };
  }
  if (c === "1704" || c === "2005") {
    return { bg: "bg-[#9333EA]", text: "text-white" };
  }

  // Normal Operations (NMO1, NMS1, etc.)
  if (c.startsWith("NMO") || c.startsWith("F053")) {
    return { bg: "bg-[#16A34A]", text: "text-white" };
  }

  // Real DB Shift Codes
  if (c === "DAY") return { bg: "bg-[#2563EB]", text: "text-white" };
  if (c === "EVE") return { bg: "bg-[#7C3AED]", text: "text-white" };
  if (c === "MORN") return { bg: "bg-[#0284C7]", text: "text-white" };
  if (c === "DEV") return { bg: "bg-[#D97706]", text: "text-white" };
  if (c === "WKND") return { bg: "bg-[#B45309]", text: "text-white" };
  if (c === "FULL") return { bg: "bg-[#4338CA]", text: "text-white" };
  if (c === "TEST") return { bg: "bg-[#9D174D]", text: "text-white" };

  // Fallback styling based on hash
  return { bg: "bg-[#253C7D]", text: "text-white" };
}

export function getStatusUnderlineColor(status: string): string {
  switch (status) {
    case "no_clock_in":
    case "absent":
      return "bg-rose-500";
    case "present":
      return "bg-emerald-500";
    case "late":
      return "bg-amber-500";
    case "leave":
      return "bg-purple-500";
    default:
      return "transparent";
  }
}

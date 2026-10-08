export function getLeaveTypeDisplay(leaveType: string): {
  fullName: string;
  code: string;
  periodType: string;
} {
  const norm = (leaveType || "").toLowerCase().trim();
  if (norm.includes("unpaid") || norm === "ul") {
    return {
      fullName: "Unpaid Leave ( ការឈប់សម្រាកគ្មានប្រាក់ឈ្នួល )",
      code: "UP",
      periodType: "Daily",
    };
  }
  if (norm.includes("annual") || norm === "al") {
    return {
      fullName: "Annual Leave ( ការឈប់សម្រាកប្រចាំឆ្នាំ )",
      code: "AL",
      periodType: "Daily",
    };
  }
  if (norm.includes("sick") || norm === "sl") {
    return {
      fullName: "Sick Leave ( ការឈប់សម្រាកដោយជំងឺ )",
      code: "SL",
      periodType: "Daily",
    };
  }
  if (norm.includes("special") || norm === "sp") {
    return {
      fullName: "Special Leave ( ការឈប់សម្រាកពិសេស )",
      code: "SP",
      periodType: "Daily",
    };
  }
  if (norm.includes("maternity") || norm === "ml") {
    return {
      fullName: "Maternity Leave ( ការឈប់សម្រាកលំហែមាតុភាព )",
      code: "ML",
      periodType: "Daily",
    };
  }
  if (norm.includes("paternity") || norm === "pl") {
    return {
      fullName: "Paternity Leave ( ការឈប់សម្រាកបិតុភាព )",
      code: "PL",
      periodType: "Daily",
    };
  }
  if (norm.includes("bereavement") || norm === "bl") {
    return {
      fullName: "Bereavement Leave ( ការឈប់សម្រាកមរណទុក្ខ )",
      code: "BL",
      periodType: "Daily",
    };
  }
  if (norm.includes("marriage")) {
    return {
      fullName: "Marriage Leave ( ការឈប់សម្រាកអាពាហ៍ពិពាហ៍ )",
      code: "ML",
      periodType: "Daily",
    };
  }
  return {
    fullName: leaveType || "Leave Request",
    code: (leaveType || "LV").slice(0, 2).toUpperCase(),
    periodType: "Daily",
  };
}

export function formatDMY(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr.includes("T") ? dateStr : `${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = d.getHours();
  const mins = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayH = String(hours % 12 === 0 ? 12 : hours % 12).padStart(2, "0");
  return `${day}/${month}/${year} ${displayH}:${mins} ${ampm}`;
}

export function getLeaveEmployeeName(emp?: {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  full_name?: string | null;
} | null): string {
  if (!emp) return "Employee";
  return (
    emp.display_name?.trim() ||
    emp.full_name?.trim() ||
    `${emp.first_name || ""} ${emp.last_name || ""}`.trim() ||
    "Employee"
  );
}

export function getLeaveEmployeeInitials(emp?: {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
  full_name?: string | null;
} | null): string {
  if (!emp) return "E";
  const name = getLeaveEmployeeName(emp);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return (name[0] || "E").toUpperCase();
}


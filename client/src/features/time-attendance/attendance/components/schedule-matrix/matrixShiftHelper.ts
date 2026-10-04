import type { AvailableShiftItem } from "./types";

export function formatTime12(timeStr?: string | null): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${String(displayH).padStart(2, "0")}:${m} ${ampm}`;
}

export function deriveShiftCode(
  name?: string | null,
  explicitCode?: string | null,
  startTime?: string | null,
  endTime?: string | null
): string {
  if (explicitCode && explicitCode.trim()) {
    return explicitCode.trim().toUpperCase();
  }

  const trimmed = (name || "").trim();
  const firstWord = trimmed.split(/[\s\-&_()]+/)[0];

  // Specific common abbreviations
  if (/^Day/i.test(trimmed)) return "DAY";
  if (/^Evening/i.test(trimmed)) return "EVE";
  if (/^Morning/i.test(trimmed)) return "MORN";
  if (/^Weekend/i.test(trimmed)) return "WKND";
  if (/^Full/i.test(trimmed)) return "FULL";
  if (/^Developer/i.test(trimmed)) return "DEV";
  if (/^testing/i.test(trimmed)) return "TEST";

  if (firstWord && /^[A-Za-z0-9]{2,6}$/.test(firstWord)) {
    return firstWord.toUpperCase();
  }

  if (startTime && endTime) {
    const sH = startTime.slice(0, 2);
    const eH = endTime.slice(0, 2);
    return `${sH}${eH}`;
  }

  return trimmed ? trimmed.slice(0, 4).toUpperCase() : "SHIFT";
}

export function buildAvailableShiftList(
  rawShifts: any[] = [],
  scheduleTemplates: any[] = []
): AvailableShiftItem[] {
  const list: AvailableShiftItem[] = [
    {
      id: "OFF",
      code: "OFF",
      name: "Day Off",
      label: "OFF - Day Off (Rest Day)",
      timeDisplay: "Rest Day",
      color: "#475569",
      isOff: true,
    },
  ];

  const seenCodes = new Set<string>(["OFF"]);

  // Process real master shifts from database
  rawShifts.forEach((s) => {
    let extra: any = {};
    if (s.notes) {
      try {
        if (typeof s.notes === "object") extra = s.notes;
        else if (typeof s.notes === "string" && s.notes.trim().startsWith("{")) {
          extra = JSON.parse(s.notes);
        }
      } catch {
        // text notes
      }
    }

    const code = deriveShiftCode(
      s.name,
      s.code || extra.code,
      s.start_time,
      s.end_time
    );

    if (seenCodes.has(code)) return;
    seenCodes.add(code);

    const timeStart = formatTime12(s.start_time);
    const timeEnd = formatTime12(s.end_time);
    const timeDisplay =
      extra.time_display ||
      (timeStart && timeEnd ? `${timeStart} - ${timeEnd}` : "Flexible");

    const cleanName = s.name?.replace(/^\(.*?\)\s*/, "").trim() || "Shift";
    const label = `${code} - ${timeDisplay} (${cleanName})`;

    list.push({
      id: s.id || `shift-${code}`,
      code,
      name: cleanName,
      label,
      timeDisplay,
      startTime: s.start_time,
      endTime: s.end_time,
      color: s.color || extra.color || "#2563EB",
      isOff: false,
    });
  });

  // Extract any template shifts if not already present
  scheduleTemplates.forEach((t) => {
    if (t.days && typeof t.days === "object") {
      Object.values(t.days).forEach((val) => {
        const c = String(val || "").trim().toUpperCase();
        if (c && !seenCodes.has(c)) {
          seenCodes.add(c);
          list.push({
            id: `tmpl-${c}`,
            code: c,
            name: `${c} Shift`,
            label: `${c} - Assigned Schedule Shift`,
            timeDisplay: "Standard Hours",
            color: "#2563EB",
            isOff: c === "OFF",
          });
        }
      });
    }
  });

  return list;
}

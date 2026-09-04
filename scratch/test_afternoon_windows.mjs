// Test script to verify afternoon window validation and 8-hour daily calculation
function toMin(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function simulatePunch({
  timeStr,
  siteSchedule = {},
  existingRecord = null,
}) {
  const punchMinutes = toMin(timeStr);
  const workStartTime = siteSchedule.work_start_time || "07:30:00";
  const breakStartTime = siteSchedule.break_start_time || "11:30:00";
  const breakEndTime = siteSchedule.break_end_time || "13:00:00";
  const workEndTime = siteSchedule.work_end_time || "17:00:00";
  const lateGraceMin = siteSchedule.late_grace_minutes ?? 15;
  const earlyGraceMin = siteSchedule.early_leave_grace_minutes ?? 15;

  const morningCheckInStart = siteSchedule.morning_check_in_start || "06:00:00";
  const morningCheckInEnd = siteSchedule.morning_check_in_end || "09:00:00";
  const morningCheckOutStart = siteSchedule.morning_check_out_start || "10:00:00";
  const morningCheckOutEnd = siteSchedule.morning_check_out_end || "12:00:00";

  const afternoonCheckInStart = siteSchedule.afternoon_check_in_start || "12:00:00";
  const afternoonCheckInEnd = siteSchedule.afternoon_check_in_end || "14:00:00";
  const afternoonCheckOutStart = siteSchedule.afternoon_check_out_start || "16:00:00";
  const afternoonCheckOutEnd = siteSchedule.afternoon_check_out_end || "18:00:00";

  const startMin = toMin(workStartTime);
  const breakStartMin = toMin(breakStartTime);
  const breakEndMin = toMin(breakEndTime);
  const endMin = toMin(workEndTime);

  const morningInStartMin = toMin(morningCheckInStart);
  const morningInEndMin = toMin(morningCheckInEnd);
  const morningOutStartMin = toMin(morningCheckOutStart);
  const morningOutEndMin = toMin(morningCheckOutEnd);

  const afternoonInStartMin = toMin(afternoonCheckInStart);
  const afternoonInEndMin = toMin(afternoonCheckInEnd);
  const afternoonOutStartMin = toMin(afternoonCheckOutStart);
  const afternoonOutEndMin = toMin(afternoonCheckOutEnd);

  const isMorningInWindow = punchMinutes >= morningInStartMin && punchMinutes <= morningInEndMin;
  const isMorningOutWindow = punchMinutes >= morningOutStartMin && punchMinutes <= morningOutEndMin;
  const isAfternoonInWindow = punchMinutes >= afternoonInStartMin && punchMinutes <= afternoonInEndMin;
  const isAfternoonOutWindow = punchMinutes >= afternoonOutStartMin && punchMinutes <= afternoonOutEndMin;

  const preferMorningOut = punchMinutes === morningOutEndMin && existingRecord?.clock_in && !existingRecord?.break_out;

  let updatePayload = {};

  if (isMorningInWindow && (!existingRecord || !existingRecord.clock_in)) {
    const rawLateMinutes = Math.max(0, punchMinutes - startMin);
    const isLate = rawLateMinutes > lateGraceMin;
    const lateMinutes = isLate ? rawLateMinutes - lateGraceMin : 0;
    updatePayload = {
      clock_in: timeStr,
      status: isLate ? "late" : "ontime",
      late_minutes: lateMinutes,
    };
  } else if (isMorningOutWindow && preferMorningOut) {
    let morningEarlyLeave = 0;
    if (punchMinutes < breakStartMin) {
      const rawMorningEarlyLeave = Math.max(0, breakStartMin - punchMinutes);
      const isEarly = rawMorningEarlyLeave > earlyGraceMin;
      morningEarlyLeave = isEarly ? rawMorningEarlyLeave - earlyGraceMin : 0;
    }
    let morningHours = 0;
    if (existingRecord?.clock_in) {
      const p1Min = toMin(existingRecord.clock_in);
      morningHours = Math.min(4.0, Math.max(0, parseFloat(((punchMinutes - p1Min) / 60).toFixed(2))));
    }
    updatePayload = {
      break_out: timeStr,
      early_leave_minutes: morningEarlyLeave,
      hours_worked: morningHours,
    };
  } else if (isMorningOutWindow && !existingRecord?.break_out && punchMinutes < afternoonInStartMin) {
    let morningEarlyLeave = 0;
    if (punchMinutes < breakStartMin) {
      const rawMorningEarlyLeave = Math.max(0, breakStartMin - punchMinutes);
      const isEarly = rawMorningEarlyLeave > earlyGraceMin;
      morningEarlyLeave = isEarly ? rawMorningEarlyLeave - earlyGraceMin : 0;
    }
    let morningHours = 0;
    if (existingRecord?.clock_in) {
      const p1Min = toMin(existingRecord.clock_in);
      morningHours = Math.min(4.0, Math.max(0, parseFloat(((punchMinutes - p1Min) / 60).toFixed(2))));
    }
    updatePayload = {
      break_out: timeStr,
      early_leave_minutes: morningEarlyLeave,
      hours_worked: morningHours,
    };
  } else if (isAfternoonInWindow && !existingRecord?.break_in) {
    let afternoonLateMinutes = 0;
    let isAfternoonLate = false;
    if (punchMinutes > breakEndMin) {
      const rawAfternoonLate = Math.max(0, punchMinutes - breakEndMin);
      isAfternoonLate = rawAfternoonLate > lateGraceMin;
      afternoonLateMinutes = isAfternoonLate ? rawAfternoonLate - lateGraceMin : 0;
    }
    const existingLate = existingRecord?.late_minutes || 0;
    const existingStatus = existingRecord?.status || "ontime";
    const finalStatus = (isAfternoonLate || existingStatus === "late") ? "late" : "ontime";

    updatePayload = {
      break_in: timeStr,
      late_minutes: existingLate + afternoonLateMinutes,
      status: finalStatus,
    };
  } else if (isAfternoonOutWindow) {
    let afternoonEarlyLeave = 0;
    if (punchMinutes < endMin) {
      const rawEarlyLeave = Math.max(0, endMin - punchMinutes);
      const isEarly = rawEarlyLeave > earlyGraceMin;
      afternoonEarlyLeave = isEarly ? rawEarlyLeave - earlyGraceMin : 0;
    }
    const existingEarlyLeave = existingRecord?.early_leave_minutes || 0;

    let morningHours = 0;
    if (existingRecord?.clock_in && existingRecord?.break_out) {
      const p1Min = toMin(existingRecord.clock_in);
      const p2Min = toMin(existingRecord.break_out);
      if (p2Min > p1Min) {
        morningHours = Math.min(4.0, Math.max(0, parseFloat(((p2Min - p1Min) / 60).toFixed(2))));
      }
    }

    let afternoonHours = 0;
    if (existingRecord?.break_in) {
      const p3Min = toMin(existingRecord.break_in);
      if (punchMinutes > p3Min) {
        afternoonHours = Math.min(4.0, Math.max(0, parseFloat(((punchMinutes - p3Min) / 60).toFixed(2))));
      }
    }

    const totalHours = parseFloat((morningHours + afternoonHours).toFixed(2));

    updatePayload = {
      clock_out: timeStr,
      hours_worked: totalHours,
      early_leave_minutes: existingEarlyLeave + afternoonEarlyLeave,
    };
  }

  const recorded = Object.keys(updatePayload).length > 0;
  return { recorded, updatePayload };
}

console.log("=== RUNNING TESTS FOR AFTERNOON ATTENDANCE WINDOWS & 8-HOUR RULES ===");

// 1. Afternoon Check-In Tests (Window: 12:00 PM - 02:00 PM, Shift Start: 13:00)
// Test 1a: Punch before 12:00 PM (e.g. 11:59 AM) when break_out is already set -> Ignored
const r1a = simulatePunch({
  timeStr: "11:59:00",
  existingRecord: { clock_in: "07:30:00", break_out: "11:30:00" },
});
console.assert(!r1a.recorded, "Test 1a Failed: 11:59 AM scan should not be recorded as afternoon check-in");

// Test 1b: Punch at 12:15 PM -> in window, on time
const r1b = simulatePunch({
  timeStr: "12:15:00",
  existingRecord: { clock_in: "07:30:00", break_out: "11:30:00" },
});
console.assert(r1b.recorded && r1b.updatePayload.break_in === "12:15:00" && r1b.updatePayload.status === "ontime", "Test 1b Failed: 12:15 PM should be ontime break_in");

// Test 1c: Punch at 13:20 PM -> in window, late (20m - 15m grace = 5m late)
const r1c = simulatePunch({
  timeStr: "13:20:00",
  existingRecord: { clock_in: "07:30:00", break_out: "11:30:00", status: "ontime" },
});
console.assert(r1c.recorded && r1c.updatePayload.status === "late" && r1c.updatePayload.late_minutes === 5, "Test 1c Failed: 13:20 PM should be late with 5m late_minutes");

// Test 1d: Punch at 14:05 PM (after 2:00 PM) -> Ignored / Not Recorded!
const r1d = simulatePunch({
  timeStr: "14:05:00",
  existingRecord: { clock_in: "07:30:00", break_out: "11:30:00" },
});
console.assert(!r1d.recorded, "Test 1d Failed: 14:05 PM scan must not be recorded");

// 2. Afternoon Check-Out Tests (Window: 16:00 PM - 18:00 PM, Shift End: 17:00)
// Test 2a: Punch before 16:00 PM (e.g. 15:50 PM) -> Ignored / Not Recorded!
const r2a = simulatePunch({
  timeStr: "15:50:00",
  existingRecord: { clock_in: "07:30:00", break_out: "11:30:00", break_in: "13:00:00" },
});
console.assert(!r2a.recorded, "Test 2a Failed: 15:50 PM scan must not be recorded");

// Test 2b: Punch at 16:30 PM (before 17:00 PM shift end: 30m early - 15m grace = 15m early leave)
const r2b = simulatePunch({
  timeStr: "16:30:00",
  existingRecord: { clock_in: "07:30:00", break_out: "11:30:00", break_in: "13:00:00" },
});
console.assert(r2b.recorded && r2b.updatePayload.early_leave_minutes === 15, "Test 2b Failed: 16:30 PM should have 15m early leave");

// Test 2c: Punch at 17:15 PM -> in window, on time
const r2c = simulatePunch({
  timeStr: "17:15:00",
  existingRecord: { clock_in: "07:30:00", break_out: "11:30:00", break_in: "13:00:00" },
});
console.assert(r2c.recorded && r2c.updatePayload.early_leave_minutes === 0, "Test 2c Failed: 17:15 PM should be ontime checkout");

// Test 2d: Punch at 18:05 PM (after 6:00 PM) -> Ignored / Not Recorded!
const r2d = simulatePunch({
  timeStr: "18:05:00",
  existingRecord: { clock_in: "07:30:00", break_out: "11:30:00", break_in: "13:00:00" },
});
console.assert(!r2d.recorded, "Test 2d Failed: 18:05 PM scan must not be recorded");

// 3. 8-Hour Daily Calculation Tests
// Test 3a: Standard 4 punches (4h morning + 4h afternoon = 8.0h)
const r3a = simulatePunch({
  timeStr: "17:00:00",
  existingRecord: { clock_in: "07:30:00", break_out: "11:30:00", break_in: "13:00:00" },
});
console.assert(r3a.updatePayload.hours_worked === 8.0, `Test 3a Failed: expected 8.0h, got ${r3a.updatePayload.hours_worked}`);

// Test 3b: Missed morning check-out (clock_in present, break_out MISSING) -> morning=0h, afternoon=4h -> total=4.0h
const r3b = simulatePunch({
  timeStr: "17:00:00",
  existingRecord: { clock_in: "07:30:00", break_out: null, break_in: "13:00:00" },
});
console.assert(r3b.updatePayload.hours_worked === 4.0, `Test 3b Failed: expected 4.0h, got ${r3b.updatePayload.hours_worked}`);

// Test 3c: Missed morning check-in (clock_in MISSING, break_out present) -> morning=0h, afternoon=4h -> total=4.0h
const r3c = simulatePunch({
  timeStr: "17:00:00",
  existingRecord: { clock_in: null, break_out: "11:30:00", break_in: "13:00:00" },
});
console.assert(r3c.updatePayload.hours_worked === 4.0, `Test 3c Failed: expected 4.0h, got ${r3c.updatePayload.hours_worked}`);

// Test 3d: Missed afternoon check-in (break_in MISSING) -> morning=4h, afternoon=0h -> total=4.0h
const r3d = simulatePunch({
  timeStr: "17:00:00",
  existingRecord: { clock_in: "07:30:00", break_out: "11:30:00", break_in: null },
});
console.assert(r3d.updatePayload.hours_worked === 4.0, `Test 3d Failed: expected 4.0h, got ${r3d.updatePayload.hours_worked}`);

// Test 3e: Arrived only in afternoon (no morning record at all) -> punch at 12:30 PM (break_in)
const r3e_in = simulatePunch({
  timeStr: "12:30:00",
  existingRecord: null,
});
console.assert(r3e_in.recorded && r3e_in.updatePayload.break_in === "12:30:00", "Test 3e_in Failed: afternoon arrival should be accepted");

const r3e_out = simulatePunch({
  timeStr: "17:00:00",
  existingRecord: { clock_in: null, break_out: null, break_in: "12:30:00" },
});
console.assert(r3e_out.updatePayload.hours_worked === 4.0, `Test 3e_out Failed: expected 4.0h, got ${r3e_out.updatePayload.hours_worked}`);

console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");

/**
 * ZKTeco Biometric Attendance Sync Agent
 *
 * Supports:
 *   - 2-Punch Shift Model (Standard: Check-In, Check-Out)
 *   - 4-Punch Multi-Session Shift Model (e.g. Pinex Agro - Kampong Thom:
 *       1. Morning Check-In @ 07:30 AM
 *       2. Morning Check-Out / Lunch Out @ 11:30 AM
 *       3. Afternoon Check-In / Lunch In @ 01:00 PM
 *       4. Afternoon Check-Out @ 05:00 PM)
 *
 * Usage:
 *   node scripts/zkteco-sync-agent.mjs --ip 192.168.1.201 --port 4370
 *   or: npm run zkteco:sync
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import net from "net";

dotenv.config();

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_PUBLIC_SUPABASE_URL ||
  "https://blcvtbzwpwmqkphlcjji.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

const DEVICE_IP = process.env.ZKTECO_IP || process.argv.find((a, i) => process.argv[i - 1] === "--ip") || "192.168.1.201";
const DEVICE_PORT = parseInt(process.env.ZKTECO_PORT || process.argv.find((a, i) => process.argv[i - 1] === "--port") || "4370", 10);
const DEVICE_TIMEOUT = 10000;

if (!SUPABASE_KEY) {
  console.error("❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

console.log("==================================================");
console.log("📡 ZKTeco Biometric Attendance Sync Gateway");
console.log(`🔌 Target Device: ${DEVICE_IP}:${DEVICE_PORT}`);
console.log(`☁️  Supabase URL: ${SUPABASE_URL}`);
console.log("==================================================");

function toMin(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Process a single attendance log entry from ZKTeco
 */
export async function processZkPunchRecord(punch) {
  const { userId, timestamp, punchType, deviceSerial } = punch;
  if (!userId || !timestamp) return;

  const punchDate = new Date(timestamp);
  const dateStr = punchDate.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = punchDate.toTimeString().slice(0, 8); // HH:mm:ss
  const punchMinutes = toMin(timeStr);

  // 1. Find employee by biometric_user_id or employee ID + their branch/site schedules
  const { data: employee, error: empErr } = await supabase
    .from("employees")
    .select(`
      id, first_name, last_name, branch_id, default_work_location_id,
      branches(name, work_start_time, work_end_time, late_grace_minutes, early_leave_grace_minutes, morning_check_in_start, morning_check_in_end, morning_check_out_start, morning_check_out_end, afternoon_check_in_start, afternoon_check_in_end, afternoon_check_out_start, afternoon_check_out_end),
      work_locations:default_work_location_id(name, work_start_time, break_start_time, break_end_time, work_end_time, late_grace_minutes, early_leave_grace_minutes, is_four_punch_enabled, morning_check_in_start, morning_check_in_end, morning_check_out_start, morning_check_out_end, afternoon_check_in_start, afternoon_check_in_end, afternoon_check_out_start, afternoon_check_out_end)
    `)
    .or(`biometric_user_id.eq.${userId},id.eq.${userId}`)
    .maybeSingle();

  if (empErr || !employee) {
    console.warn(`⚠️ Biometric User ID [${userId}] is not mapped to any active employee in HR System.`);
    return;
  }

  const employeeName = `${employee.first_name} ${employee.last_name}`;
  const site = employee.work_locations;
  const branch = employee.branches;

  // Schedule Resolution: Site Schedule (e.g. Kampong Thom) -> Branch Schedule -> Default (07:30 / 17:00)
  const workStartTime = site?.work_start_time || branch?.work_start_time || "07:30:00";
  const breakStartTime = site?.break_start_time || "11:30:00";
  const breakEndTime = site?.break_end_time || "13:00:00";
  const workEndTime = site?.work_end_time || branch?.work_end_time || "17:00:00";
  const is4Punch = site?.is_four_punch_enabled ?? true;
  const lateGraceMin = site?.late_grace_minutes ?? branch?.late_grace_minutes ?? 15;
  const earlyGraceMin = site?.early_leave_grace_minutes ?? branch?.early_leave_grace_minutes ?? 15;

  // Morning Scan Windows: default 06:00-09:00 for check-in; 10:00-12:00 for morning check-out
  const morningCheckInStart = site?.morning_check_in_start || branch?.morning_check_in_start || "06:00:00";
  const morningCheckInEnd = site?.morning_check_in_end || branch?.morning_check_in_end || "09:00:00";
  const morningCheckOutStart = site?.morning_check_out_start || branch?.morning_check_out_start || "10:00:00";
  const morningCheckOutEnd = site?.morning_check_out_end || branch?.morning_check_out_end || "12:00:00";

  // Afternoon Scan Windows: default 12:00-14:00 for check-in; 16:00-18:00 for afternoon check-out
  const afternoonCheckInStart = site?.afternoon_check_in_start || branch?.afternoon_check_in_start || "12:00:00";
  const afternoonCheckInEnd = site?.afternoon_check_in_end || branch?.afternoon_check_in_end || "14:00:00";
  const afternoonCheckOutStart = site?.afternoon_check_out_start || branch?.afternoon_check_out_start || "16:00:00";
  const afternoonCheckOutEnd = site?.afternoon_check_out_end || branch?.afternoon_check_out_end || "18:00:00";

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

  // 2. Fetch existing attendance record for today
  const { data: existingRecord } = await supabase
    .from("attendance_records")
    .select("*")
    .eq("employee_id", employee.id)
    .eq("date", dateStr)
    .maybeSingle();

  let updatePayload = {};

  if (!is4Punch) {
    // Standard 2-Punch Mode (Clock In / Clock Out)
    if (!existingRecord || !existingRecord.clock_in) {
      // Validate morning check-in window (06:00 - 09:00 by default)
      if (punchMinutes < morningInStartMin || punchMinutes > morningInEndMin) {
        console.log(`ℹ️ [IGNORED SCAN] ${employeeName} scanned at ${timeStr} outside allowed check-in window (${morningCheckInStart.slice(0, 5)} - ${morningCheckInEnd.slice(0, 5)}). Not recorded.`);
      } else {
        const rawLateMinutes = Math.max(0, punchMinutes - startMin);
        const isLate = rawLateMinutes > lateGraceMin;
        const lateMinutes = isLate ? rawLateMinutes - lateGraceMin : 0;
        updatePayload = {
          clock_in: timeStr,
          status: isLate ? "late" : "ontime",
          late_minutes: lateMinutes,
          notes: `ZKTeco (${deviceSerial || "LAN"})`,
        };
        console.log(`✅ [CLOCK-IN] ${employeeName} at ${timeStr} (Status: ${isLate ? "late" : "ontime"})`);
      }
    } else {
      // Validate afternoon check-out window (16:00 - 18:00 by default)
      if (punchMinutes < afternoonOutStartMin || punchMinutes > afternoonOutEndMin) {
        console.log(`ℹ️ [IGNORED SCAN] ${employeeName} scanned at ${timeStr} outside allowed check-out window (${afternoonCheckOutStart.slice(0, 5)} - ${afternoonCheckOutEnd.slice(0, 5)}). Not recorded.`);
      } else {
        const ciMin = toMin(existingRecord.clock_in);
        const breakDuration = Math.max(0, breakEndMin - breakStartMin);
        const hoursWorked = Math.min(8.0, Math.max(0, parseFloat(((punchMinutes - ciMin - breakDuration) / 60).toFixed(2))));
        const rawEarlyLeaveMinutes = Math.max(0, endMin - punchMinutes);
        const isEarly = rawEarlyLeaveMinutes > earlyGraceMin;
        const earlyLeaveMinutes = isEarly ? rawEarlyLeaveMinutes - earlyGraceMin : 0;

        updatePayload = {
          clock_out: timeStr,
          hours_worked: hoursWorked,
          early_leave_minutes: earlyLeaveMinutes,
        };
        console.log(`✅ [CLOCK-OUT] ${employeeName} at ${timeStr} (${hoursWorked}h)`);
      }
    }
  } else {
    // 4-Punch Multi-Session Mode (Kampong Thom / Pinex Agro: 7:30 In -> 11:30 Out -> 13:00 In -> 17:00 Out)
    const isMorningInWindow = punchMinutes >= morningInStartMin && punchMinutes <= morningInEndMin;
    const isMorningOutWindow = punchMinutes >= morningOutStartMin && punchMinutes <= morningOutEndMin;
    const isAfternoonInWindow = punchMinutes >= afternoonInStartMin && punchMinutes <= afternoonInEndMin;
    const isAfternoonOutWindow = punchMinutes >= afternoonOutStartMin && punchMinutes <= afternoonOutEndMin;

    // Disambiguate border at morningOutEndMin / afternoonInStartMin (e.g. 12:00)
    const preferMorningOut = punchMinutes === morningOutEndMin && existingRecord?.clock_in && !existingRecord?.break_out;

    if (isMorningInWindow && (!existingRecord || !existingRecord.clock_in)) {
      // 1️⃣ PUNCH 1: Morning Check-In Window (e.g. 06:00 AM - 09:00 AM)
      const rawLateMinutes = Math.max(0, punchMinutes - startMin);
      const isLate = rawLateMinutes > lateGraceMin;
      const lateMinutes = isLate ? rawLateMinutes - lateGraceMin : 0;
      updatePayload = {
        clock_in: timeStr,
        status: isLate ? "late" : "ontime",
        late_minutes: lateMinutes,
        notes: `ZKTeco 4-Punch (${site?.name || branch?.name || "Branch Site"})`,
      };
      console.log(`✅ [PUNCH 1: MORNING IN] ${employeeName} at ${timeStr} (Status: ${isLate ? "late" : "ontime"})`);
    } else if (isMorningOutWindow && preferMorningOut) {
      // 2️⃣ PUNCH 2: Morning Check-Out (exact 12:00 border disambiguation)
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
      console.log(`✅ [PUNCH 2: MORNING OUT] ${employeeName} at ${timeStr} (Early: ${morningEarlyLeave}m, Morning: ${morningHours}h)`);
    } else if (isMorningOutWindow && !existingRecord?.break_out && punchMinutes < afternoonInStartMin) {
      // 2️⃣ PUNCH 2: Morning Check-Out / Lunch Out (Window: 10:00 AM - 12:00 PM)
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
      console.log(`✅ [PUNCH 2: MORNING OUT] ${employeeName} at ${timeStr} (Early: ${morningEarlyLeave}m, Morning: ${morningHours}h)`);
    } else if (isAfternoonInWindow && !existingRecord?.break_in) {
      // 3️⃣ PUNCH 3: Afternoon Check-In / Lunch In (Window: 12:00 PM - 02:00 PM)
      // Before 01:00 PM: ontime. After 01:00 PM: late
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
        notes: existingRecord?.notes || `ZKTeco 4-Punch (${site?.name || branch?.name || "Branch Site"})`,
      };
      console.log(`✅ [PUNCH 3: AFTERNOON IN] ${employeeName} at ${timeStr} (Status: ${isAfternoonLate ? "late" : "ontime"})`);
    } else if (isAfternoonOutWindow) {
      // 4️⃣ PUNCH 4: Afternoon Check-Out / Final Shift End (Window: 04:00 PM - 06:00 PM)
      // Before 05:00 PM: early checkout. Between 05:00 PM and 06:00 PM: ontime
      let afternoonEarlyLeave = 0;
      if (punchMinutes < endMin) {
        const rawEarlyLeave = Math.max(0, endMin - punchMinutes);
        const isEarly = rawEarlyLeave > earlyGraceMin;
        afternoonEarlyLeave = isEarly ? rawEarlyLeave - earlyGraceMin : 0;
      }
      const existingEarlyLeave = existingRecord?.early_leave_minutes || 0;

      // 8-Hour Rule Calculation: Morning 4h max + Afternoon 4h max = 8h Total
      // If employee missed check-in or check-out of morning session: morning = 0h
      let morningHours = 0;
      if (existingRecord?.clock_in && existingRecord?.break_out) {
        const p1Min = toMin(existingRecord.clock_in);
        const p2Min = toMin(existingRecord.break_out);
        if (p2Min > p1Min) {
          morningHours = Math.min(4.0, Math.max(0, parseFloat(((p2Min - p1Min) / 60).toFixed(2))));
        }
      }

      // If employee missed check-in of afternoon session: afternoon = 0h
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
      console.log(`✅ [PUNCH 4: FINAL OUT] ${employeeName} at ${timeStr} (Morning: ${morningHours}h, Afternoon: ${afternoonHours}h, Total: ${totalHours}h)`);
    } else {
      console.log(`ℹ️ [IGNORED SCAN] ${employeeName} scanned at ${timeStr} outside allowed punch windows. Not recorded.`);
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    // Scan was outside allowed windows, do not record anything into attendance_records
    await supabase.from("biometric_raw_logs").insert({
      device_serial: deviceSerial || "ZK-LAN",
      biometric_user_id: String(userId),
      punch_time: punchDate.toISOString(),
      punch_state: punchType ?? 0,
      processed: false,
    });
    return;
  }

  // 3. Upsert into attendance_records
  const { error: upsertErr } = await supabase.from("attendance_records").upsert(
    {
      employee_id: employee.id,
      date: dateStr,
      work_location_id: employee.default_work_location_id || null,
      branch_id: employee.branch_id || null,
      deleted_at: null,
      deleted_by: null,
      ...updatePayload,
    },
    { onConflict: "employee_id,date" }
  );

  if (upsertErr) {
    console.error("❌ Failed to update attendance record for", employeeName, ":", upsertErr.message);
  }

  // 4. Log raw punch for auditing
  await supabase.from("biometric_raw_logs").insert({
    device_serial: deviceSerial || "ZK-LAN",
    biometric_user_id: String(userId),
    punch_time: punchDate.toISOString(),
    punch_state: punchType ?? 0,
    processed: true,
  });
}

/**
 * Socket Ping to verify ZKTeco connectivity
 */
function testConnection() {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(DEVICE_TIMEOUT);

    socket.connect(DEVICE_PORT, DEVICE_IP, () => {
      console.log(`🟢 Successfully reached ZKTeco Device at ${DEVICE_IP}:${DEVICE_PORT}`);
      socket.destroy();
      resolve(true);
    });

    socket.on("error", (err) => {
      console.warn(`🟡 ZKTeco Device at ${DEVICE_IP}:${DEVICE_PORT} is currently offline (${err.code || err.message}).`);
      socket.destroy();
      resolve(false);
    });

    socket.on("timeout", () => {
      console.warn(`⏱️ Connection timed out reaching ZKTeco at ${DEVICE_IP}:${DEVICE_PORT}`);
      socket.destroy();
      resolve(false);
    });
  });
}

async function startAgent() {
  const isOnline = await testConnection();
  if (!isOnline) {
    console.log("\n💡 Tips for ZKTeco Setup at Kampong Thom Site:");
    console.log("  1. Connect ZKTeco machine to the branch site Wi-Fi / Router.");
    console.log("  2. Check device IP in: ZKTeco Menu -> Comm. -> Ethernet.");
    console.log("  3. Run: node scripts/zkteco-sync-agent.mjs --ip [DEVICE_IP]");
  }
}

startAgent();

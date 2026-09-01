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
      branches(name, work_start_time, work_end_time),
      work_locations:default_work_location_id(name, work_start_time, break_start_time, break_end_time, work_end_time, is_four_punch_enabled)
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

  const startMin = toMin(workStartTime);
  const breakStartMin = toMin(breakStartTime);
  const breakEndMin = toMin(breakEndTime);
  const endMin = toMin(workEndTime);

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
      const lateMinutes = Math.max(0, punchMinutes - startMin);
      updatePayload = {
        clock_in: timeStr,
        status: lateMinutes > 0 ? "late" : "ontime",
        late_minutes: lateMinutes,
        notes: `ZKTeco (${deviceSerial || "LAN"})`,
      };
      console.log(`✅ [CLOCK-IN] ${employeeName} at ${timeStr}`);
    } else {
      const ciMin = toMin(existingRecord.clock_in);
      const breakDuration = Math.max(0, breakEndMin - breakStartMin);
      const hoursWorked = Math.max(0, parseFloat(((punchMinutes - ciMin - breakDuration) / 60).toFixed(2)));
      const earlyLeaveMinutes = Math.max(0, endMin - punchMinutes);

      updatePayload = {
        clock_out: timeStr,
        hours_worked: hoursWorked,
        early_leave_minutes: earlyLeaveMinutes,
      };
      console.log(`✅ [CLOCK-OUT] ${employeeName} at ${timeStr} (${hoursWorked}h)`);
    }
  } else {
    // 4-Punch Multi-Session Mode (Kampong Thom / Pinex Agro: 7:30 In -> 11:30 Out -> 13:00 In -> 17:00 Out)
    const midMorningBreak = breakStartMin - 30; // e.g. 11:00 AM
    const midAfternoonBreak = breakEndMin + 45; // e.g. 01:45 PM

    if (!existingRecord || (!existingRecord.clock_in && punchMinutes < midMorningBreak)) {
      // 1️⃣ PUNCH 1: Morning Check-In (e.g. ~07:30 AM)
      const lateMinutes = Math.max(0, punchMinutes - startMin);
      updatePayload = {
        clock_in: timeStr,
        status: lateMinutes > 0 ? "late" : "ontime",
        late_minutes: lateMinutes,
        notes: `ZKTeco 4-Punch (${site?.name || branch?.name || "Branch Site"})`,
      };
      console.log(`✅ [PUNCH 1: MORNING IN] ${employeeName} at ${timeStr}`);
    } else if (punchMinutes >= midMorningBreak && punchMinutes < breakEndMin && !existingRecord?.break_out) {
      // 2️⃣ PUNCH 2: Morning Check-Out / Lunch Out (e.g. ~11:30 AM)
      const morningEarlyLeave = Math.max(0, breakStartMin - punchMinutes);
      updatePayload = {
        break_out: timeStr,
        early_leave_minutes: morningEarlyLeave,
      };
      console.log(`✅ [PUNCH 2: LUNCH OUT] ${employeeName} at ${timeStr}`);
    } else if (punchMinutes >= breakStartMin && punchMinutes < midAfternoonBreak && !existingRecord?.break_in) {
      // 3️⃣ PUNCH 3: Afternoon Check-In / Lunch In (e.g. ~01:00 PM)
      updatePayload = {
        break_in: timeStr,
      };
      console.log(`✅ [PUNCH 3: AFTERNOON IN] ${employeeName} at ${timeStr}`);
    } else {
      // 4️⃣ PUNCH 4: Afternoon Check-Out / Final Shift End (e.g. ~05:00 PM)
      const p1Min = toMin(existingRecord?.clock_in || workStartTime);
      const p2Min = toMin(existingRecord?.break_out || breakStartTime);
      const p3Min = toMin(existingRecord?.break_in || breakEndTime);
      const p4Min = punchMinutes;

      const morningSessionHours = Math.max(0, (p2Min - p1Min) / 60);
      const afternoonSessionHours = Math.max(0, (p4Min - p3Min) / 60);
      const totalHours = parseFloat((morningSessionHours + afternoonSessionHours).toFixed(2));
      const earlyLeaveMinutes = Math.max(0, endMin - punchMinutes);

      updatePayload = {
        clock_out: timeStr,
        hours_worked: totalHours,
        early_leave_minutes: earlyLeaveMinutes,
      };
      console.log(`✅ [PUNCH 4: FINAL OUT] ${employeeName} at ${timeStr} (Total: ${totalHours}h worked)`);
    }
  }

  // 3. Upsert into attendance_records
  const { error: upsertErr } = await supabase.from("attendance_records").upsert(
    {
      employee_id: employee.id,
      date: dateStr,
      work_location_id: employee.default_work_location_id || null,
      branch_id: employee.branch_id || null,
      ...updatePayload,
    },
    { onConflict: "employee_id,date" }
  );

  if (upsertErr) {
    console.error(`❌ Failed to update attendance record for ${employeeName}:`, upsertErr.message);
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

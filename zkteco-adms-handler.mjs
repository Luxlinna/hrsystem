/**
 * ZKTeco Cloud ADMS Protocol Handler
 * 
 * Handles push requests from ZKTeco biometric terminals (K40, SilkBio, MB460 Plus, etc.):
 * - GET  /iclock/cdata       -> Device registration & configuration handshake
 * - POST /iclock/cdata       -> Attendance punch log ingestion (table=ATTLOG)
 * - GET  /iclock/getrequest  -> Device heartbeat & pending command polling
 * - POST /iclock/devicecmd   -> Command execution acknowledgment
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  process.env.VITE_PUBLIC_SUPABASE_URL ||
  "https://blcvtbzwpwmqkphlcjji.supabase.co";

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  process.env.VITE_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function toMin(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Process a single attendance log entry from ZKTeco into Supabase
 */
export async function processZkPunchRecord(punch) {
  const { userId, timestamp, punchType, verifyType, deviceSerial } = punch;
  if (!userId || !timestamp) return;

  const punchDate = new Date(timestamp);
  if (isNaN(punchDate.getTime())) return;

  const dateStr = punchDate.toISOString().slice(0, 10); // YYYY-MM-DD
  const timeStr = punchDate.toTimeString().slice(0, 8); // HH:mm:ss
  const punchMinutes = toMin(timeStr);

  // 1. Find employee by biometric_user_id or employee ID (if valid UUID)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(userId));
  let empQuery = supabase
    .from("employees")
    .select(`
      id, first_name, last_name, branch_id, default_work_location_id,
      branches(name, work_start_time, work_end_time, late_grace_minutes, early_leave_grace_minutes, morning_check_in_start, morning_check_in_end, morning_check_out_start, morning_check_out_end, afternoon_check_in_start, afternoon_check_in_end, afternoon_check_out_start, afternoon_check_out_end),
      work_locations:default_work_location_id(name, work_start_time, break_start_time, break_end_time, work_end_time, late_grace_minutes, early_leave_grace_minutes, is_four_punch_enabled, morning_check_in_start, morning_check_in_end, morning_check_out_start, morning_check_out_end, afternoon_check_in_start, afternoon_check_in_end, afternoon_check_out_start, afternoon_check_out_end)
    `);

  if (isUuid) {
    empQuery = empQuery.or(`biometric_user_id.eq.${userId},id.eq.${userId}`);
  } else {
    empQuery = empQuery.eq("biometric_user_id", String(userId));
  }

  const { data: employee, error: empErr } = await empQuery.maybeSingle();

  if (empErr || !employee) {
    console.warn(`[ZKTeco ADMS] User ID [${userId}] is not mapped to any active employee in HR System.`);
    // Still record raw punch for hardware auditing so no scan is lost
    await supabase.from("biometric_raw_logs").insert({
      device_serial: deviceSerial || "ZK-ADMS",
      biometric_user_id: String(userId),
      punch_time: punchDate.toISOString(),
      punch_state: punchType ?? 0,
      verify_type: verifyType ?? 1,
      processed: false,
    });
    return;
  }

  // 1b. Fetch device info to guarantee strict branch isolation
  const { data: device } = await supabase
    .from("biometric_devices")
    .select("id, branch_id, work_location_id, device_name")
    .eq("device_serial", deviceSerial)
    .maybeSingle();

  // If the device is tied to a branch, verify the employee belongs to this exact branch!
  if (device?.branch_id && employee.branch_id && employee.branch_id !== device.branch_id) {
    console.warn(
      `[ZKTeco ADMS] Punch ignored: Employee ${employee.first_name} ${employee.last_name} belongs to branch ${employee.branch_id}, but machine "${device.device_name}" is assigned to branch ${device.branch_id}.`
    );
    return;
  }

  const employeeName = `${employee.first_name} ${employee.last_name}`;
  const site = employee.work_locations;
  const branch = employee.branches;

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
    // Standard 2-Punch Mode
    if (!existingRecord || !existingRecord.clock_in) {
      if (punchMinutes < morningInStartMin || punchMinutes > morningInEndMin) {
        console.log(`[ZKTeco ADMS] [IGNORED SCAN] ${employeeName} at ${timeStr} outside allowed check-in window (${morningCheckInStart.slice(0, 5)} - ${morningCheckInEnd.slice(0, 5)}). Not recorded.`);
      } else {
        const rawLateMinutes = Math.max(0, punchMinutes - startMin);
        const isLate = rawLateMinutes > lateGraceMin;
        const lateMinutes = isLate ? rawLateMinutes - lateGraceMin : 0;
        updatePayload = {
          clock_in: timeStr,
          status: isLate ? "late" : "ontime",
          late_minutes: lateMinutes,
          notes: `ZKTeco Cloud (${deviceSerial || "ADMS"})`,
        };
        console.log(`[ZKTeco ADMS] [CLOCK-IN] ${employeeName} at ${timeStr}`);
      }
    } else {
      if (punchMinutes < afternoonOutStartMin || punchMinutes > afternoonOutEndMin) {
        console.log(`[ZKTeco ADMS] [IGNORED SCAN] ${employeeName} at ${timeStr} outside allowed check-out window (${afternoonCheckOutStart.slice(0, 5)} - ${afternoonCheckOutEnd.slice(0, 5)}). Not recorded.`);
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
        console.log(`[ZKTeco ADMS] [CLOCK-OUT] ${employeeName} at ${timeStr} (${hoursWorked}h)`);
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
      // 1. Morning Check-In Window (06:00 AM - 09:00 AM)
      const rawLateMinutes = Math.max(0, punchMinutes - startMin);
      const isLate = rawLateMinutes > lateGraceMin;
      const lateMinutes = isLate ? rawLateMinutes - lateGraceMin : 0;
      updatePayload = {
        clock_in: timeStr,
        status: isLate ? "late" : "ontime",
        late_minutes: lateMinutes,
        notes: `ZKTeco 4-Punch (${site?.name || branch?.name || "Branch"})`,
      };
      console.log(`[ZKTeco ADMS] [PUNCH 1: MORNING IN] ${employeeName} at ${timeStr} (Status: ${isLate ? "late" : "ontime"})`);
    } else if (isMorningOutWindow && preferMorningOut) {
      // 2. Morning Check-Out (exact 12:00 border disambiguation)
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
      console.log(`[ZKTeco ADMS] [PUNCH 2: LUNCH OUT] ${employeeName} at ${timeStr} (Early: ${morningEarlyLeave}m, Morning: ${morningHours}h)`);
    } else if (isMorningOutWindow && !existingRecord?.break_out && punchMinutes < afternoonInStartMin) {
      // 2. Morning Check-Out / Lunch Out (10:00 AM - 12:00 PM)
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
      console.log(`[ZKTeco ADMS] [PUNCH 2: LUNCH OUT] ${employeeName} at ${timeStr} (Early: ${morningEarlyLeave}m, Morning: ${morningHours}h)`);
    } else if (isAfternoonInWindow && !existingRecord?.break_in) {
      // 3. Lunch In (Window: 12:00 PM - 02:00 PM)
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
        notes: existingRecord?.notes || `ZKTeco 4-Punch (${site?.name || branch?.name || "Branch"})`,
      };
      console.log(`[ZKTeco ADMS] [PUNCH 3: AFTERNOON IN] ${employeeName} at ${timeStr} (Status: ${isAfternoonLate ? "late" : "ontime"})`);
    } else if (isAfternoonOutWindow) {
      // 4. Final Shift End (Window: 04:00 PM - 06:00 PM)
      // Before 05:00 PM: early checkout. Between 05:00 PM and 06:00 PM: ontime
      let afternoonEarlyLeave = 0;
      if (punchMinutes < endMin) {
        const rawEarlyLeave = Math.max(0, endMin - punchMinutes);
        const isEarly = rawEarlyLeave > earlyGraceMin;
        afternoonEarlyLeave = isEarly ? rawEarlyLeave - earlyGraceMin : 0;
      }
      const existingEarlyLeave = existingRecord?.early_leave_minutes || 0;

      // 8-Hour Rule: Morning 4h max + Afternoon 4h max = 8h Total
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
      console.log(`[ZKTeco ADMS] [PUNCH 4: FINAL OUT] ${employeeName} at ${timeStr} (Morning: ${morningHours}h, Afternoon: ${afternoonHours}h, Total: ${totalHours}h)`);
    } else {
      console.log(`[ZKTeco ADMS] [IGNORED SCAN] ${employeeName} at ${timeStr} outside allowed punch windows. Not recorded.`);
    }
  }

  if (Object.keys(updatePayload).length === 0) {
    // Scan was outside allowed windows, do not record anything into attendance_records
    await supabase.from("biometric_raw_logs").insert({
      device_serial: deviceSerial || "ZK-ADMS",
      biometric_user_id: String(userId),
      punch_time: punchDate.toISOString(),
      punch_state: punchType ?? 0,
      verify_type: verifyType ?? 1,
      processed: false,
    });
    return;
  }

  // 3. Upsert attendance_records
  const { data: upsertedRecord, error: upsertErr } = await supabase.from("attendance_records").upsert(
    {
      employee_id: employee.id,
      date: dateStr,
      work_location_id: employee.default_work_location_id || null,
      clock_in_branch_id: employee.branch_id || null,
      deleted_at: null,
      deleted_by: null,
      ...updatePayload,
    },
    { onConflict: "employee_id,date" }
  ).select().single();

  if (upsertErr) {
    console.error("[ZKTeco ADMS] Failed to upsert attendance:", upsertErr.message);
  }

  // 4. Insert raw audit log
  await supabase.from("biometric_raw_logs").insert({
    device_serial: deviceSerial || "ZK-ADMS",
    biometric_user_id: String(userId),
    punch_time: punchDate.toISOString(),
    punch_state: punchType ?? 0,
    verify_type: verifyType ?? 1,
    processed: true,
    attendance_record_id: upsertedRecord?.id || null,
  });

  // 5. Update device status to online & record last_sync_at
  if (deviceSerial) {
    await supabase
      .from("biometric_devices")
      .update({
        status: "online",
        last_sync_at: new Date().toISOString(),
      })
      .eq("device_serial", deviceSerial);
  }
}

/**
 * Parses raw text lines posted by ZKTeco ADMS
 */
function parseAttLogLines(rawBody, deviceSerial) {
  const lines = rawBody.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
  const punches = [];

  for (const line of lines) {
    // Format A: Key-Value pairs (PIN=1\tCHECKTIME=2026-09-03 09:30:00\tCHECKTYPE=0\tVERIFYTYPE=1)
    if (line.includes("=")) {
      const parts = line.split(/[\t,]+/);
      const data = {};
      for (const p of parts) {
        const [k, v] = p.split("=");
        if (k && v !== undefined) data[k.trim().toUpperCase()] = v.trim();
      }
      const userId = data.PIN || data.USERID || data.ID;
      const timestamp = data.CHECKTIME || data.TIME;
      const punchType = data.CHECKTYPE !== undefined ? parseInt(data.CHECKTYPE, 10) : 0;
      const verifyType = data.VERIFYTYPE !== undefined ? parseInt(data.VERIFYTYPE, 10) : 1;
      if (userId && timestamp) {
        punches.push({ userId, timestamp, punchType, verifyType, deviceSerial });
      }
      continue;
    }

    // Format B: Tab or Space separated (1\t2026-09-03 09:30:00\t0\t1...)
    const cols = line.split("\t");
    if (cols.length >= 2) {
      const userId = cols[0].trim();
      const timestamp = cols[1].trim();
      const punchType = cols[2] ? parseInt(cols[2].trim(), 10) : 0;
      const verifyType = cols[3] ? parseInt(cols[3].trim(), 10) : 1;
      if (userId && timestamp) {
        punches.push({ userId, timestamp, punchType, verifyType, deviceSerial });
      }
    }
  }

  return punches;
}

/**
 * Main HTTP Handler for ZKTeco ADMS
 * Returns true if request was handled, false if not an iclock route.
 */
export async function handleZkAdmsRequest(req, res) {
  const parsedUrl = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = parsedUrl.pathname;

  if (!pathname.startsWith("/iclock")) {
    return false;
  }

  const sn = parsedUrl.searchParams.get("SN") || "";
  const table = (parsedUrl.searchParams.get("table") || "").toUpperCase();

  // 1. Heartbeat & Command Polling: GET /iclock/getrequest
  if (pathname === "/iclock/getrequest") {
    console.log(`[ZKTeco ADMS] Heartbeat getrequest from SN: ${sn || "Unknown"}`);

    try {
      // Check for pending device commands
      const { data: pendingCmds } = await supabase
        .from("biometric_device_commands")
        .select("id, command")
        .eq("device_serial", sn)
        .eq("status", "pending")
        .order("id", { ascending: true })
        .limit(10);

      if (pendingCmds && pendingCmds.length > 0) {
        console.log(`[ZKTeco ADMS] Dispatching ${pendingCmds.length} commands to SN: ${sn}`);
        const commandLines = pendingCmds.map(c => `C:${c.id}:${c.command}`).join("\r\n") + "\r\n";
        
        // Mark as sent
        const cmdIds = pendingCmds.map(c => c.id);
        await supabase
          .from("biometric_device_commands")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .in("id", cmdIds);

        res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
        res.end(commandLines);
        return true;
      }
    } catch (cmdErr) {
      console.error("[ZKTeco ADMS] Error checking pending commands:", cmdErr);
    }

    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("OK\r\n");
    return true;
  }

  // 2. Command Acknowledgment: POST /iclock/devicecmd
  if (pathname === "/iclock/devicecmd") {
    let cmdBody = "";
    req.on("data", (chunk) => { cmdBody += chunk; });
    req.on("end", async () => {
      console.log(`[ZKTeco ADMS] Devicecmd ACK from SN: ${sn}:`, cmdBody.trim());
      try {
        // Parse acknowledgment: e.g. ID=101&Return=0
        const lines = cmdBody.split("\n");
        for (const line of lines) {
          const match = line.match(/ID=(\d+)&Return=(-?\d+)/);
          if (match) {
            const cmdId = parseInt(match[1], 10);
            const returnCode = parseInt(match[2], 10);
            const status = returnCode === 0 ? "success" : "failed";
            await supabase
              .from("biometric_device_commands")
              .update({
                status,
                completed_at: new Date().toISOString(),
              })
              .eq("id", cmdId);
          }
        }
      } catch (ackErr) {
        console.error("[ZKTeco ADMS] Error updating command status:", ackErr);
      }
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("OK\r\n");
    });
    return true;
  }

  // 3. Handshake & Config: GET /iclock/cdata
  if (pathname === "/iclock/cdata" && req.method === "GET") {
    console.log(`[ZKTeco ADMS] Handshake from Device SN: ${sn || "Unknown"}`);
    
    // Update device status in database
    if (sn) {
      supabase
        .from("biometric_devices")
        .update({ status: "online", last_sync_at: new Date().toISOString() })
        .eq("device_serial", sn)
        .then();
    }

    const configResponse = [
      `GET OPTION FROM: ${sn || "ZKTeco"}`,
      "Stamp=0",
      "OpStamp=0",
      "PhotoStamp=0",
      "ATTLOGStamp=0",
      "OPERLOGStamp=0",
      "ATTPHOTOStamp=0",
      "ErrorDelay=30",
      "Delay=5",
      "TransTimes=00:00;14:00",
      "TransInterval=1",
      "TransFlag=1111000000",
      "TimeZone=7",
      "Realtime=1",
      "Encrypt=0",
      "ServerVer=3.4.1",
      "PushProtVer=3.2.0",
    ].join("\r\n") + "\r\n";

    res.writeHead(200, { 
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Length": Buffer.byteLength(configResponse),
    });
    res.end(configResponse);
    return true;
  }

  // 4. Punch Ingestion: POST /iclock/cdata
  if (pathname === "/iclock/cdata" && req.method === "POST") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        console.log(`[ZKTeco ADMS] Data received from SN: ${sn}, Table: ${table || "ATTLOG"}`);
        console.log(`[ZKTeco ADMS] Raw POST payload:\n${body}`);

        if (table === "ATTLOG" || !table) {
          const punches = parseAttLogLines(body, sn);
          console.log(`[ZKTeco ADMS] Found ${punches.length} punch records to process.`);

          for (const punch of punches) {
            await processZkPunchRecord(punch);
          }

          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end(`OK: ${punches.length}\r\n`);
        } else {
          // Other tables (OPERLOG, USER, etc.)
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("OK\r\n");
        }
      } catch (err) {
        console.error("[ZKTeco ADMS] Error processing punch payload:", err);
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("OK\r\n");
      }
    });

    return true;
  }

  // Default fallback for any other /iclock subpath
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("OK");
  return true;
}

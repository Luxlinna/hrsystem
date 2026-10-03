import { BiometricRepository, biometricRepository } from './zkteco.repository.js';
import { AttendanceRepository, attendanceRepository } from '../attendance/attendance.repository.js';
import { AttendanceService, attendanceService } from '../attendance/attendance.service.js';
import { UnitOfWork, unitOfWork } from '../../core/infrastructure/database/unit-of-work.js';
import { RawPunchRecord, DeviceMetadata } from './zkteco.types.js';
import { EmployeeWithRelations } from '../attendance/attendance.types.js';
import { sendTelegramNotification } from '../../common/utils/telegram.util.js';

export class BiometricService {
  private deviceHeartbeatThrottle = new Map<string, number>();
  private deviceCache = new Map<string, { data: DeviceMetadata; time: number }>();
  private employeeDirectoryCache: EmployeeWithRelations[] | null = null;
  private employeeDirectoryTime = 0;

  constructor(
    private biometricRepo: BiometricRepository = biometricRepository,
    private attendanceRepo: AttendanceRepository = attendanceRepository,
    private attendService: AttendanceService = attendanceService,
    private uow: UnitOfWork = unitOfWork
  ) {}

  /**
   * Cached device lookup (5 min TTL)
   */
  async getOrFetchDevice(deviceSerial: string): Promise<DeviceMetadata | null> {
    if (!deviceSerial) return null;
    const cached = this.deviceCache.get(deviceSerial);
    if (cached && Date.now() - cached.time < 300000) {
      return cached.data;
    }

    const data = await this.biometricRepo.findDeviceBySerial(deviceSerial);
    if (data) {
      this.deviceCache.set(deviceSerial, { data, time: Date.now() });
    }
    return data;
  }

  /**
   * Cached employee directory lookup (2 min TTL)
   */
  async getOrFetchEmployees(): Promise<EmployeeWithRelations[]> {
    if (this.employeeDirectoryCache && Date.now() - this.employeeDirectoryTime < 120000) {
      return this.employeeDirectoryCache;
    }

    const data = await this.attendanceRepo.findEmployeeDirectory();
    this.employeeDirectoryCache = data || [];
    this.employeeDirectoryTime = Date.now();
    return this.employeeDirectoryCache;
  }

  /**
   * Fuzzy matches biometric user ID against employee directory
   */
  findEmployeeInMemory(
    userId: string,
    deviceBranchId: string | null | undefined,
    allEmployees: EmployeeWithRelations[]
  ): EmployeeWithRelations | null {
    if (!userId || !allEmployees || allEmployees.length === 0) return null;
    const cleanId = String(userId).trim();
    const numMatch = cleanId.match(/\d+/);
    const numVal = numMatch ? parseInt(numMatch[0], 10) : NaN;
    const rawNumStr = !isNaN(numVal) ? String(numVal) : cleanId;
    const padded3Str = !isNaN(numVal) ? String(numVal).padStart(3, '0') : cleanId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

    const matchFn = (emp: EmployeeWithRelations) => {
      if (isUuid) {
        return emp.id === cleanId || emp.biometric_user_id === cleanId;
      }
      const bio = String(emp.biometric_user_id || '').trim();
      const code = String(emp.employee_code || '').trim();
      return (
        bio === rawNumStr ||
        bio === padded3Str ||
        code === rawNumStr ||
        code === padded3Str ||
        bio.endsWith(padded3Str) ||
        bio.endsWith(` ${rawNumStr}`)
      );
    };

    // 1. Prioritize employee in the same branch as the device
    if (deviceBranchId) {
      const branchMatch = allEmployees.find((e) => e.branch_id === deviceBranchId && matchFn(e));
      if (branchMatch) return branchMatch;
    }

    // 2. Global directory match
    return allEmployees.find(matchFn) || null;
  }

  /**
   * Sends device alert via Telegram if enabled in system settings
   */
  async sendDeviceTelegramNotification(message: string): Promise<void> {
    try {
      const notifSetting = await this.biometricRepo.getSystemSetting('biometric_offline_alert_enabled');
      if (notifSetting?.value === 'false') return;

      await sendTelegramNotification(message);
    } catch (err: any) {
      console.warn('[ZKTeco ADMS] Telegram notification exception:', err?.message || err);
    }
  }

  /**
   * Updates device heartbeat and recovers offline status if reconnected
   */
  async recordDeviceActivity(deviceSerial: string): Promise<void> {
    if (!deviceSerial) return;
    const now = Date.now();
    const lastRecorded = this.deviceHeartbeatThrottle.get(deviceSerial) || 0;
    const shouldUpdateDb = now - lastRecorded > 60000;

    try {
      const dev = await this.biometricRepo.findDeviceBySerial(deviceSerial);
      if (!dev) {
        console.warn(`[ZKTeco ADMS] Device ${deviceSerial} not registered in biometric_devices.`);
        return;
      }

      if (dev.alerted_offline) {
        console.log(`[ZKTeco ADMS] Device ${dev.device_name} (${deviceSerial}) RECOVERED! Sending recovery alert...`);
        await this.biometricRepo.updateDevice(dev.id, {
          status: 'online',
          last_sync_at: new Date(),
          alerted_offline: false,
        });

        this.deviceHeartbeatThrottle.set(deviceSerial, now);

        const branchName = dev.branches?.name || 'Branch Office';
        const recoveryTime = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Phnom_Penh',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        }).format(new Date());

        const recoveryMsg = [
          '✅ <b>Biometric Device Back Online</b>',
          '',
          `📍 <b>Location / Branch:</b> ${branchName}`,
          `📟 <b>Device:</b> ${dev.device_name} (<code>${deviceSerial}</code>)`,
          `🕒 <b>Reconnected At:</b> ${recoveryTime}`,
          '📶 <b>Status:</b> Communication restored. Online and actively syncing.',
        ].join('\n');

        await this.sendDeviceTelegramNotification(recoveryMsg);
      } else if (shouldUpdateDb) {
        await this.biometricRepo.updateDevice(dev.id, {
          status: 'online',
          last_sync_at: new Date(),
        });
        this.deviceHeartbeatThrottle.set(deviceSerial, now);
      }
    } catch (err: any) {
      console.error('[ZKTeco ADMS] Error updating device activity:', err?.message || err);
    }
  }

  /**
   * Offline Watchdog: Checks communication health of all active biometric terminals
   */
  async checkBiometricDeviceHealth(): Promise<void> {
    try {
      const enabledSetting = await this.biometricRepo.getSystemSetting('biometric_offline_alert_enabled');
      if (enabledSetting?.value === 'false') return;

      const threshSetting = await this.biometricRepo.getSystemSetting('biometric_offline_threshold_minutes');
      const thresholdMinutes = parseInt(threshSetting?.value || '60', 10) || 60;

      // Guard: Check Cambodia working hours (06:00 to 19:00 UTC+7)
      const nowPnh = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' }));
      const currentHour = nowPnh.getHours();
      if (currentHour < 6 || currentHour >= 19) return;

      const devices = await this.biometricRepo.findDevicesForWatchdog();
      if (!devices || devices.length === 0) return;

      const now = Date.now();

      for (const dev of devices) {
        if (dev.status === 'inactive') continue;
        if (dev.alerted_offline) continue;
        if (!dev.last_sync_at) continue;

        const lastSyncTime = new Date(dev.last_sync_at).getTime();
        const elapsedMinutes = Math.floor((now - lastSyncTime) / 60000);

        if (elapsedMinutes >= thresholdMinutes) {
          console.warn(`[ZKTeco Watchdog] Device ${dev.device_name} is OFFLINE for ${elapsedMinutes}m. Dispatching alert...`);

          const branchName = dev.branches?.name || 'Branch Office';
          const lastSeenFormatted = new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Phnom_Penh',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          }).format(new Date(dev.last_sync_at));

          const alertMsg = [
            '⚠️ <b>Biometric Device Offline Alert</b>',
            '',
            `📍 <b>Location / Branch:</b> ${branchName}`,
            `📟 <b>Device:</b> ${dev.device_name} (<code>${dev.device_serial || 'N/A'}</code>)`,
            `🕒 <b>Last Heartbeat:</b> ${lastSeenFormatted} (<b>${elapsedMinutes} mins ago</b>)`,
            '',
            '🔴 <b>Action Required:</b>',
            '• Check power to the ZKTeco terminal and router.',
            '• Verify 4G SIM mobile credit/data connectivity.',
            '• Ensure Ethernet cable is connected tightly.',
          ].join('\n');

          await this.biometricRepo.updateDevice(dev.id, {
            status: 'offline',
            alerted_offline: true,
            last_offline_alert_at: new Date(),
          });

          await this.sendDeviceTelegramNotification(alertMsg);
        }
      }
    } catch (err: any) {
      console.error('[ZKTeco Watchdog] Error checking device health:', err?.message || err);
    }
  }

  /**
   * Parses raw lines posted by ZKTeco ADMS
   */
  parseAttLogLines(rawBody: string, deviceSerial: string): RawPunchRecord[] {
    const lines = rawBody.split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean);
    const punches: RawPunchRecord[] = [];

    for (const line of lines) {
      // Format A: Key-Value pairs (PIN=1\tCHECKTIME=2026-09-03 09:30:00\tCHECKTYPE=0\tVERIFYTYPE=1)
      if (line.includes('=')) {
        const parts = line.split(/[\t,]+/);
        const data: Record<string, string> = {};
        for (const p of parts) {
          const [k, v] = p.split('=');
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
      const cols = line.split('\t');
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
   * Generates standard ADMS Handshake Config Response
   */
  getConfigResponse(deviceSerial: string): string {
    return [
      `GET OPTION FROM: ${deviceSerial || 'ZKTeco'}`,
      'Stamp=0',
      'OpStamp=0',
      'PhotoStamp=0',
      'ATTLOGStamp=0',
      'OPERLOGStamp=0',
      'ATTPHOTOStamp=0',
      'ErrorDelay=30',
      'Delay=5',
      'TransTimes=00:00;14:00',
      'TransInterval=1',
      'TransFlag=1111000000',
      'TimeZone=7',
      'Realtime=1',
      'Encrypt=0',
      'ServerVer=3.4.1',
      'PushProtVer=3.2.0',
    ].join('\r\n') + '\r\n';
  }

  /**
   * Handles GET /iclock/getrequest for device heartbeat and pending command dispatch
   */
  async handleHeartbeatAndCommands(deviceSerial: string): Promise<string> {
    if (deviceSerial) {
      await this.recordDeviceActivity(deviceSerial);
    }

    const pendingCmds = await this.biometricRepo.findPendingCommands(deviceSerial);
    if (pendingCmds && pendingCmds.length > 0) {
      console.log(`[ZKTeco ADMS] Dispatching ${pendingCmds.length} commands to SN: ${deviceSerial}`);
      const commandLines = pendingCmds.map((c) => `C:${c.id}:${c.command}`).join('\r\n') + '\r\n';
      const cmdIds = pendingCmds.map((c) => c.id);
      await this.biometricRepo.markCommandsSent(cmdIds);
      return commandLines;
    }

    return 'OK\r\n';
  }

  /**
   * Handles POST /iclock/devicecmd for command acknowledgment
   */
  async handleCommandAck(deviceSerial: string, rawBody: string): Promise<void> {
    console.log('[ZKTeco ADMS] Devicecmd ACK from SN:', deviceSerial, rawBody.trim());
    const lines = rawBody.split('\n');
    for (const line of lines) {
      const match = line.match(/ID=(\d+)&Return=(-?\d+)/);
      if (match) {
        const cmdId = parseInt(match[1], 10);
        const returnCode = parseInt(match[2], 10);
        const status = returnCode === 0 ? 'success' : 'failed';
        await this.biometricRepo.updateCommandStatus(cmdId, status);
      }
    }
  }

  /**
   * Processes a single raw punch record into Prisma attendance and raw logs
   */
  async processPunchRecord(punch: RawPunchRecord): Promise<void> {
    const { userId, timestamp, punchType, verifyType, deviceSerial } = punch;
    if (!userId || !timestamp) return;

    let dateStr = '';
    let timeStr = '';

    if (typeof timestamp === 'string' && timestamp.includes(' ')) {
      const [d, t] = timestamp.trim().split(/\s+/);
      dateStr = d;
      timeStr = t ? t.slice(0, 8) : '00:00:00';
    } else if (typeof timestamp === 'string' && timestamp.includes('T')) {
      const [d, rest] = timestamp.trim().split('T');
      dateStr = d;
      timeStr = rest ? rest.slice(0, 8) : '00:00:00';
    } else {
      const punchDate = new Date(timestamp);
      if (isNaN(punchDate.getTime())) return;
      dateStr = punchDate.toISOString().slice(0, 10);
      timeStr = punchDate.toTimeString().slice(0, 8);
    }

    if (!dateStr || !timeStr) return;
    const punchDate = new Date(`${dateStr}T${timeStr}+07:00`);

    // 1. Look up device and employee
    const device = await this.getOrFetchDevice(deviceSerial || '');
    const allEmployees = await this.getOrFetchEmployees();
    const employee = this.findEmployeeInMemory(userId, device?.branch_id, allEmployees);

    if (!employee) {
      console.warn(`[ZKTeco ADMS] User ID [${userId}] is not mapped to any employee in the directory.`);
      await this.biometricRepo.createRawLog({
        device_serial: deviceSerial || 'ZK-ADMS',
        biometric_user_id: String(userId),
        punch_time: punchDate,
        punch_state: punchType ?? 0,
        verify_type: verifyType ?? 1,
        processed: false,
      });
      return;
    }

    // 2. Fetch existing attendance record for today
    const existingRecord = await this.attendanceRepo.findTodayRecord(employee.id, dateStr);

    // 3. Evaluate punch against shift calculation engine
    const { updatePayload, ignored, description } = this.attendService.calculatePunch(existingRecord, {
      employee,
      dateStr,
      timeStr,
      deviceSerial,
      deviceBranchId: device?.branch_id,
      deviceWorkLocationId: device?.work_location_id,
    });

    console.log(`[ZKTeco ADMS] ${description}`);

    if (ignored || Object.keys(updatePayload).length === 0) {
      await this.biometricRepo.createRawLog({
        device_serial: deviceSerial || 'ZK-ADMS',
        biometric_user_id: String(userId),
        punch_time: punchDate,
        punch_state: punchType ?? 0,
        verify_type: verifyType ?? 1,
        processed: false,
      });
      return;
    }

    // 4. Upsert attendance record via Unit of Work / Repository
    const dateObj = new Date(`${dateStr}T00:00:00.000Z`);
    const savedRecord = await this.attendanceRepo.upsertAttendance(employee.id, dateObj, {
      ...updatePayload,
      work_location_id: employee.default_work_location_id || device?.work_location_id || null,
      clock_in_branch_id: employee.branch_id || device?.branch_id || null,
    } as any);

    // 5. Insert raw audit log linked to attendance record
    await this.biometricRepo.createRawLog({
      device_serial: deviceSerial || 'ZK-ADMS',
      biometric_user_id: String(userId),
      punch_time: punchDate,
      punch_state: punchType ?? 0,
      verify_type: verifyType ?? 1,
      processed: true,
      attendance_record_id: savedRecord.id,
    });

    // 6. Update device activity
    if (deviceSerial) {
      await this.recordDeviceActivity(deviceSerial);
    }
  }
}

export const biometricService = new BiometricService();

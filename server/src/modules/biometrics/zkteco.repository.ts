import { biometric_raw_logs, biometric_devices, biometric_device_commands, system_settings, Prisma } from '@prisma/client';
import { BaseRepository, TransactionClient } from '../../core/infrastructure/database/base.repository.js';
import { prisma } from '../../core/infrastructure/database/prisma.client.js';

export class BiometricRepository extends BaseRepository<
  biometric_raw_logs,
  Prisma.biometric_raw_logsCreateInput,
  Prisma.biometric_raw_logsUpdateInput,
  Prisma.biometric_raw_logsWhereInput,
  Prisma.biometric_raw_logsOrderByWithRelationInput,
  Prisma.biometric_raw_logsDelegate<any>
> {
  constructor() {
    super('biometric_raw_logs');
  }

  /**
   * Save a raw hardware punch log
   */
  async createRawLog(
    data: {
      device_serial: string;
      biometric_user_id: string;
      punch_time: Date;
      punch_state?: number;
      verify_type?: number;
      processed?: boolean;
      attendance_record_id?: string | null;
    },
    tx?: TransactionClient
  ): Promise<biometric_raw_logs> {
    const client = tx || prisma;
    return client.biometric_raw_logs.create({
      data: {
        device_serial: data.device_serial,
        biometric_user_id: data.biometric_user_id,
        punch_time: data.punch_time,
        punch_state: data.punch_state ?? 0,
        verify_type: data.verify_type ?? 1,
        processed: data.processed ?? false,
        attendance_record_id: data.attendance_record_id || null,
      },
    });
  }

  /**
   * Fetch device by its serial number including branch info
   */
  async findDeviceBySerial(deviceSerial: string, tx?: TransactionClient): Promise<any | null> {
    const client = tx || prisma;
    return client.biometric_devices.findUnique({
      where: { device_serial: deviceSerial },
      include: {
        branches: {
          select: { name: true },
        },
      },
    });
  }

  /**
   * Update device status, sync time, or offline flags
   */
  async updateDevice(
    deviceId: string,
    data: Prisma.biometric_devicesUpdateInput,
    tx?: TransactionClient
  ): Promise<biometric_devices> {
    const client = tx || prisma;
    return client.biometric_devices.update({
      where: { id: deviceId },
      data,
    });
  }

  /**
   * Fetch all active devices for health check watchdog
   */
  async findDevicesForWatchdog(tx?: TransactionClient): Promise<any[]> {
    const client = tx || prisma;
    return client.biometric_devices.findMany({
      select: {
        id: true,
        device_name: true,
        device_serial: true,
        status: true,
        last_sync_at: true,
        alerted_offline: true,
        branches: {
          select: { name: true },
        },
      },
    });
  }

  /**
   * Get pending commands for a device
   */
  async findPendingCommands(deviceSerial: string, limit = 10, tx?: TransactionClient): Promise<biometric_device_commands[]> {
    const client = tx || prisma;
    return client.biometric_device_commands.findMany({
      where: {
        device_serial: deviceSerial,
        status: 'pending',
      },
      orderBy: { id: 'asc' },
      take: limit,
    });
  }

  /**
   * Mark commands as sent
   */
  async markCommandsSent(commandIds: bigint[], tx?: TransactionClient): Promise<void> {
    const client = tx || prisma;
    await client.biometric_device_commands.updateMany({
      where: { id: { in: commandIds } },
      data: {
        status: 'sent',
        sent_at: new Date(),
      },
    });
  }

  /**
   * Update command status upon device execution acknowledgment
   */
  async updateCommandStatus(
    commandId: bigint | number,
    status: 'success' | 'failed',
    tx?: TransactionClient
  ): Promise<void> {
    const client = tx || prisma;
    await client.biometric_device_commands.update({
      where: { id: BigInt(commandId) },
      data: {
        status,
        completed_at: new Date(),
      },
    });
  }

  /**
   * Fetch system setting by key
   */
  async getSystemSetting(key: string, tx?: TransactionClient): Promise<system_settings | null> {
    const client = tx || prisma;
    return client.system_settings.findUnique({
      where: { key },
    });
  }
}

export const biometricRepository = new BiometricRepository();

export interface RawPunchRecord {
  userId: string;
  timestamp: string | Date;
  punchType?: number;
  verifyType?: number;
  deviceSerial?: string;
}

export interface DeviceMetadata {
  id: string;
  branch_id: string | null;
  work_location_id: string | null;
  device_name: string;
  device_serial: string;
  alerted_offline?: boolean | null;
  branches?: { name: string } | null;
}

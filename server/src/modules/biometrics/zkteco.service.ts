import { BiometricRepository, biometricRepository } from './zkteco.repository.js';
import { UnitOfWork, unitOfWork } from '../../core/infrastructure/database/unit-of-work.js';

export interface RawPunchRecord {
  deviceSn: string;
  userPin: string;
  punchTime: Date;
  verifyType?: number;
  rawPayload?: string;
}

export class BiometricService {
  constructor(
    private biometricRepo: BiometricRepository = biometricRepository,
    private uow: UnitOfWork = unitOfWork
  ) {}

  async processPunchLog(punch: RawPunchRecord) {
    return this.uow.execute(async (tx) => {
      return this.biometricRepo.create({
        device_sn: punch.deviceSn,
        user_pin: punch.userPin,
        punch_time: punch.punchTime,
        verify_type: punch.verifyType ?? 1,
        raw_payload: punch.rawPayload,
      } as any, tx);
    });
  }
}

export const biometricService = new BiometricService();

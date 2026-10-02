import { biometric_raw_logs, Prisma } from '@prisma/client';
import { BaseRepository, TransactionClient } from '../../core/infrastructure/database/base.repository.js';

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

  async findRecentLogsByPin(userPin: string, since: Date, tx?: TransactionClient): Promise<biometric_raw_logs[]> {
    return this.findMany({
      user_pin: userPin,
      punch_time: { gte: since },
    } as any, { punch_time: 'desc' } as any, tx);
  }
}

export const biometricRepository = new BiometricRepository();

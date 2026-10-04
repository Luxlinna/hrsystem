import { prisma } from '../config/database.js';
import { TransactionClient } from './base.repository.js';

export interface IUnitOfWork {
  execute<R>(work: (tx: TransactionClient) => Promise<R>): Promise<R>;
}

export class UnitOfWork implements IUnitOfWork {
  async execute<R>(work: (tx: TransactionClient) => Promise<R>): Promise<R> {
    return prisma.$transaction(async (tx: TransactionClient) => {
      return await work(tx);
    }, {
      maxWait: 5000,
      timeout: 10000,
    });
  }
}

export const unitOfWork = new UnitOfWork();

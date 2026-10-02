import { Prisma } from '@prisma/client';
import { prisma } from './prisma.client.js';
import { PageRequest, PageResult } from '../../domain/pagination.js';
import { handlePrismaError } from '../../errors/prisma-error-mapper.js';

export type TransactionClient = Prisma.TransactionClient;

export interface IBaseRepository<T, CreateInput, UpdateInput, WhereInput, OrderByInput> {
  findById(id: string, tx?: TransactionClient): Promise<T | null>;
  findOne(where: WhereInput, tx?: TransactionClient): Promise<T | null>;
  findMany(where?: WhereInput, orderBy?: OrderByInput, tx?: TransactionClient): Promise<T[]>;
  findPaginated(
    pageReq: PageRequest,
    where?: WhereInput,
    orderBy?: OrderByInput,
    tx?: TransactionClient
  ): Promise<PageResult<T>>;
  create(data: CreateInput, tx?: TransactionClient): Promise<T>;
  update(id: string, data: UpdateInput, tx?: TransactionClient): Promise<T>;
  delete(id: string, tx?: TransactionClient): Promise<T>;
  count(where?: WhereInput, tx?: TransactionClient): Promise<number>;
}

export abstract class BaseRepository<
  T,
  CreateInput,
  UpdateInput,
  WhereInput,
  OrderByInput,
  Delegate extends {
    findUnique: (args: any) => Promise<T | null>;
    findFirst: (args: any) => Promise<T | null>;
    findMany: (args: any) => Promise<T[]>;
    create: (args: any) => Promise<T>;
    update: (args: any) => Promise<T>;
    delete: (args: any) => Promise<T>;
    count: (args: any) => Promise<number>;
  }
> implements IBaseRepository<T, CreateInput, UpdateInput, WhereInput, OrderByInput> {
  constructor(protected modelDelegateName: keyof Prisma.TransactionClient) {}

  protected getDelegate(tx?: TransactionClient): Delegate {
    const client = tx || prisma;
    return (client as any)[this.modelDelegateName] as Delegate;
  }

  async findById(id: string, tx?: TransactionClient): Promise<T | null> {
    try {
      return await this.getDelegate(tx).findUnique({ where: { id } as any });
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async findOne(where: WhereInput, tx?: TransactionClient): Promise<T | null> {
    try {
      return await this.getDelegate(tx).findFirst({ where } as any);
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async findMany(where?: WhereInput, orderBy?: OrderByInput, tx?: TransactionClient): Promise<T[]> {
    try {
      return await this.getDelegate(tx).findMany({ where, orderBy } as any);
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async findPaginated(
    pageReq: PageRequest,
    where?: WhereInput,
    orderBy?: OrderByInput,
    tx?: TransactionClient
  ): Promise<PageResult<T>> {
    try {
      const page = Math.max(1, Number(pageReq.page) || 1);
      const limit = Math.max(1, Math.min(100, Number(pageReq.limit) || 20));
      const skip = (page - 1) * limit;

      const delegate = this.getDelegate(tx);
      const [items, total] = await Promise.all([
        delegate.findMany({ where, orderBy, skip, take: limit } as any),
        delegate.count({ where } as any),
      ]);

      return {
        items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      };
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async create(data: CreateInput, tx?: TransactionClient): Promise<T> {
    try {
      return await this.getDelegate(tx).create({ data } as any);
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async update(id: string, data: UpdateInput, tx?: TransactionClient): Promise<T> {
    try {
      return await this.getDelegate(tx).update({ where: { id }, data } as any);
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async delete(id: string, tx?: TransactionClient): Promise<T> {
    try {
      return await this.getDelegate(tx).delete({ where: { id } as any });
    } catch (err) {
      handlePrismaError(err);
    }
  }

  async count(where?: WhereInput, tx?: TransactionClient): Promise<number> {
    try {
      return await this.getDelegate(tx).count({ where } as any);
    } catch (err) {
      handlePrismaError(err);
    }
  }
}

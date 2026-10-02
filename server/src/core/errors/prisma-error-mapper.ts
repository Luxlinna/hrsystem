import { Prisma } from '@prisma/client';
import { AppError } from './app.error.js';

export function handlePrismaError(error: unknown): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = (error.meta?.target as string[])?.join(', ') || 'field';
        throw new AppError(`A record with this ${target} already exists.`, 409);
      }
      case 'P2025':
        throw new AppError('The requested record was not found or has already been deleted.', 404);
      case 'P2003':
        throw new AppError('Foreign key constraint failed. Related record does not exist.', 400);
      default:
        throw new AppError(`Database error (${error.code}): ${error.message}`, 500);
    }
  }
  throw error;
}

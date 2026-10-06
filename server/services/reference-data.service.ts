import { prisma } from '../config/database.js';
import { cacheService } from './cache.service.js';

export class ReferenceDataService {
  /**
   * 1. Branches & Geofence Work Locations (TTL: 24 hours)
   */
  async getBranches() {
    return cacheService.getOrSet(
      'ref:branches',
      async () => {
        return prisma.branches.findMany({
          where: { deleted_at: null },
          orderBy: { name: 'asc' },
        });
      },
      86400
    );
  }

  async getWorkLocations(branchId?: string) {
    const key = branchId ? `ref:work_locations:${branchId}` : 'ref:work_locations:all';
    return cacheService.getOrSet(
      key,
      async () => {
        return prisma.work_locations.findMany({
          where: {
            deleted_at: null,
            ...(branchId ? { branch_id: branchId } : {}),
          },
          orderBy: { name: 'asc' },
        });
      },
      86400
    );
  }

  /**
   * 2. Departments & Divisions (TTL: 12 hours)
   */
  async getDepartments(branchId?: string) {
    const key = branchId ? `ref:departments:${branchId}` : 'ref:departments:all';
    return cacheService.getOrSet(
      key,
      async () => {
        return prisma.departments.findMany({
          where: {
            deleted_at: null,
            ...(branchId ? { branch_id: branchId } : {}),
          },
          orderBy: { name: 'asc' },
        });
      },
      43200
    );
  }

  async getDivisions(branchId?: string) {
    const key = branchId ? `ref:divisions:${branchId}` : 'ref:divisions:all';
    return cacheService.getOrSet(
      key,
      async () => {
        return prisma.divisions.findMany({
          where: {
            deleted_at: null,
            ...(branchId ? { branch_id: branchId } : {}),
          },
          orderBy: { name: 'asc' },
        });
      },
      43200
    );
  }

  /**
   * 3. Public Holidays & Leave Types (TTL: 24 hours)
   */
  async getLeaveTypes() {
    return cacheService.getOrSet(
      'ref:leave_types',
      async () => {
        return prisma.leave_types.findMany({
          where: { is_active: true },
          orderBy: { name: 'asc' },
        });
      },
      86400
    );
  }

  async getHolidays(year: number, branchId?: string) {
    const key = branchId ? `ref:holidays:${year}:${branchId}` : `ref:holidays:${year}:all`;
    return cacheService.getOrSet(
      key,
      async () => {
        return prisma.holidays.findMany({
          where: {
            year,
            deleted_at: null,
            ...(branchId ? { OR: [{ branch_id: branchId }, { branch_id: null }] } : {}),
          },
          orderBy: { date: 'asc' },
        });
      },
      86400
    );
  }

  /**
   * 4. Shift Definitions & Templates (TTL: 6 hours)
   */
  async getShifts(branchId?: string) {
    const key = branchId ? `ref:shifts:${branchId}` : 'ref:shifts:all';
    return cacheService.getOrSet(
      key,
      async () => {
        return prisma.shifts.findMany({
          where: {
            ...(branchId ? { branch_id: branchId } : {}),
          },
          orderBy: { name: 'asc' },
        });
      },
      21600
    );
  }

  /**
   * 5. Roles, Permissions & App Access Matrix (TTL: 30 minutes)
   */
  async getAppAccessRoles() {
    return cacheService.getOrSet(
      'ref:app_access_roles',
      async () => {
        return prisma.app_access.findMany({
          where: { is_active: true },
          include: {
            employees: {
              select: { id: true, first_name: true, last_name: true, email: true },
            },
          },
        });
      },
      1800
    );
  }

  /**
   * 6. System Settings & Configuration (TTL: 1 hour)
   */
  async getSystemSettings() {
    return cacheService.getOrSet(
      'ref:system_settings',
      async () => {
        return prisma.system_settings.findMany();
      },
      3600
    );
  }

  /**
   * Invalidate Master & Reference Caches
   */
  invalidateReferenceCache(category: 'branches' | 'departments' | 'divisions' | 'leaves' | 'shifts' | 'roles' | 'settings' | 'all') {
    if (category === 'all') {
      cacheService.invalidatePrefix('ref:');
    } else {
      cacheService.invalidatePrefix(`ref:${category}`);
    }
  }
}

export const referenceDataService = new ReferenceDataService();

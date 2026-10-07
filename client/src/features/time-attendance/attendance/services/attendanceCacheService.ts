import { supabase } from "@/lib/supabase";
import type { Employee, AttendanceRecord, WorkLocation, BiometricDevice } from "../types";
import { applyUserEmployeeFilter } from "@/lib/phoneUtils";
import { compareBiometricIds } from "@/lib/biometricUtils";

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes for reference data
const ATTENDANCE_TTL_MS = 60 * 1000; // 1 minute for attendance records SWR

class AttendanceCacheManager {
  private refCache = new Map<string, CacheEntry<any>>();
  private inflight = new Map<string, Promise<any>>();
  private attendanceCache = new Map<string, CacheEntry<{ records: AttendanceRecord[]; employees: Employee[] }>>();

  /**
   * Generic cached fetcher with promise deduplication
   */
  async getOrFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlMs: number = DEFAULT_TTL_MS,
    force: boolean = false
  ): Promise<T> {
    const cached = this.refCache.get(key);
    const isFresh = cached && Date.now() - cached.timestamp < ttlMs;

    if (!force && isFresh) {
      return cached.data;
    }

    if (this.inflight.has(key)) {
      return this.inflight.get(key) as Promise<T>;
    }

    const promise = fetcher()
      .then((data) => {
        this.refCache.set(key, { data, timestamp: Date.now() });
        this.inflight.delete(key);
        return data;
      })
      .catch((err) => {
        this.inflight.delete(key);
        if (cached) {
          return cached.data;
        }
        throw err;
      });

    this.inflight.set(key, promise);
    return promise;
  }

  // --- Reference Data Getters ---

  async getBranches(force = false): Promise<{ id: string; name: string }[]> {
    return this.getOrFetch(
      "ref_branches",
      async () => {
        const { data } = await supabase
          .from("branches")
          .select("id, name")
          .is("deleted_at", null)
          .order("name");
        return (data as { id: string; name: string }[]) || [];
      },
      DEFAULT_TTL_MS,
      force
    );
  }

  async getWorkLocations(force = false): Promise<WorkLocation[]> {
    return this.getOrFetch(
      "ref_work_locations",
      async () => {
        const { data } = await supabase
          .from("work_locations")
          .select("id, name, branch_id, is_default, status, is_four_punch_enabled")
          .is("deleted_at", null)
          .order("is_default", { ascending: false })
          .order("name");
        return (data as WorkLocation[]) || [];
      },
      DEFAULT_TTL_MS,
      force
    );
  }

  async getTableValues(table: string, fallback: string[] = [], force = false): Promise<string[]> {
    return this.getOrFetch(
      `ref_table_${table}`,
      async () => {
        try {
          const { data, error } = await supabase
            .from(table)
            .select("name")
            .is("deleted_at", null)
            .order("sort_order", { ascending: true })
            .order("name", { ascending: true });
          if (!error && data) {
            const vals = Array.from(new Set(data.map((d: any) => d.name).filter(Boolean)));
            return vals.length > 0 ? vals : fallback;
          }
          return fallback;
        } catch {
          return fallback;
        }
      },
      DEFAULT_TTL_MS,
      force
    );
  }

  async getBiometricDevices(branchId: string, force = false): Promise<BiometricDevice[]> {
    if (!branchId) return [];
    return this.getOrFetch(
      `ref_bio_devices_${branchId}`,
      async () => {
        const { data } = await supabase
          .from("biometric_devices")
          .select("id, branch_id, work_location_id, device_name, device_serial, status")
          .eq("branch_id", branchId);
        return (data as BiometricDevice[]) || [];
      },
      DEFAULT_TTL_MS,
      force
    );
  }

  async getMyEmployee(email: string, force = false): Promise<Employee | null> {
    if (!email) return null;
    return this.getOrFetch(
      `my_employee_${email.toLowerCase()}`,
      async () => {
        const meQuery = applyUserEmployeeFilter(
          supabase
            .from("employees")
            .select(
              "id, first_name, last_name, department, division, role, avatar_url, branch_id, branches(id, name), default_work_location_id, employee_code, biometric_user_id, basic_salary, contract_rate, contract_rate_currency, contract_rate_frequency, tax_method, contract_type, employment_type, site"
            ),
          email
        );
        const { data: rows } = await meQuery.is("deleted_at", null).limit(5);
        if (rows && rows.length > 0) {
          return (
            rows.find((r: any) => (email ? r.email?.toLowerCase() === email.toLowerCase() : false)) || rows[0]
          ) as unknown as Employee;
        }
        return null;
      },
      DEFAULT_TTL_MS,
      force
    );
  }

  // --- Attendance Records Cache ---

  getCachedAttendance(key: string): { records: AttendanceRecord[]; employees: Employee[] } | null {
    const entry = this.attendanceCache.get(key);
    return entry ? entry.data : null;
  }

  setCachedAttendance(key: string, data: { records: AttendanceRecord[]; employees: Employee[] }): void {
    this.attendanceCache.set(key, { data, timestamp: Date.now() });
  }

  isAttendanceFresh(key: string): boolean {
    const entry = this.attendanceCache.get(key);
    return !!(entry && Date.now() - entry.timestamp < ATTENDANCE_TTL_MS);
  }

  invalidateAttendance(branchId?: string): void {
    if (!branchId) {
      this.attendanceCache.clear();
      return;
    }
    for (const key of this.attendanceCache.keys()) {
      if (key.includes(branchId)) {
        this.attendanceCache.delete(key);
      }
    }
  }

  invalidateAll(): void {
    this.refCache.clear();
    this.inflight.clear();
    this.attendanceCache.clear();
  }
}

export const attendanceCache = new AttendanceCacheManager();

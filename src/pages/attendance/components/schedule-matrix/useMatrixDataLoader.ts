import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { compareBiometricIds } from "@/lib/biometricUtils";

export function useMatrixDataLoader(targetBranch: string | null, currentDate: Date) {
  const [loading, setLoading] = useState(true);
  const [rawEmployees, setRawEmployees] = useState<any[]>([]);
  const [templateAssignments, setTemplateAssignments] = useState<Record<string, any>>({});
  const [templatesById, setTemplatesById] = useState<Record<string, any>>({});
  const [rawTemplates, setRawTemplates] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, any>>({});
  const [rawShifts, setRawShifts] = useState<any[]>([]);
  const [shiftAssignments, setShiftAssignments] = useState<any[]>([]);

  const loadMatrixData = useCallback(async () => {
    setLoading(true);
    try {
      let empQuery = supabase
        .from("employees")
        .select("id, first_name, last_name, employee_code, biometric_user_id, role, department, avatar_url, branch_id, branches(id, name)")
        .is("deleted_at", null)
        .order("first_name");

      if (targetBranch) {
        empQuery = empQuery.eq("branch_id", targetBranch);
      }

      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDateStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
      const endDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${new Date(year, month + 1, 0).getDate()}`;

      const attQuery = supabase
        .from("attendance_records")
        .select("id, employee_id, date, clock_in, clock_out, status, hours_worked")
        .gte("date", startDateStr)
        .lte("date", endDateStr);

      const shiftQuery = supabase
        .from("shifts")
        .select("id, name, code, start_time, end_time, color, department, branch_id, notes, is_overnight, shift_date")
        .is("deleted_at", null)
        .order("name");

      const sysSettingsQuery = supabase
        .from("system_settings")
        .select("value")
        .eq("key", "schedule_templates")
        .maybeSingle();

      const [empRes, attRes, sysRes, tmplRes, assignRes, shiftRes, shiftAssignRes] = await Promise.all([
        empQuery,
        attQuery,
        sysSettingsQuery,
        supabase.from("schedule_templates").select("*").is("deleted_at", null),
        supabase.from("schedule_template_assignments").select("*"),
        shiftQuery,
        supabase.from("shift_assignments").select("id, shift_id, employee_id, status"),
      ]);

      const empList = ((empRes.data || []) as any[]).slice().sort((a, b) =>
        compareBiometricIds(a.biometric_user_id, b.biometric_user_id)
      );
      setRawEmployees(empList);
      setRawShifts(shiftRes.data || []);
      setShiftAssignments(shiftAssignRes.data || []);

      const allTemplates: any[] = [];
      if (sysRes.data?.value) {
        try {
          const parsed = typeof sysRes.data.value === "string" ? JSON.parse(sysRes.data.value) : sysRes.data.value;
          if (Array.isArray(parsed)) allTemplates.push(...parsed);
        } catch {}
      }

      try {
        const local = localStorage.getItem("hrm_ops_schedule_templates_v1");
        if (local) {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            parsed.forEach((lt) => {
              if (!allTemplates.some((t) => t.id === lt.id)) allTemplates.push(lt);
            });
          }
        }
      } catch {}

      (tmplRes.data || []).forEach((t: any) => {
        if (!allTemplates.some((existing) => existing.id === t.id)) {
          allTemplates.push(t);
        }
      });
      setRawTemplates(allTemplates);

      const tmplMap: Record<string, any> = {};
      const assignMap: Record<string, any> = {};
      allTemplates.forEach((t: any) => {
        tmplMap[t.id] = t;
        if (Array.isArray(t.assigned_employee_ids)) {
          t.assigned_employee_ids.forEach((empId: string) => {
            assignMap[empId] = t.id;
          });
        }
      });

      (assignRes.data || []).forEach((a: any) => {
        assignMap[a.employee_id] = a.template_id;
      });

      setTemplatesById(tmplMap);
      setTemplateAssignments(assignMap);

      const attMap: Record<string, any> = {};
      (attRes.data || []).forEach((r: any) => {
        attMap[`${r.employee_id}_${r.date}`] = r;
      });
      setAttendanceRecords(attMap);
    } catch (err) {
      console.error("Failed to load matrix data:", err);
    } finally {
      setLoading(false);
    }
  }, [targetBranch, currentDate]);

  useEffect(() => {
    loadMatrixData();
  }, [loadMatrixData]);

  return {
    loading,
    rawEmployees,
    rawShifts,
    rawTemplates,
    shiftAssignments,
    templateAssignments,
    templatesById,
    attendanceRecords,
    loadMatrixData,
  };
}

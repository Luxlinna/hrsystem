import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";

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
        .select("id, first_name, last_name, employee_code, role, department, avatar_url, branch_id")
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
        .select("id, employee_id, date, clock_in, clock_out, status")
        .gte("date", startDateStr)
        .lte("date", endDateStr);

      const shiftQuery = supabase
        .from("shifts")
        .select("id, name, code, start_time, end_time, color, department, branch_id, notes, is_overnight, shift_date")
        .is("deleted_at", null)
        .order("name");

      const assignShiftQuery = supabase
        .from("shift_assignments")
        .select("id, shift_id, employee_id, status");

      const [empRes, attRes, tmplRes, assignRes, shiftRes, shiftAssignRes] = await Promise.all([
        empQuery,
        attQuery,
        supabase.from("schedule_templates").select("*").is("deleted_at", null),
        supabase.from("schedule_template_assignments").select("*"),
        shiftQuery,
        assignShiftQuery,
      ]);

      setRawEmployees(empRes.data || []);
      setRawTemplates(tmplRes.data || []);
      setRawShifts(shiftRes.data || []);
      setShiftAssignments(shiftAssignRes.data || []);

      const tmplMap: Record<string, any> = {};
      (tmplRes.data || []).forEach((t: any) => {
        tmplMap[t.id] = t;
      });
      setTemplatesById(tmplMap);

      const assignMap: Record<string, any> = {};
      (assignRes.data || []).forEach((a: any) => {
        assignMap[a.employee_id] = a.template_id;
      });
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

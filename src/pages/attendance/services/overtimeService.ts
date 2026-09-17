import { supabase } from "@/lib/supabase";
import { uploadFile } from "@/lib/storage";
import { logActivity } from "@/lib/audit";
import type { OvertimeRecord, NewOvertimeForm, OvertimeStatus } from "../types/overtimeTypes";

export function calcOvertimeHours(
  fromDate: string,
  toDate: string,
  timeIn: string,
  timeOut: string,
  breakMinutes: number = 0
): number {
  if (!timeIn || !timeOut) return 0;
  const [inH, inM] = timeIn.slice(0, 5).split(":").map(Number);
  const [outH, outM] = timeOut.slice(0, 5).split(":").map(Number);
  if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) return 0;

  let dailyMinutes = outH * 60 + outM - (inH * 60 + inM) - (breakMinutes || 0);
  if (dailyMinutes < 0) dailyMinutes += 24 * 60; // Cross midnight

  // Calculate day difference (inclusive)
  const d1 = new Date(fromDate);
  const d2 = new Date(toDate);
  const diffTime = Math.max(0, d2.getTime() - d1.getTime());
  const days = Math.max(1, Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1);

  const totalMin = Math.max(0, dailyMinutes * (days || 1));
  return parseFloat((totalMin / 60).toFixed(2));
}

export async function fetchOvertimeRecords(
  targetBranch?: string | null,
  employeeId?: string | null
): Promise<OvertimeRecord[]> {
  let query = supabase
    .from("overtime_records")
    .select(`
      *,
      employees:employees!overtime_records_employee_id_fkey(id, first_name, last_name, department, role, avatar_url, branch_id, branches(id, name))
    `)
    .is("deleted_at", null)
    .order("from_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  } else if (targetBranch) {
    query = query.eq("branch_id", targetBranch);
  }

  const { data, error } = await query.limit(500);
  if (error) {
    console.error("Error fetching overtime records:", error);
    return [];
  }
  return (data as unknown as OvertimeRecord[]) || [];
}

export async function createOvertimeRecord(params: {
  form: NewOvertimeForm;
  branchId?: string | null;
  file?: File | null;
}): Promise<{ ok: boolean; error?: string }> {
  const { form, branchId, file } = params;
  try {
    let attachmentUrl = form.attachment_url || null;
    let attachmentName = form.attachment_name || null;

    if (file) {
      attachmentName = file.name;
      try {
        attachmentUrl = await uploadFile("overtime-attachments", file.name, file);
      } catch (upErr: any) {
        console.warn("Upload fallback warning:", upErr);
      }
    }

    const overtimeHours = calcOvertimeHours(
      form.from_date,
      form.to_date,
      form.time_in,
      form.time_out,
      form.break_minutes
    );

    const { error } = await supabase.from("overtime_records").insert({
      employee_id: form.employee_id,
      branch_id: branchId || null,
      overtime_type: form.overtime_type,
      from_date: form.from_date,
      to_date: form.to_date,
      time_in: form.time_in,
      time_out: form.time_out,
      break_minutes: form.break_minutes || 0,
      overtime_hours: overtimeHours,
      reason: form.reason.trim(),
      remark: form.remark.trim() || null,
      attachment_url: attachmentUrl,
      attachment_name: attachmentName,
      status: "pending",
    });

    if (error) throw error;

    logActivity({
      module: "attendance",
      action: "created",
      details: `Created overtime request for ${overtimeHours} hours (${form.overtime_type})`,
    });

    return { ok: true };
  } catch (err: any) {
    console.error("Failed to create overtime record:", err);
    return { ok: false, error: err.message || "Failed to create overtime" };
  }
}

export async function updateOvertimeStatus(
  id: string,
  status: OvertimeStatus,
  approverEmployeeId?: string | null,
  rejectionReason?: string | null
): Promise<boolean> {
  const updates: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "approved") {
    updates.approved_by = approverEmployeeId || null;
    updates.approved_at = new Date().toISOString();
    updates.rejection_reason = null;
  } else if (status === "rejected") {
    updates.rejection_reason = rejectionReason || null;
  }

  const { error } = await supabase.from("overtime_records").update(updates).eq("id", id);
  if (error) {
    console.error("Error updating overtime status:", error);
    return false;
  }

  logActivity({
    module: "attendance",
    action: "updated",
    details: `Updated overtime request #${id} to ${status}`,
  });
  return true;
}

export async function deleteOvertimeRecord(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("overtime_records")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) {
    console.error("Error deleting overtime record:", error);
    return false;
  }
  return true;
}

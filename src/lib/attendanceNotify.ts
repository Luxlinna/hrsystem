import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";

interface AttendanceNotifyInput {
  employeeName: string;
  employeeId: string;
  type: "in" | "out";
  isException: boolean;
  exceptionMinutes?: number;
}

// Who receives these (per-role opt-in) and how often they fire (every clock
// event vs. only late/early exceptions) are both admin-configurable — see
// migration 20260821000000_attendance_checkin_notifications.sql, the
// "Receives attendance check-in / check-out notifications" role toggle in
// Admin Portal, and the scope select in Settings -> Notifications.
export async function notifyAttendanceEvent(input: AttendanceNotifyInput) {
  const { data: scopeRow } = await supabase
    .from("system_settings")
    .select("value")
    .eq("key", "attendance_notify_scope")
    .maybeSingle();
  const scope = scopeRow?.value === "all" ? "all" : "exceptions";
  if (scope === "exceptions" && !input.isException) return;

  const { data: roles } = await supabase.from("app_roles").select("id").eq("attendance_notify", true);
  const roleIds = (roles || []).map((r: any) => r.id);
  if (roleIds.length === 0) return;

  const { data: assignments } = await supabase
    .from("user_role_assignments")
    .select("user_id")
    .in("role_id", roleIds);
  const userIds = Array.from(new Set((assignments || []).map((a: any) => a.user_id).filter(Boolean)));
  if (userIds.length === 0) return;

  const action = input.type === "in" ? "checked in" : "checked out";
  const exceptionNote =
    input.isException && input.exceptionMinutes
      ? input.type === "in"
        ? ` (${input.exceptionMinutes} min late)`
        : ` (${input.exceptionMinutes} min early)`
      : "";

  await Promise.all(
    userIds.map((uid) =>
      notify({
        source: "attendance",
        type: input.isException ? "warning" : "info",
        title: input.type === "in" ? "Employee checked in" : "Employee checked out",
        message: `${input.employeeName} ${action}${exceptionNote}.`,
        entityId: input.employeeId,
        recipientUserId: uid,
      })
    )
  );
}

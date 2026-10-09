import { supabase } from "@/lib/supabase";
import { applyUserEmployeeFilter } from "@/lib/phoneUtils";
import { uploadFileToS3 } from "@/lib/s3-storage";
import type { FullEmployee } from "./CellLeaveEmployeeCard";
import { notifyMissionInvitation } from "@/features/operations/tasks/services/missionNotificationService";

interface MissionSubmitParams {
  userEmail?: string | null;
  selectedEmpId: string;
  primaryEmployee?: FullEmployee | null;
  selectedOthers: FullEmployee[];
  missionType: string;
  missionFor: string;
  subject: string;
  detail: string;
  remark: string;
  fromDate: string;
  toDate: string;
  totalDays?: number;
  attachmentFile: File | null;
}

export async function submitMissionTask(params: MissionSubmitParams) {
  const {
    userEmail,
    selectedEmpId,
    primaryEmployee,
    selectedOthers,
    missionType,
    missionFor,
    subject,
    detail,
    remark,
    fromDate,
    toDate,
    totalDays,
    attachmentFile,
  } = params;

  let uploadedUrl: string | null = null;
  if (attachmentFile) {
    try {
      const s3Item = await uploadFileToS3(attachmentFile, "missions/attachments");
      uploadedUrl = s3Item.url;
    } catch (uploadErr) {
      console.warn("Failed to upload mission attachment to AWS S3:", uploadErr);
    }
  }

  let creatorId = selectedEmpId;
  if (userEmail) {
    const meQuery = applyUserEmployeeFilter(supabase.from("employees").select("id").limit(1), userEmail);
    const { data: meRows } = await meQuery;
    if (meRows && meRows.length > 0) creatorId = meRows[0].id;
  }

  const assigneeIds = Array.from(new Set([selectedEmpId, ...selectedOthers.map((o) => o.id)]));

  let taskDesc = detail.trim();
  if (missionType) taskDesc = `Type: ${missionType} (${missionFor.toUpperCase()})\n\n${taskDesc}`;
  if (remark.trim()) taskDesc += `\n\nRemark: ${remark.trim()}`;
  if (selectedOthers.length > 0) {
    taskDesc += `\n\nTeam: ${selectedOthers.map((o) => `${o.last_name} ${o.first_name}`).join(", ")}`;
  }
  if (uploadedUrl) taskDesc += `\n\nAttachment: ${uploadedUrl}`;
  else if (attachmentFile) taskDesc += `\n\nAttachment: ${attachmentFile.name}`;

  const taskRows = assigneeIds.map((empId) => ({
    title: subject.trim(),
    description: taskDesc,
    assigned_to: empId,
    assigned_by: creatorId,
    status: "todo" as const,
    priority: "high" as const,
    due_date: toDate || fromDate || null,
    is_outside_work: true,
    work_status: null,
  }));

  const { data: insertedTasks, error: taskError } = await supabase.from("tasks").insert(taskRows).select("id");
  if (taskError) throw taskError;

  if (insertedTasks && insertedTasks.length > 0) {
    for (const t of insertedTasks) {
      await supabase.from("task_activities").insert({
        task_id: t.id,
        actor_id: creatorId,
        action: "created",
        field: "task",
        new_value: `Mission: ${subject.trim()}`,
      });
    }
  }

  // Send notifications: Telegram group + in-app system notifications for employees with accounts
  const leadEmp =
    primaryEmployee ||
    ({
      id: selectedEmpId,
      first_name: "Staff",
      last_name: "Member",
    } as FullEmployee);

  notifyMissionInvitation({
    missionTitle: subject.trim(),
    missionType,
    missionFor,
    priority: "high",
    fromDate,
    toDate,
    totalDays,
    detail,
    remark,
    primaryEmployee: {
      id: leadEmp.id,
      first_name: leadEmp.first_name,
      last_name: leadEmp.last_name,
      role: leadEmp.role,
      department: leadEmp.department,
      email: (leadEmp as any).email,
      phone: (leadEmp as any).phone,
    },
    teamMembers: selectedOthers.map((o) => ({
      id: o.id,
      first_name: o.first_name,
      last_name: o.last_name,
      role: o.role,
      department: o.department,
      email: (o as any).email,
      phone: (o as any).phone,
    })),
    taskId: insertedTasks?.[0]?.id || null,
  }).catch((err) => console.warn("Failed to send mission invitation notifications:", err));
}

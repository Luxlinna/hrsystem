import { useState, useEffect } from "react";
import type { Task, FormState, Employee } from "../../types";
import type { LocationData } from "./TaskOutsideWorkMissionForm";
import { uploadFileToS3 } from "@/lib/s3-storage";
import { notifyMissionInvitation } from "@/features/operations/tasks/services/missionNotificationService";

interface UseOutsideWorkMissionFormProps {
  editingTask: Task | null;
  employees: Employee[];
  currentEmployeeId?: string | null;
  onSave: (
    form: FormState & {
      work_address?: string | null;
      work_lat?: number | null;
      work_lng?: number | null;
      work_accuracy_m?: number | null;
    },
    editId?: string
  ) => void;
}

export function useOutsideWorkMissionForm({
  editingTask,
  employees,
  currentEmployeeId,
  onSave,
}: UseOutsideWorkMissionFormProps) {
  const [primaryEmpId, setPrimaryEmpId] = useState<string>("");
  const [missionType, setMissionType] = useState<string>("Official Mission");
  const [missionFor, setMissionFor] = useState<"daily" | "hourly" | "half_day">("daily");
  const [subject, setSubject] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [totalDays, setTotalDays] = useState<number>(1);
  const [missionPriority, setMissionPriority] = useState<Task["priority"]>("high");
  const [detail, setDetail] = useState<string>("");
  const [remark, setRemark] = useState<string>("");
  const [otherTeamMembers, setOtherTeamMembers] = useState<Employee[]>([]);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [owLocation, setOwLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    if (editingTask) {
      setPrimaryEmpId(editingTask.assigned_to || currentEmployeeId || "");
      setSubject(editingTask.title);
      setDetail(editingTask.description || "");
      setMissionPriority(editingTask.priority || "high");
      if (editingTask.due_date) {
        setFromDate(editingTask.due_date);
        setToDate(editingTask.due_date);
      }
      if (editingTask.work_address) {
        setOwLocation({
          lat: Number(editingTask.work_lat) || 0,
          lng: Number(editingTask.work_lng) || 0,
          accuracy: editingTask.work_accuracy_m || undefined,
          address: editingTask.work_address,
        });
      } else {
        setOwLocation(null);
      }
    } else {
      const defaultId = currentEmployeeId || employees[0]?.id || "";
      setPrimaryEmpId(defaultId);
      setSubject("");
      setDetail("");
      setRemark("");
      setMissionType("Official Mission");
      setMissionFor("daily");
      const today = new Date().toISOString().split("T")[0];
      setFromDate(today);
      setToDate(today);
      setTotalDays(1);
      setMissionPriority("high");
      setOtherTeamMembers([]);
      setAttachmentFile(null);
      setOwLocation(null);
    }
  }, [editingTask, currentEmployeeId, employees]);

  const handleOutsideWorkSubmit = async (e: React.FormEvent, status: Task["status"] = "todo") => {
    e.preventDefault();
    if (!subject.trim() || !primaryEmpId) return;

    setUploading(true);
    let uploadedUrl: string | null = null;
    if (attachmentFile) {
      try {
        const s3Item = await uploadFileToS3(attachmentFile, "missions/attachments");
        uploadedUrl = s3Item.url;
      } catch (err) {
        console.warn("Could not upload mission attachment:", err);
      }
    }
    setUploading(false);

    let taskDesc = detail.trim();
    if (missionType) taskDesc = `Type: ${missionType} (${missionFor.toUpperCase()})\n\n${taskDesc}`;
    if (remark.trim()) taskDesc += `\n\nRemark: ${remark.trim()}`;
    if (otherTeamMembers.length > 0) {
      taskDesc += `\n\nTeam: ${otherTeamMembers.map((e) => `${e.last_name} ${e.first_name}`).join(", ")}`;
    }
    if (uploadedUrl) taskDesc += `\n\nAttachment: ${uploadedUrl}`;
    else if (attachmentFile) taskDesc += `\n\nAttachment: ${attachmentFile.name}`;

    const basePayload = {
      title: subject.trim(),
      description: taskDesc,
      status,
      priority: missionPriority,
      due_date: toDate || fromDate || null,
      is_outside_work: true,
      work_address: owLocation?.address || null,
      work_lat: owLocation?.lat || null,
      work_lng: owLocation?.lng || null,
      work_accuracy_m: owLocation?.accuracy || null,
    };

    if (editingTask) {
      onSave({ ...basePayload, assigned_to: primaryEmpId }, editingTask.id);
    } else {
      const allIds = Array.from(new Set([primaryEmpId, ...otherTeamMembers.map((m) => m.id)]));
      allIds.forEach((empId) => onSave({ ...basePayload, assigned_to: empId }));

      const primaryEmployee = employees.find((e) => e.id === primaryEmpId);
      if (primaryEmployee) {
        notifyMissionInvitation({
          missionTitle: subject.trim(),
          missionType,
          missionFor,
          priority: missionPriority,
          fromDate,
          toDate,
          totalDays,
          location: owLocation?.address || null,
          detail,
          remark,
          primaryEmployee: {
            id: primaryEmployee.id,
            first_name: primaryEmployee.first_name,
            last_name: primaryEmployee.last_name,
            role: primaryEmployee.role,
            department: primaryEmployee.department,
            email: primaryEmployee.email,
            phone: (primaryEmployee as any).phone || "",
          },
          teamMembers: otherTeamMembers.map((m) => ({
            id: m.id,
            first_name: m.first_name,
            last_name: m.last_name,
            role: m.role,
            department: m.department,
            email: m.email,
            phone: (m as any).phone || "",
          })),
        }).catch((err) => console.warn("Failed to notify mission invitees:", err));
      }
    }
  };

  return {
    primaryEmpId,
    setPrimaryEmpId,
    missionType,
    setMissionType,
    missionFor,
    setMissionFor,
    subject,
    setSubject,
    fromDate,
    setFromDate,
    toDate,
    setToDate,
    totalDays,
    setTotalDays,
    missionPriority,
    setMissionPriority,
    detail,
    setDetail,
    remark,
    setRemark,
    otherTeamMembers,
    setOtherTeamMembers,
    attachmentFile,
    setAttachmentFile,
    uploading,
    owLocation,
    setOwLocation,
    handleOutsideWorkSubmit,
  };
}

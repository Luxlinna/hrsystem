import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { uploadMediaToS3, type MediaItem } from "@/lib/s3-storage";
import type { Task } from "../types";
import type { PendingFile } from "../components/modals/check-in/MediaUploadDropzone";
import { syncCheckInAttendance, syncCheckOutAttendance } from "./taskAttendanceSync";

interface UseTaskCheckInOutMutationProps {
  taskId: string;
  employeeId: string;
  mode: "check_in" | "check_out";
  task?: Task;
  onDone: () => void;
  onClose: () => void;
  showToast: (type: string, message: string) => void;
}

export function useTaskCheckInOutMutation({
  taskId,
  employeeId,
  mode,
  task,
  onDone,
  onClose,
  showToast,
}: UseTaskCheckInOutMutationProps) {
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);

  const isCheckIn = mode === "check_in";

  const submitCheckInOut = useCallback(
    async (location: any, files: PendingFile[]) => {
      setSaving(true);
      try {
        const mediaItems: MediaItem[] = [];
        const folder = `outside-work/${taskId}/${isCheckIn ? "in" : "out"}`;

        for (let i = 0; i < files.length; i++) {
          setUploadProgress(`Uploading ${i + 1} of ${files.length}…`);
          const item = await uploadMediaToS3(files[i].file, folder);
          mediaItems.push(item);
        }

        setUploadProgress(null);

        const data: Record<string, any> = {};
        if (isCheckIn) {
          if (location) {
            data.work_lat = location.lat;
            data.work_lng = location.lng;
            data.work_accuracy_m = location.accuracy;
            data.work_address = location.address;
          }
          if (mediaItems.length > 0) {
            data.work_image_url = mediaItems[0].url;
            data.work_media_urls = mediaItems;
          }
          data.work_status = "checked_in";
          data.work_checked_in_at = new Date().toISOString();
        } else {
          if (location) {
            data.work_check_out_lat = location.lat;
            data.work_check_out_lng = location.lng;
            data.work_check_out_accuracy_m = location.accuracy;
            data.work_check_out_address = location.address;
          }
          if (mediaItems.length > 0) {
            data.work_check_out_image_url = mediaItems[0].url;
            data.work_check_out_media_urls = mediaItems;
          }
          data.work_status = "checked_out";
          data.work_checked_out_at = new Date().toISOString();
        }

        const { error: dbError } = await supabase.from("tasks").update(data).eq("id", taskId);
        if (dbError) throw dbError;

        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

        if (isCheckIn) {
          await syncCheckInAttendance(employeeId, timeStr, now, location, task?.work_address);
        } else {
          await syncCheckOutAttendance(employeeId, timeStr, now);
        }

        showToast("success", isCheckIn ? "Checked in — have a productive day!" : "Checked out — great work!");
        onDone();
        onClose();
      } catch {
        showToast("error", isCheckIn ? "Couldn't check in. Please try again." : "Couldn't check out. Please try again.");
      } finally {
        setSaving(false);
        setUploadProgress(null);
      }
    },
    [taskId, employeeId, isCheckIn, task, showToast, onDone, onClose]
  );

  return {
    saving,
    uploadProgress,
    isCheckIn,
    submitCheckInOut,
  };
}

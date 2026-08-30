import { memo } from "react";
import { LocationCaptureCard } from "./components/modals/check-in/LocationCaptureCard";
import { MediaUploadDropzone } from "./components/modals/check-in/MediaUploadDropzone";
import type { Task } from "./types";
import { useCheckInOutLocationAndMedia } from "./hooks/useCheckInOutLocationAndMedia";
import { useTaskCheckInOutMutation } from "./hooks/useTaskCheckInOutMutation";

interface Props {
  taskId: string;
  employeeId: string;
  mode: "check_in" | "check_out";
  onDone: () => void;
  onClose: () => void;
  showToast: (type: string, message: string) => void;
  task?: Task;
}

export default memo(function CheckInOutModal({
  taskId,
  employeeId,
  mode,
  onDone,
  onClose,
  showToast,
  task,
}: Props) {
  const {
    location,
    files,
    locating,
    error,
    handleCaptureLocation,
    handlePickFiles,
    removeFile,
  } = useCheckInOutLocationAndMedia(showToast);

  const { saving, uploadProgress, isCheckIn, submitCheckInOut } = useTaskCheckInOutMutation({
    taskId,
    employeeId,
    mode,
    task,
    onDone,
    onClose,
    showToast,
  });

  const hasPredefinedLocation = !!task?.work_address || (task?.work_lat != null && task?.work_lng != null);
  const canSubmit = isCheckIn ? (hasPredefinedLocation || !!location) && !saving : files.length > 0 && !saving;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs"
      onClick={() => !saving && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-xl text-white ${
                isCheckIn ? "bg-emerald-600" : "bg-indigo-600"
              }`}
            >
              <i className={isCheckIn ? "ri-login-box-line" : "ri-logout-box-line"} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {isCheckIn ? "Check In to Outside Work" : "Check Out of Outside Work"}
              </h3>
              <p className="text-[11px] text-slate-500">Record GPS location &amp; photo evidence</p>
            </div>
          </div>
          <button
            onClick={() => !saving && onClose()}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs flex items-center gap-2">
            <i className="ri-error-warning-line shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <LocationCaptureCard
          location={location}
          locating={locating}
          onCaptureLocation={handleCaptureLocation}
          isCheckIn={isCheckIn}
          isOptional={hasPredefinedLocation}
        />

        <MediaUploadDropzone
          files={files}
          onPickFiles={handlePickFiles}
          onRemoveFile={removeFile}
          isCheckIn={isCheckIn}
          disabled={saving}
        />

        {uploadProgress && (
          <p className="text-xs text-indigo-600 font-semibold animate-pulse">{uploadProgress}</p>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => submitCheckInOut(location, files)}
            disabled={!canSubmit}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#253C7D] hover:bg-[#1F336A] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5"
          >
            {saving && <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />}
            {isCheckIn ? "Confirm Check In" : "Confirm Check Out"}
          </button>
        </div>
      </div>
    </div>
  );
});

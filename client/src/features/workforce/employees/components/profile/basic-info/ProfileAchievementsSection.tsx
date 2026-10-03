import { memo, useState } from "react";
import type { BasicInfoSectionProps } from "./types";
import type { EmployeeAchievementItem } from "../../../types";
import { uploadFileToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";
import { ProfileAchievementViewCard } from "./ProfileAchievementViewCard";
import { ProfileAchievementEditCard } from "./ProfileAchievementEditCard";

export const ProfileAchievementsSection = memo(function ProfileAchievementsSection({
  employee,
  form,
  setForm,
  editing,
}: BasicInfoSectionProps) {
  const [uploadingAchIdx, setUploadingAchIdx] = useState<number | null>(null);

  const achievements: EmployeeAchievementItem[] =
    (editing ? form.achievement_history : employee.achievement_history) as EmployeeAchievementItem[] ||
    (employee.achievement_history as EmployeeAchievementItem[]) ||
    [];

  const handleAddAchievement = () => {
    const current = [...achievements];
    const updated = [
      ...current,
      {
        title: "",
        year_awarded: new Date().getFullYear().toString(),
        country: "Cambodia",
        program_name: "",
        organizer_name: "",
        remark: "",
        attachment: "",
      },
    ];
    setForm((prev) => ({ ...prev, achievement_history: updated }));
  };

  const handleUpdateAchievement = (
    idx: number,
    field: keyof EmployeeAchievementItem,
    val: string
  ) => {
    const updated = [...achievements];
    updated[idx] = { ...updated[idx], [field]: val };
    setForm((prev) => ({ ...prev, achievement_history: updated }));
  };

  const handleRemoveAchievement = (idx: number) => {
    const updated = achievements.filter((_, i) => i !== idx);
    setForm((prev) => ({ ...prev, achievement_history: updated }));
  };

  const handleUploadDoc = async (file: File, idx: number) => {
    setUploadingAchIdx(idx);
    try {
      const s3Item = await uploadFileToS3(
        file,
        `employees/${employee.id || "general"}/achievements`
      );
      const updated = [...achievements];
      updated[idx] = { ...updated[idx], attachment: s3Item.url };
      setForm((prev) => ({ ...prev, achievement_history: updated }));
      toast("Stored on AWS S3", `Saved ${file.name} to AWS S3.`, "success");
    } catch (err) {
      console.error("Achievement upload error:", err);
      toast("Upload Failed", "Could not upload document to AWS S3", "error");
    } finally {
      setUploadingAchIdx(null);
    }
  };

  if (achievements.length === 0 && !editing) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-xs font-black text-gray-900 uppercase tracking-wide flex items-center gap-2">
          <i className="ri-award-line text-amber-500" />
          <span>Honors, Awards &amp; Recognized Achievements</span>
        </h3>
        <div className="flex items-center gap-2">
          {editing ? (
            <button
              type="button"
              onClick={handleAddAchievement}
              className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <i className="ri-add-line text-sm" />
              <span>+ Add Honor / Achievement</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">
              {achievements.length} recorded honor{achievements.length > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      {achievements.length === 0 ? (
        <div className="py-8 text-center bg-amber-50/30 rounded-xl border border-dashed border-amber-200 p-6">
          <i className="ri-award-line text-amber-400 text-3xl mb-2 block" />
          <p className="text-xs text-slate-600 font-semibold mb-1">
            No honors or achievements recorded yet.
          </p>
          <p className="text-[11px] text-slate-400 mb-4">
            Record certificates, awards, performance recognition, and official honors.
          </p>
          {editing && (
            <button
              type="button"
              onClick={handleAddAchievement}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <i className="ri-add-line text-base" />
              <span>+ Add First Honor / Achievement</span>
            </button>
          )}
        </div>
      ) : editing ? (
        <div className="space-y-4">
          {achievements.map((ach, idx) => (
            <ProfileAchievementEditCard
              key={idx}
              ach={ach}
              idx={idx}
              uploading={uploadingAchIdx === idx}
              onUpdate={handleUpdateAchievement}
              onRemove={handleRemoveAchievement}
              onUploadFile={handleUploadDoc}
            />
          ))}

          <button
            type="button"
            onClick={handleAddAchievement}
            className="w-full py-2.5 rounded-xl border border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/50 hover:bg-amber-50 text-amber-900 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            <i className="ri-add-circle-line text-base" />
            <span>Add Another Honor or Recognized Achievement</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {achievements.map((ach, idx) => (
            <ProfileAchievementViewCard key={idx} ach={ach} />
          ))}
        </div>
      )}
    </div>
  );
});

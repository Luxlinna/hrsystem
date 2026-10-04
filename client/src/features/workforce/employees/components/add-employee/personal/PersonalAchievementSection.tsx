import { memo, useState } from "react";
import { uploadFileToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";
import type { PersonalSectionProps } from "./types";
import type { EmployeeAchievementItem } from "../../../types";
import { PersonalAchievementRow } from "./PersonalAchievementRow";

export const PersonalAchievementSection = memo(function PersonalAchievementSection({
  form,
  onChange,
}: PersonalSectionProps) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const handleFileUpload = async (file: File, idx: number) => {
    setUploadingIdx(idx);
    try {
      const s3Item = await uploadFileToS3(file, "employees/achievements");
      const updated = [...(form.achievement_history || [])];
      updated[idx] = { ...updated[idx], attachment: s3Item.url };
      onChange("achievement_history", updated);
      toast("Stored on AWS S3", `Saved ${file.name} to AWS S3.`, "success");
    } catch (err) {
      console.error("Achievement doc S3 upload error:", err);
      toast("Upload Failed", "Could not upload document to AWS S3", "error");
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleUpdateField = (
    idx: number,
    field: keyof EmployeeAchievementItem,
    val: string
  ) => {
    const updated = [...(form.achievement_history || [])];
    updated[idx] = { ...updated[idx], [field]: val };
    onChange("achievement_history", updated);
  };

  const handleAdd = () => {
    const current = form.achievement_history || [];
    onChange("achievement_history", [
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
    ]);
  };

  const handleRemove = (idx: number) => {
    const updated = [...(form.achievement_history || [])];
    updated.splice(idx, 1);
    onChange("achievement_history", updated);
  };

  return (
    <div className="pt-6 border-t border-slate-200 w-full">
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
            Achievement &amp; System Recognition Info
          </h3>
          <p className="text-[11px] text-slate-400 font-medium">
            Record honors, awards, websites, web apps, or systems created
          </p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="w-7 h-7 rounded-full border border-sky-400 text-sky-600 hover:bg-sky-50 flex items-center justify-center text-base transition-colors cursor-pointer"
          title="Add Achievement"
        >
          <i className="ri-add-line" />
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
        <table className="w-full text-xs text-left min-w-[900px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
            <tr>
              <th className="py-2 px-2.5 w-10">No.</th>
              <th className="py-2 px-2.5">Title</th>
              <th className="py-2 px-2.5 w-24">Year</th>
              <th className="py-2 px-2.5 w-28">Country</th>
              <th className="py-2 px-2.5">Program / System Name</th>
              <th className="py-2 px-2.5">Organizer / Issuer</th>
              <th className="py-2 px-2.5">Remark</th>
              <th className="py-2 px-2.5 min-w-[200px]">Live URL / Attachment</th>
              <th className="py-2 px-2.5 w-10 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {form.achievement_history && form.achievement_history.length > 0 ? (
              form.achievement_history.map((ach, idx) => (
                <PersonalAchievementRow
                  key={idx}
                  ach={ach}
                  idx={idx}
                  uploading={uploadingIdx === idx}
                  onUpdateField={handleUpdateField}
                  onRemove={handleRemove}
                  onUploadFile={handleFileUpload}
                />
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-6 text-center text-slate-400 font-medium">
                  Empty Employee Achievements
                </td>
                <td className="py-6 text-center">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="w-5 h-5 mx-auto rounded-full border border-sky-400 text-sky-500 hover:bg-sky-50 flex items-center justify-center text-xs cursor-pointer"
                    title="Add Achievement"
                  >
                    <i className="ri-add-line" />
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});

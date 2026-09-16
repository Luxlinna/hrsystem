import { memo, useState } from "react";
import { uploadFileToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";
import type { PersonalSectionProps } from "./types";

export const PersonalTrainingSection = memo(function PersonalTrainingSection({
  form,
  onChange,
}: PersonalSectionProps) {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);

  const handleFileUpload = async (file: File, idx: number) => {
    setUploadingIdx(idx);
    try {
      const s3Item = await uploadFileToS3(file, "employees/training");
      const updated = [...(form.training_history || [])];
      updated[idx] = { ...updated[idx], attachment: s3Item.url };
      onChange("training_history", updated);
      toast("Stored on AWS S3", `Saved ${file.name} to AWS S3.`, "success");
    } catch (err) {
      console.error("Training doc S3 upload error:", err);
      toast("Upload Failed", "Could not upload training document to AWS S3", "error");
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleAdd = () => {
    const current = form.training_history || [];
    onChange("training_history", [
      ...current,
      {
        institue: "",
        subject: "",
        start_date: "",
        end_date: "",
        remark: "",
        attachment: "",
      },
    ]);
  };

  const handleRemove = (idx: number) => {
    const updated = [...(form.training_history || [])];
    updated.splice(idx, 1);
    onChange("training_history", updated);
  };

  return (
    <div className="pt-6 border-t border-slate-200 w-full">
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
          Tranning History Info
        </h3>
        <button
          type="button"
          onClick={handleAdd}
          className="w-7 h-7 rounded-full border border-sky-400 text-sky-600 hover:bg-sky-50 flex items-center justify-center text-base transition-colors cursor-pointer"
          title="Add Tranning History"
        >
          <i className="ri-add-line" />
        </button>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
        <table className="w-full text-xs text-left min-w-[750px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
            <tr>
              <th className="py-2 px-3 w-12">No.</th>
              <th className="py-2 px-3">Institue</th>
              <th className="py-2 px-3">Subject</th>
              <th className="py-2 px-3">Start Date</th>
              <th className="py-2 px-3">End Date</th>
              <th className="py-2 px-3">Remark</th>
              <th className="py-2 px-3">Attachment</th>
              <th className="py-2 px-3 w-12 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {form.training_history && form.training_history.length > 0 ? (
              form.training_history.map((train, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-2 px-3 text-slate-500 font-medium">{idx + 1}</td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={train.institue}
                      onChange={(e) => {
                        const updated = [...(form.training_history || [])];
                        updated[idx] = { ...updated[idx], institue: e.target.value };
                        onChange("training_history", updated);
                      }}
                      placeholder="Institute / Organization"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={train.subject}
                      onChange={(e) => {
                        const updated = [...(form.training_history || [])];
                        updated[idx] = { ...updated[idx], subject: e.target.value };
                        onChange("training_history", updated);
                      }}
                      placeholder="Subject / Course"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="date"
                      value={train.start_date}
                      onChange={(e) => {
                        const updated = [...(form.training_history || [])];
                        updated[idx] = { ...updated[idx], start_date: e.target.value };
                        onChange("training_history", updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="date"
                      value={train.end_date}
                      onChange={(e) => {
                        const updated = [...(form.training_history || [])];
                        updated[idx] = { ...updated[idx], end_date: e.target.value };
                        onChange("training_history", updated);
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    <input
                      type="text"
                      value={train.remark}
                      onChange={(e) => {
                        const updated = [...(form.training_history || [])];
                        updated[idx] = { ...updated[idx], remark: e.target.value };
                        onChange("training_history", updated);
                      }}
                      placeholder="Remark"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:border-[#253C7D]"
                    />
                  </td>
                  <td className="py-2 px-3">
                    {uploadingIdx === idx ? (
                      <div className="flex items-center gap-1.5 text-blue-600 text-[10px] font-bold py-1">
                        <i className="ri-loader-4-line animate-spin text-sm" />
                        <span>Uploading to AWS S3...</span>
                      </div>
                    ) : train.attachment ? (
                      <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-blue-50/70 border border-blue-200/80">
                        <a
                          href={train.attachment}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] font-bold text-[#253C7D] hover:underline truncate max-w-[140px]"
                          title="View on AWS S3"
                        >
                          <i className="ri-file-text-line text-blue-500" />
                          <span className="truncate">View on AWS S3</span>
                          <i className="ri-external-link-line text-[10px]" />
                        </a>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...(form.training_history || [])];
                            updated[idx] = { ...updated[idx], attachment: "" };
                            onChange("training_history", updated);
                          }}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer text-xs"
                          title="Remove attachment"
                        >
                          <i className="ri-close-line" />
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, idx);
                        }}
                        className="w-full text-[10px] text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                      />
                    )}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemove(idx)}
                      className="text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove"
                    >
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-slate-400 font-medium">
                  Empty Tranning Histories
                </td>
                <td className="py-6 text-center">
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="w-5 h-5 mx-auto rounded-full border border-sky-400 text-sky-500 hover:bg-sky-50 flex items-center justify-center text-xs cursor-pointer"
                    title="Add Tranning History"
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

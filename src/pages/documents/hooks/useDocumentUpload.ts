import { useState, useRef, useCallback } from "react";
import { getDocumentUploadUrl } from "@/lib/r2-storage";
import { toast } from "@/components/Toast";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB } from "../constants";

export function useDocumentUpload() {
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [fileLink, setFileLink] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetUploadState = useCallback(() => {
    setFileUpload(null);
    setFileLink("");
    setDragOver(false);
  }, []);

  const uploadFileToStorage = useCallback(
    async (fallbackTitle: string) => {
      let finalFileUrl = fileLink.trim() || null;
      let finalFileName = fileUpload ? fileUpload.name : fallbackTitle;
      let finalFileSize = fileUpload ? `${(fileUpload.size / (1024 * 1024)).toFixed(2)} MB` : "—";
      let finalFileType = fileUpload ? fileUpload.name.split(".").pop()?.toUpperCase() || "DOC" : "PDF";

      if (fileUpload) {
        if (fileUpload.size > MAX_FILE_SIZE_BYTES) {
          toast("File too large", `File exceeds ${MAX_FILE_SIZE_MB}MB limit`, "error");
          throw new Error(`File exceeds ${MAX_FILE_SIZE_MB}MB limit`);
        }
        const { uploadUrl, publicUrl } = await getDocumentUploadUrl(fileUpload.name);
        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          body: fileUpload,
          headers: { "Content-Type": fileUpload.type },
        });
        if (!putRes.ok) throw new Error("Failed to upload file to storage.");
        finalFileUrl = publicUrl;
      }

      return { finalFileUrl, finalFileName, finalFileSize, finalFileType };
    },
    [fileUpload, fileLink]
  );

  return {
    fileUpload,
    setFileUpload,
    fileLink,
    setFileLink,
    dragOver,
    setDragOver,
    fileInputRef,
    resetUploadState,
    uploadFileToStorage,
  };
}

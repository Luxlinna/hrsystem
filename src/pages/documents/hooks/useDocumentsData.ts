import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { Document, DocumentFolder } from "../types";
import { DEFAULT_FOLDERS } from "../constants";

interface UseDocumentsDataProps {
  isPartnerBranchBlocked: boolean;
  targetBranch: string | null;
  canManageDocs: boolean;
  selectedDocId?: string | null;
  setSelectedDoc: React.Dispatch<React.SetStateAction<Document | null>>;
}

export function useDocumentsData({
  isPartnerBranchBlocked,
  targetBranch,
  canManageDocs,
  selectedDocId,
  setSelectedDoc,
}: UseDocumentsDataProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<DocumentFolder[]>(DEFAULT_FOLDERS);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (isPartnerBranchBlocked || !targetBranch) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let docQuery = supabase
      .from("documents")
      .select("*")
      .is("deleted_at", null)
      .or(`branch_id.is.null,branch_id.eq.${targetBranch}`)
      .order("created_at", { ascending: false });

    if (!canManageDocs) {
      docQuery = docQuery.eq("visibility", "all");
    }

    const folderQuery = supabase
      .from("document_folders")
      .select("*")
      .or(`branch_id.is.null,branch_id.eq.${targetBranch}`)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    const [docRes, folderRes] = await Promise.all([docQuery, folderQuery]);

    setDocuments((docRes.data as Document[]) || []);
    if (folderRes.data && folderRes.data.length > 0) {
      setFolders(folderRes.data as DocumentFolder[]);
    } else {
      setFolders(DEFAULT_FOLDERS);
    }
    setLoading(false);
  }, [isPartnerBranchBlocked, targetBranch, canManageDocs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDownload = useCallback(
    async (doc: Document) => {
      if (doc.file_url) {
        window.open(doc.file_url, "_blank");
      } else {
        toast("Download", "No attached file or external URL found for this document.", "error");
        return;
      }
      await supabase
        .from("documents")
        .update({ download_count: (doc.download_count || 0) + 1 })
        .eq("id", doc.id);
      setDocuments((prev) =>
        prev.map((d) => (d.id === doc.id ? { ...d, download_count: d.download_count + 1 } : d))
      );
      if (selectedDocId === doc.id) {
        setSelectedDoc((prev) => (prev ? { ...prev, download_count: prev.download_count + 1 } : null));
      }
    },
    [selectedDocId, setSelectedDoc]
  );

  const handleCopyLink = useCallback((doc: Document) => {
    if (doc.file_url) {
      navigator.clipboard.writeText(doc.file_url);
      toast("Link Copied", "Document link copied to your clipboard.", "success");
    } else {
      toast("Link", "No link available for this document.", "error");
    }
  }, []);

  return {
    documents,
    setDocuments,
    folders,
    setFolders,
    loading,
    loadData,
    handleDownload,
    handleCopyLink,
  };
}

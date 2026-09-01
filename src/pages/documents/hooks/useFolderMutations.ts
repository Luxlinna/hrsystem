import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { DocumentFolder, FolderFormState } from "../types";
import { INITIAL_FOLDER_FORM, FOLDER_COLOR_PRESETS } from "../constants";

interface UseFolderMutationsProps {
  actorName: string;
  roleName: string;
  targetBranch: string | null;
  loadData: () => Promise<void>;
  folders: DocumentFolder[];
  activeCategory: string;
  setActiveCategory: (cat: string) => void;
  setExpandedFolderIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export function useFolderMutations({
  actorName,
  roleName,
  targetBranch,
  loadData,
  folders,
  activeCategory,
  setActiveCategory,
  setExpandedFolderIds,
}: UseFolderMutationsProps) {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [editingFolder, setEditingFolder] = useState<DocumentFolder | null>(null);
  const [folderForm, setFolderForm] = useState<FolderFormState>(INITIAL_FOLDER_FORM);
  const [folderSubmitting, setFolderSubmitting] = useState(false);

  const openNewFolderModal = useCallback(
    (presetParentId?: string) => {
      setEditingFolder(null);
      setFolderForm({
        ...INITIAL_FOLDER_FORM,
        parentId: presetParentId || (activeCategory !== "all" ? activeCategory : ""),
        colorPreset: FOLDER_COLOR_PRESETS[Math.floor(Math.random() * FOLDER_COLOR_PRESETS.length)].id,
      });
      setShowFolderModal(true);
    },
    [activeCategory]
  );

  const openEditFolderModal = useCallback((folder: DocumentFolder) => {
    setEditingFolder(folder);
    const preset = FOLDER_COLOR_PRESETS.find((p) => p.color === folder.color)?.id || "navy";
    setFolderForm({
      label: folder.label,
      description: folder.description || "",
      icon: folder.icon,
      colorPreset: preset,
      parentId: folder.parent_id || "",
    });
    setShowFolderModal(true);
  }, []);

  const handleSaveFolder = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!folderForm.label.trim()) {
        toast("Validation Error", "Folder name is required.", "error");
        return;
      }
      setFolderSubmitting(true);

      const colorPresetObj =
        FOLDER_COLOR_PRESETS.find((p) => p.id === folderForm.colorPreset) || FOLDER_COLOR_PRESETS[0];

      try {
        if (editingFolder) {
          const { error } = await supabase
            .from("document_folders")
            .update({
              name: folderForm.label.trim(),
              description: folderForm.description.trim() || null,
              icon: folderForm.icon,
              color: colorPresetObj.color,
              bg: colorPresetObj.bg,
              border: colorPresetObj.border,
              parent_id: folderForm.parentId || null,
            })
            .eq("id", editingFolder.id);

          if (error) throw error;
          toast("Folder Updated", `Folder "${folderForm.label}" updated.`, "success");
        } else {
          const slugId =
            folderForm.label
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "_")
              .replace(/^_+|_+$/g, "") +
            "_" +
            Math.random().toString(36).substring(2, 6);

          const { error } = await supabase.from("document_folders").insert({
            id: slugId,
            name: folderForm.label.trim(),
            description: folderForm.description.trim() || null,
            icon: folderForm.icon,
            color: colorPresetObj.color,
            bg: colorPresetObj.bg,
            border: colorPresetObj.border,
            parent_id: folderForm.parentId || null,
            created_by: actorName,
            branch_id: targetBranch,
          });

          if (error) throw error;
          toast("Folder Created", `Folder "${folderForm.label}" created.`, "success");

          if (folderForm.parentId) {
            setExpandedFolderIds((prev) => new Set([...prev, folderForm.parentId]));
          }
          setActiveCategory(slugId);
        }

        setShowFolderModal(false);
        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to save folder", "error");
      } finally {
        setFolderSubmitting(false);
      }
    },
    [folderForm, editingFolder, actorName, targetBranch, loadData, setExpandedFolderIds, setActiveCategory]
  );

  const handleDeleteFolder = useCallback(
    async (folder: DocumentFolder) => {
      const hasSubfolders = folders.some((f) => f.parent_id === folder.id);
      if (hasSubfolders) {
        toast("Cannot Delete", "This folder contains subfolders. Please delete or move them first.", "error");
        return;
      }
      if (!confirm(`Are you sure you want to delete folder "${folder.label}"?`)) return;

      try {
        const { error } = await supabase.from("document_folders").delete().eq("id", folder.id);
        if (error) throw error;

        toast("Folder Deleted", `Folder "${folder.label}" removed.`, "success");
        if (activeCategory === folder.id) {
          setActiveCategory("all");
        }
        await loadData();
      } catch (err: any) {
        toast("Error", err.message || "Failed to delete folder", "error");
      }
    },
    [folders, activeCategory, setActiveCategory, loadData]
  );

  return {
    showFolderModal,
    setShowFolderModal,
    editingFolder,
    folderForm,
    setFolderForm,
    folderSubmitting,
    openNewFolderModal,
    openEditFolderModal,
    handleSaveFolder,
    handleDeleteFolder,
  };
}

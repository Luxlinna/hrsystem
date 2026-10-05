import { useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { JobDescriptionTemplate } from "../../../types";

export interface JdTemplateFormData {
  id?: string;
  title: string;
  department: string;
  business_unit: string;
  job_summary: string;
  responsibilities: string;
  requirements: string;
  qualifications: string;
  reporting_line: string;
}

const DEFAULT_FORM: JdTemplateFormData = {
  title: "",
  department: "General",
  business_unit: "OPS SOLUTIONS CO., LTD",
  job_summary: "",
  responsibilities: "",
  requirements: "",
  qualifications: "",
  reporting_line: "",
};

export function useManageJdTemplates(
  templates: JobDescriptionTemplate[],
  onRefresh: () => Promise<void>,
  onSelectTemplate?: (templateId: string) => void,
  onClose?: () => void
) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<JdTemplateFormData>(DEFAULT_FORM);

  const departments = useMemo(() => {
    return Array.from(new Set(templates.map((t) => t.department).filter(Boolean))).sort();
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    return templates.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = !q || t.title.toLowerCase().includes(q) || (t.department || "").toLowerCase().includes(q) || (t.business_unit || "").toLowerCase().includes(q);
      const matchDept = selectedDept === "all" || t.department === selectedDept;
      return matchSearch && matchDept;
    });
  }, [templates, searchQuery, selectedDept]);

  const selectedTemplate = useMemo(() => {
    return templates.find((t) => t.id === selectedTemplateId) || filteredTemplates[0] || null;
  }, [templates, selectedTemplateId, filteredTemplates]);

  const handleStartEdit = (tpl: JobDescriptionTemplate) => {
    setEditForm({
      id: tpl.id,
      title: tpl.title || "",
      department: tpl.department || "General",
      business_unit: tpl.business_unit || "OPS SOLUTIONS CO., LTD",
      job_summary: tpl.job_summary || "",
      responsibilities: tpl.responsibilities || "",
      requirements: tpl.requirements || "",
      qualifications: tpl.qualifications || "",
      reporting_line: tpl.reporting_line || "",
    });
    setIsEditing(true);
    setIsCreatingNew(false);
  };

  const handleStartCreate = () => {
    setEditForm({ ...DEFAULT_FORM, department: "Human Resources" });
    setIsCreatingNew(true);
    setIsEditing(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      toast("Validation", "Please enter a Job Title for the template.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: editForm.title.trim(),
        department: editForm.department || "General",
        business_unit: editForm.business_unit || null,
        job_summary: editForm.job_summary || "",
        responsibilities: editForm.responsibilities || "",
        requirements: editForm.requirements || "",
        qualifications: editForm.qualifications || "",
        reporting_line: editForm.reporting_line || null,
      };
      if (isCreatingNew) {
        const { data, error } = await supabase.from("job_description_templates").insert([{ ...payload, created_by_name: "Super Admin", version: 1 }]).select().single();
        if (error) throw error;
        toast("Template Created", `Added "${editForm.title}" to JD Library.`, "success");
        await onRefresh();
        if (data?.id) setSelectedTemplateId(data.id);
      } else if (editForm.id) {
        const { error } = await supabase.from("job_description_templates").update(payload).eq("id", editForm.id);
        if (error) throw error;
        toast("Template Updated", `Changes to "${editForm.title}" saved.`, "success");
        await onRefresh();
      }
      setIsEditing(false);
      setIsCreatingNew(false);
    } catch (err: any) {
      toast("Save Failed", err.message || "Could not save template", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    setDeleting(true);
    try {
      const { error } = await supabase.from("job_description_templates").delete().eq("id", id);
      if (error) throw error;
      toast("Deleted", "Job Description template removed from library.", "success");
      setDeleteConfirmId(null);
      await onRefresh();
      if (selectedTemplateId === id) setSelectedTemplateId("");
    } catch (err: any) {
      toast("Delete Error", err.message || "Failed to delete template", "error");
    } finally {
      setDeleting(false);
    }
  };

  const handleApply = (tpl: JobDescriptionTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(tpl.id);
      if (onClose) onClose();
    }
  };

  return {
    searchQuery, setSearchQuery, selectedDept, setSelectedDept,
    selectedTemplateId, setSelectedTemplateId, isEditing, setIsEditing,
    isCreatingNew, setIsCreatingNew, saving, deleting,
    deleteConfirmId, setDeleteConfirmId, editForm, setEditForm,
    departments, filteredTemplates, selectedTemplate,
    handleStartEdit, handleStartCreate, handleSaveTemplate, handleDeleteTemplate, handleApply,
  };
}

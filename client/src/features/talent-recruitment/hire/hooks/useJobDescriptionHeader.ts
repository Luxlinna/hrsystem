import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { extractJdFromFile, type ExtractedJdData } from "../utils/jdExtractor";
import type { NewHiringRequestFormState, JobDescriptionTemplate } from "../types";

export function useJobDescriptionHeader(
  form: NewHiringRequestFormState,
  setForm: React.Dispatch<React.SetStateAction<NewHiringRequestFormState>>
) {
  const [templates, setTemplates] = useState<JobDescriptionTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [pasteModalOpen, setPasteModalOpen] = useState(false);
  const [selectedTplId, setSelectedTplId] = useState<string>(form.jd_template_id || "");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("job_description_templates").select("*").order("title");
      setTemplates(data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const applyExtracted = useCallback(
    (ext: ExtractedJdData) => {
      setForm((p) => {
        const title = p.title?.trim() ? p.title : ext.title || p.title;
        const summary = ext.job_summary || p.jd_summary || "";
        const resp = ext.responsibilities || p.jd_responsibilities || "";
        const req = ext.requirements || p.jd_requirements || "";
        const qual = ext.qualifications || p.jd_qualifications || "";
        const rep = ext.reporting_line || p.jd_reporting_line || "";

        let justification = p.justification || ext.justification || "";
        if (!justification && summary) {
          const firstSentence = summary.split(/[.\n]/)[0].trim();
          if (firstSentence.length > 15) {
            justification = firstSentence;
          }
        }

        // Auto-detect Years of Experience
        let yearsExp = p.years_of_experience;
        const combinedText = `${req} ${qual} ${ext.rawText || ""}`;
        const expMatch = combinedText.match(/(\d+)(?:\s*-\s*(\d+)|\+)?\s*(?:to\s*(\d+)\s*)?years?(?:\s+of)?\s*(?:relevant\s+)?experience/i);
        if (expMatch) {
          const minNum = parseInt(expMatch[1], 10);
          if (minNum >= 8) yearsExp = "8+ years";
          else if (minNum >= 5) yearsExp = "5 - 8 years";
          else if (minNum >= 2) yearsExp = "2 - 5 years";
          else if (minNum >= 1) yearsExp = "1 - 2 years";
          else yearsExp = "0 - 1 year";
        }

        // Auto-detect Education Degree
        let educationDegree = qual;
        const eduMatch = combinedText.match(/(?:bachelor(?:'s)?|master(?:'s)?|phd|diploma|degree|associate)\s+(?:in|of)\s+[a-z\s,\/]+/i);
        if (eduMatch) {
          educationDegree = eduMatch[0].trim();
        }

        return {
          ...p,
          title,
          department: p.department || ext.department || p.department,
          division: p.division || ext.division || p.division,
          employment_type: ext.employment_type || p.employment_type,
          salary_min: p.salary_min || ext.salary_min || p.salary_min,
          salary_max: p.salary_max || ext.salary_max || p.salary_max,
          headcount: ext.headcount || p.headcount || 1,
          justification,
          years_of_experience: yearsExp || p.years_of_experience || "2 - 5 years",
          experience_description: p.experience_description || (req.split("\n")[0] || "").replace(/^[•\-\*]\s*/, ""),
          jd_summary: summary,
          jd_responsibilities: resp,
          jd_requirements: req,
          jd_qualifications: educationDegree || qual,
          jd_reporting_line: rep,
          job_description: `${summary}\n\nResponsibilities:\n${resp}\n\nRequirements:\n${req}\n\nQualifications:\n${qual}`.trim(),
        };
      });
    },
    [setForm]
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    try {
      const extracted = await extractJdFromFile(file);
      if (!extracted.rawText?.trim()) {
        toast(
          "Unreadable File",
          "Could not extract text from this file. Please ensure it is a readable PDF or DOCX file, or use 'Paste Text'.",
          "warning"
        );
        return;
      }
      applyExtracted(extracted);
      if (extracted.isOcr) {
        toast("OCR Document Scanned", `Extracted JD details from image/scanned file "${file.name}" via OCR engine!`, "success");
      } else {
        toast("JD Auto-filled", `Extracted details from "${file.name}"`, "success");
      }
    } catch (err: any) {
      toast("Extraction Error", err.message || "Failed to parse file", "error");
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleApplyTemplate = (tplId: string) => {
    setSelectedTplId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (!tpl) return;
    const clean = (s?: string | null) => (s || "").replace(/\\n/g, "\n");
    const [resp, req, qual] = [clean(tpl.responsibilities), clean(tpl.requirements), clean(tpl.qualifications)];
    setForm((p) => ({
      ...p,
      title: p.title || tpl.title,
      department: p.department || tpl.department,
      jd_summary: tpl.job_summary,
      jd_responsibilities: resp,
      jd_requirements: req,
      jd_qualifications: qual,
      jd_reporting_line:
        tpl.reporting_line ||
        (p.hiring_manager_name ? `Reports to: ${p.hiring_manager_name}` : `Reports to: ${tpl.department} Head`),
      jd_template_id: tpl.id,
      job_description: `${tpl.job_summary}\n\nResponsibilities:\n${resp}\n\nRequirements:\n${req}\n\nQualifications:\n${qual}`,
    }));
    toast("Template Applied", `Loaded "${tpl.title}" from JD Library`, "success");
  };

  const handleSaveAsTemplate = async () => {
    if (!form.title.trim() || !form.jd_summary?.trim()) {
      toast("Validation", "Please provide a Position Title and Job Summary first.", "error");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("job_description_templates")
        .insert([
          {
            title: form.title.trim(),
            department: form.department || "General",
            business_unit: form.business_unit || null,
            job_summary: form.jd_summary || "",
            responsibilities: form.jd_responsibilities || "",
            requirements: form.jd_requirements || "",
            qualifications: form.jd_qualifications || "",
            reporting_line: form.jd_reporting_line || null,
            created_by_name: form.hiring_manager_name || "Manager",
          },
        ])
        .select()
        .single();
      if (error) throw error;
      toast("Saved to Library", `"${form.title}" is now available in your JD Library!`, "success");
      await loadTemplates();
      if (data?.id) setSelectedTplId(data.id);
    } catch (err: any) {
      toast("Error", err.message || "Failed to save template", "error");
    } finally {
      setSaving(false);
    }
  };

  return {
    templates,
    loading,
    saving,
    parsing,
    pasteModalOpen,
    setPasteModalOpen,
    selectedTplId,
    fileInputRef,
    applyExtracted,
    handleFileUpload,
    handleApplyTemplate,
    handleSaveAsTemplate,
  };
}

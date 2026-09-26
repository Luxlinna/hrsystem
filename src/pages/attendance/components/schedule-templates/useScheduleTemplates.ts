import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { ScheduleTemplate } from "./types";
import { INITIAL_SCHEDULE_TEMPLATES } from "./types";

const STORAGE_KEY = "hrm_ops_schedule_templates_v1";

export function useScheduleTemplates() {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);

  const [loading, setLoading] = useState(true);
  const [activeFormTemplate, setActiveFormTemplate] = useState<ScheduleTemplate | null | "new">(null);

  // Fetch from Supabase DB (system_settings: key 'schedule_templates')
  const fetchTemplatesFromDb = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "schedule_templates")
        .maybeSingle();

      if (!error && data?.value) {
        try {
          const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
          if (Array.isArray(parsed)) {
            setTemplates(parsed);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
            } catch {}
          }
        } catch (e) {
          console.warn("Failed to parse schedule templates from DB:", e);
        }
      } else {
        setTemplates([]);
      }
    } catch (err) {
      console.warn("Error fetching schedule templates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplatesFromDb();
  }, [fetchTemplatesFromDb]);

  // Persist helper
  const persistTemplatesToDb = async (newTemplates: ScheduleTemplate[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
    } catch {}

    try {
      await supabase
        .from("system_settings")
        .upsert(
          {
            key: "schedule_templates",
            value: JSON.stringify(newTemplates),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "key" }
        );
    } catch (err) {
      console.warn("Failed to persist schedule templates to DB:", err);
    }
  };

  const handleSaveTemplate = useCallback(
    async (template: ScheduleTemplate) => {
      let updated: ScheduleTemplate[] = [];
      setTemplates((prev) => {
        const idx = prev.findIndex((t) => t.id === template.id);
        if (idx >= 0) {
          const copy = [...prev];
          copy[idx] = template;
          updated = copy;
          return copy;
        }
        updated = [template, ...prev];
        return updated;
      });

      setActiveFormTemplate(null);
      toast.success("Schedule template saved to database");
      await persistTemplatesToDb(updated);
    },
    []
  );

  const handleDeleteTemplate = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this schedule template?")) return;
      let updated: ScheduleTemplate[] = [];
      setTemplates((prev) => {
        updated = prev.filter((t) => t.id !== id);
        return updated;
      });
      toast.success("Schedule template deleted");
      await persistTemplatesToDb(updated);
    },
    []
  );

  const handleToggleStatus = useCallback(
    async (id: string) => {
      let updated: ScheduleTemplate[] = [];
      setTemplates((prev) => {
        updated = prev.map((t) =>
          t.id === id ? { ...t, status: t.status === "Active" ? "Disabled" : "Active" } : t
        );
        return updated;
      });
      toast.success("Status updated");
      await persistTemplatesToDb(updated);
    },
    []
  );

  const handleDuplicateTemplate = useCallback(
    async (template: ScheduleTemplate) => {
      const dup: ScheduleTemplate = {
        ...template,
        id: `st-${Date.now()}`,
        title: `${template.title} (Copy)`,
        created_at: new Date().toISOString(),
      };
      let updated: ScheduleTemplate[] = [];
      setTemplates((prev) => {
        updated = [dup, ...prev];
        return updated;
      });
      toast.success("Schedule template duplicated");
      await persistTemplatesToDb(updated);
    },
    []
  );

  return {
    templates,
    loading,
    activeFormTemplate,
    setActiveFormTemplate,
    handleSaveTemplate,
    handleDeleteTemplate,
    handleToggleStatus,
    handleDuplicateTemplate,
    reloadTemplates: fetchTemplatesFromDb,
  };
}

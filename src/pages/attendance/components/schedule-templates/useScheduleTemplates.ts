import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { ScheduleTemplate } from "./types";

const STORAGE_KEY = "hrm_ops_schedule_templates_v1";

export function useScheduleTemplates() {
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFormTemplate, setActiveFormTemplate] = useState<ScheduleTemplate | null | "new">(null);
  const templatesRef = useRef<ScheduleTemplate[]>([]);

  useEffect(() => {
    templatesRef.current = templates;
  }, [templates]);

  const persistTemplatesToDb = async (newTemplates: ScheduleTemplate[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTemplates));
    } catch {}

    try {
      await supabase.from("system_settings").upsert(
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

  const fetchTemplatesFromDb = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("system_settings")
        .select("value")
        .eq("key", "schedule_templates")
        .maybeSingle();

      let loaded: ScheduleTemplate[] = [];

      if (!error && data?.value) {
        try {
          const parsed = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
          if (Array.isArray(parsed) && parsed.length > 0) loaded = parsed;
        } catch (e) {
          console.warn("Failed to parse schedule templates from DB:", e);
        }
      }

      if (loaded.length === 0) {
        try {
          const local = localStorage.getItem(STORAGE_KEY);
          if (local) {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              loaded = parsed;
              persistTemplatesToDb(loaded);
            }
          }
        } catch {}
      }

      try {
        const { data: dbRows } = await supabase
          .from("schedule_templates")
          .select("*, schedule_template_assignments(employee_id)")
          .is("deleted_at", null);

        if (dbRows && dbRows.length > 0) {
          dbRows.forEach((row: any) => {
            if (!loaded.some((t) => t.id === row.id)) {
              const assignedIds = (row.schedule_template_assignments || []).map((a: any) => a.employee_id);
              loaded.push({
                id: row.id,
                title: row.title,
                site_id: row.site_id,
                site_name: row.site_name || "All",
                days: row.days || {
                  mon: row.monday || "OFF", tue: row.tuesday || "OFF", wed: row.wednesday || "OFF",
                  thu: row.thursday || "OFF", fri: row.friday || "OFF", sat: row.saturday || "OFF", sun: row.sunday || "OFF",
                },
                total_employee: assignedIds.length,
                assigned_employee_ids: assignedIds,
                remark: row.remark || "",
                status: (row.status === "Disabled" ? "Disabled" : "Active") as "Active" | "Disabled",
                created_at: row.created_at,
              });
            }
          });
        }
      } catch {}

      setTemplates(loaded);
      templatesRef.current = loaded;
    } catch (err) {
      console.warn("Error fetching schedule templates:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplatesFromDb();
  }, [fetchTemplatesFromDb]);

  const handleSaveTemplate = useCallback(async (template: ScheduleTemplate) => {
    const prev = templatesRef.current;
    const idx = prev.findIndex((t) => t.id === template.id);
    const updated = idx >= 0 ? prev.map((t, i) => (i === idx ? template : t)) : [template, ...prev];
    setTemplates(updated);
    templatesRef.current = updated;
    setActiveFormTemplate(null);
    toast.success("Schedule template saved to database");
    await persistTemplatesToDb(updated);
  }, []);

  const handleDeleteTemplate = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this schedule template?")) return;
    const prev = templatesRef.current;
    const updated = prev.filter((t) => t.id !== id);
    setTemplates(updated);
    templatesRef.current = updated;
    toast.success("Schedule template deleted");
    await persistTemplatesToDb(updated);
  }, []);

  const handleToggleStatus = useCallback(async (id: string) => {
    const prev = templatesRef.current;
    const updated: ScheduleTemplate[] = prev.map((t) =>
      t.id === id ? { ...t, status: (t.status === "Active" ? "Disabled" : "Active") as "Active" | "Disabled" } : t
    );
    setTemplates(updated);
    templatesRef.current = updated;
    toast.success("Status updated");
    await persistTemplatesToDb(updated);
  }, []);

  const handleDuplicateTemplate = useCallback(async (template: ScheduleTemplate) => {
    const dup: ScheduleTemplate = {
      ...template,
      id: `st-${Date.now()}`,
      title: `${template.title} (Copy)`,
      created_at: new Date().toISOString(),
    };
    const prev = templatesRef.current;
    const updated = [dup, ...prev];
    setTemplates(updated);
    templatesRef.current = updated;
    toast.success("Schedule template duplicated");
    await persistTemplatesToDb(updated);
  }, []);

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

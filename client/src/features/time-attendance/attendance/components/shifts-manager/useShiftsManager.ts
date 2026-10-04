import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import type { ManagedShift } from "./types";
import { INITIAL_MANAGED_SHIFTS } from "./types";

function formatTime12(timeStr?: string | null): string {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 === 0 ? 12 : h % 12;
  return `${displayH}:${m} ${ampm}`;
}

function deriveTimeDisplay(startTime?: string | null, endTime?: string | null): string {
  if (!startTime || !endTime) return "Flexible";
  return `${formatTime12(startTime)} - ${formatTime12(endTime)}`;
}

function deriveCode(name: string, startTime?: string | null, endTime?: string | null): string {
  const trimmed = name.trim();
  const firstWord = trimmed.split(/[\s\-&_]+/)[0];
  if (/^[A-Za-z0-9]{2,6}$/.test(firstWord)) {
    return firstWord.toUpperCase();
  }
  if (startTime && endTime) {
    const sH = startTime.slice(0, 2);
    const eH = endTime.slice(0, 2);
    return `${sH}${eH}`;
  }
  return trimmed.slice(0, 4).toUpperCase();
}

export function useShiftsManager() {
  const [shifts, setShifts] = useState<ManagedShift[]>(INITIAL_MANAGED_SHIFTS);
  const [loading, setLoading] = useState(true);
  const [activeFormShift, setActiveFormShift] = useState<ManagedShift | null | "new">(null);

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("shifts")
        .select("*")
        .is("deleted_at", null)
        .order("name", { ascending: true });

      if (error) {
        console.warn("Could not query shifts from DB, using fallback:", error.message);
        return;
      }

      if (data && data.length > 0) {
        // Master shifts have a defined shift code in notes or were created in this module.
        // Legacy calendar shift records (e.g. 63 daily "Day Shift" rows per date) are filtered out.
        const masterRows = data.filter((row: any) => {
          if (row.notes) {
            try {
              const extra = typeof row.notes === "object" ? row.notes : JSON.parse(row.notes);
              if (extra && extra.code) return true;
            } catch {
              // regular text
            }
          }
          return false;
        });

        if (masterRows.length === 0) {
          setShifts([]);
          return;
        }

        const mapped: ManagedShift[] = masterRows.map((row: any) => {
          let extra: any = {};
          if (row.notes) {
            try {
              if (typeof row.notes === "object") {
                extra = row.notes;
              } else if (typeof row.notes === "string" && row.notes.trim().startsWith("{")) {
                extra = JSON.parse(row.notes);
              }
            } catch {
              // regular string
            }
          }

          const code = extra.code || row.code || deriveCode(row.name, row.start_time, row.end_time);
          const timeDisplay = extra.time_display || deriveTimeDisplay(row.start_time, row.end_time);

          return {
            id: row.id,
            code,
            name: row.name,
            time_display: timeDisplay,
            color: row.color || extra.color || "#2563EB",
            total_work_hours: extra.total_work_hours || row.required_hours || 8,
            is_overnight: extra.is_overnight ?? (row.start_time > row.end_time),
            must_mark_check_in: extra.must_mark_check_in ?? true,
            must_mark_check_out: extra.must_mark_check_out ?? true,
            time_table: extra.time_table || [],
            come_earliest: extra.come_earliest || [],
            come_lates: extra.come_lates || [],
            leave_earliest: extra.leave_earliest || [],
            leave_lates: extra.leave_lates || [],
            remark:
              extra.remark ||
              (typeof row.notes === "string" && !row.notes.startsWith("{") ? row.notes : ""),
            status: row.deleted_at ? "Disabled" : "Active",
          };
        });

        // Preferred order from the official shifts specification
        const PREFERRED_ORDER = [
          "FAI3", "FAI2", "FAI1", "0812", "2005", "NMS2",
          "RPS2", "1204", "NMS1", "TH13", "TH16", "TH07"
        ];

        mapped.sort((a, b) => {
          const idxA = PREFERRED_ORDER.indexOf(a.code);
          const idxB = PREFERRED_ORDER.indexOf(b.code);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.code.localeCompare(b.code);
        });

        setShifts(mapped);
      }
    } catch (err) {
      console.warn("Error fetching shifts:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  const handleSaveShift = useCallback(
    async (shift: ManagedShift) => {
      try {
        const isNew = !shift.id || shift.id.startsWith("shift-");

        const normalizeTime = (t?: string | null, fallback = "08:00:00") => {
          if (!t || !t.trim()) return fallback;
          const cleaned = t.trim();
          const parts = cleaned.split(":");
          const h = (parts[0] || "00").padStart(2, "0");
          const m = (parts[1] || "00").padStart(2, "0");
          const s = (parts[2] || "00").slice(0, 2).padStart(2, "0");
          return `${h}:${m}:${s}`;
        };

        const startTime = normalizeTime(shift.time_table?.[0]?.time_in, "08:00:00");
        const endTime = normalizeTime(shift.time_table?.[shift.time_table.length - 1]?.time_out, "17:00:00");
        const isOvernight = shift.is_overnight ?? (startTime > endTime);

        const notesPayload = JSON.stringify({
          code: shift.code,
          time_display: shift.time_display,
          is_overnight: isOvernight,
          total_work_hours: shift.total_work_hours,
          must_mark_check_in: shift.must_mark_check_in,
          must_mark_check_out: shift.must_mark_check_out,
          time_table: shift.time_table,
          remark: shift.remark,
        });

        const dbRecord: Record<string, any> = {
          name: shift.name,
          start_time: startTime,
          end_time: endTime,
          color: shift.color || "#2563EB",
          required_hours: shift.total_work_hours || 8,
          notes: notesPayload,
          shift_date: new Date().toISOString().split("T")[0],
        };

        if (isNew) {
          const { error } = await supabase.from("shifts").insert([dbRecord]);
          if (error) {
            // Try fallback without required_hours if column does not exist
            const fallbackRecord = { ...dbRecord };
            delete fallbackRecord.required_hours;
            const retry = await supabase.from("shifts").insert([fallbackRecord]);
            if (retry.error) throw retry.error;
          }
          toast.success("Shift created in database successfully");
        } else {
          const { error } = await supabase.from("shifts").update(dbRecord).eq("id", shift.id);
          if (error) {
            const fallbackRecord = { ...dbRecord };
            delete fallbackRecord.required_hours;
            const retry = await supabase.from("shifts").update(fallbackRecord).eq("id", shift.id);
            if (retry.error) throw retry.error;
          }
          toast.success("Shift updated in database successfully");
        }

        await fetchShifts();
        setActiveFormShift(null);
      } catch (err: any) {
        console.error("Failed to save shift to database:", err);
        toast.error("Saved locally. Notice: " + (err.message || "Failed to persist to database"));
        // Optimistic local update as fallback
        setShifts((prev) => {
          const idx = prev.findIndex((s) => s.id === shift.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = shift;
            return copy;
          }
          return [shift, ...prev];
        });
        setActiveFormShift(null);
      }
    },
    [fetchShifts]
  );

  const handleDeleteShift = useCallback(
    async (id: string) => {
      if (!confirm("Are you sure you want to delete this shift?")) return;
      try {
        const { error } = await supabase
          .from("shifts")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", id);
        if (error) throw error;
        toast.success("Shift deleted from database");
        await fetchShifts();
      } catch (err: any) {
        console.error("Failed to delete shift:", err);
        toast.error("Failed to delete shift: " + (err.message || "Unknown error"));
        setShifts((prev) => prev.filter((s) => s.id !== id));
      }
    },
    [fetchShifts]
  );

  const handleDuplicateShift = useCallback(
    async (shift: ManagedShift) => {
      try {
        const dupName = `${shift.name} (Copy)`;
        const dupCode = `${shift.code}_COPY`;

        const startTime = shift.time_table?.[0]?.time_in
          ? `${shift.time_table[0].time_in}:00`
          : "08:00:00";
        const endTime = shift.time_table?.[shift.time_table.length - 1]?.time_out
          ? `${shift.time_table[shift.time_table.length - 1].time_out}:00`
          : "17:00:00";

        const notesPayload = JSON.stringify({
          code: dupCode,
          time_display: shift.time_display,
          is_overnight: shift.is_overnight,
          total_work_hours: shift.total_work_hours,
          must_mark_check_in: shift.must_mark_check_in,
          must_mark_check_out: shift.must_mark_check_out,
          time_table: shift.time_table,
          come_earliest: shift.come_earliest,
          come_lates: shift.come_lates,
          leave_earliest: shift.leave_earliest,
          leave_lates: shift.leave_lates,
          remark: shift.remark,
        });

        const { error } = await supabase.from("shifts").insert([
          {
            name: dupName,
            start_time: startTime,
            end_time: endTime,
            color: shift.color || "#2563EB",
            required_hours: shift.total_work_hours || 8,
            notes: notesPayload,
            shift_date: new Date().toISOString().split("T")[0],
          },
        ]);

        if (error) throw error;
        toast.success("Shift duplicated successfully");
        await fetchShifts();
      } catch (err: any) {
        console.error("Failed to duplicate shift:", err);
        toast.error("Failed to duplicate shift: " + (err.message || "Unknown error"));
      }
    },
    [fetchShifts]
  );

  return {
    shifts,
    loading,
    activeFormShift,
    setActiveFormShift,
    handleSaveShift,
    handleDeleteShift,
    handleDuplicateShift,
    reloadShifts: fetchShifts,
  };
}

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee } from "../../types";

interface DisciplinaryItem {
  id: string;
  action_type: string;
  severity: string;
  incident_date: string;
  status: string;
  reason?: string;
  notes?: string;
  created_at: string;
}

interface WarningInfoCardProps {
  employee: Employee;
  onCountLoaded?: (count: number) => void;
}

export const WarningInfoCard: React.FC<WarningInfoCardProps> = ({ employee, onCountLoaded }) => {
  const [warnings, setWarnings] = useState<DisciplinaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const onCountLoadedRef = React.useRef(onCountLoaded);

  useEffect(() => {
    onCountLoadedRef.current = onCountLoaded;
  }, [onCountLoaded]);

  useEffect(() => {
    if (!employee?.id) return;
    let isCancelled = false;

    const fetchWarnings = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("disciplinary_records")
          .select("id, action_type, severity, incident_date, status, reason, notes, created_at")
          .eq("employee_id", employee.id)
          .is("deleted_at", null)
          .order("incident_date", { ascending: false });

        if (isCancelled) return;

        if (!error && data) {
          setWarnings(data as DisciplinaryItem[]);
          onCountLoadedRef.current?.(data.length);
        } else {
          setWarnings([]);
          onCountLoadedRef.current?.(0);
        }
      } catch (err) {
        console.warn("Could not load disciplinary warnings:", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchWarnings();

    return () => {
      isCancelled = true;
    };
  }, [employee.id]);

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
      case "high":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
            <i className="ri-alarm-warning-line text-lg" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Disciplinary &amp; Warning Records</h3>
            <p className="text-xs text-gray-500">Official warnings, corrective actions, and incident inquiries</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-gray-700">
          Total: {warnings.length}
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400">Loading warning history...</div>
      ) : warnings.length === 0 ? (
        <div className="py-8 text-center bg-emerald-50/40 border border-dashed border-emerald-200 rounded-xl">
          <i className="ri-checkbox-circle-line text-3xl text-emerald-500 block mb-1" />
          <span className="text-xs font-bold text-emerald-900">Clean Conduct Record</span>
          <p className="text-[11px] text-emerald-700 mt-0.5">No disciplinary warnings or violations on file for this employee.</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 space-y-3">
          {warnings.map((w) => (
            <div key={w.id} className="pt-3 first:pt-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 capitalize">{w.action_type || "Written Warning"}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${getSeverityBadge(w.severity)}`}>
                      {w.severity?.toUpperCase() || "STANDARD"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{w.reason || w.notes || "Official conduct advisory"}</p>
                </div>
                <div className="text-right whitespace-nowrap">
                  <span className="text-[11px] font-mono text-gray-500 block">
                    {w.incident_date ? new Date(w.incident_date).toLocaleDateString() : "—"}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400 capitalize">{w.status || "Closed"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

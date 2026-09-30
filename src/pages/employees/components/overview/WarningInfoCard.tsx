import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee } from "../../types";
import { EmployeeMovementAttachmentSection } from "./movements/EmployeeMovementAttachmentSection";

interface DisciplinaryItem {
  id: string;
  type?: string;
  warning_type?: string;
  title?: string;
  description?: string;
  severity: string;
  incident_date: string;
  warning_date?: string;
  status: string;
}

interface WarningInfoCardProps {
  employee: Employee;
  onCountLoaded?: (count: number) => void;
}

export const WarningInfoCard: React.FC<WarningInfoCardProps> = ({ employee, onCountLoaded }) => {
  const [warnings, setWarnings] = useState<DisciplinaryItem[]>([]);
  const [, setLoading] = useState(true);
  const onCountLoadedRef = useRef(onCountLoaded);

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
          .select("*")
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
        console.warn("Could not load warnings:", err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchWarnings();
    return () => {
      isCancelled = true;
    };
  }, [employee.id]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-sm sm:rounded-md p-5 sm:p-6 shadow-xs space-y-6">
      {/* Warnings List / Empty State */}
      <div>
        {warnings.length === 0 ? (
          <div className="py-2.5 px-4 bg-gray-50/70 dark:bg-slate-800/40 border border-gray-200/80 dark:border-slate-700/80 rounded text-center text-[13px] text-gray-500 dark:text-slate-400">
            No records found
          </div>
        ) : (
          <div className="space-y-3">
            {warnings.map((w) => (
              <div
                key={w.id}
                className="p-3.5 bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded text-[13px] flex justify-between items-center"
              >
                <div>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">
                    {(w.warning_type || w.type || "Written Warning").replace(/_/g, " ")}
                  </span>
                  <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">
                    {w.description || "Official notice"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-gray-400 block">{w.warning_date || w.incident_date}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 uppercase font-semibold">
                    {w.status || "Active"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Attachment Info Section */}
      <EmployeeMovementAttachmentSection employee={employee} categoryKey="warning" />
    </div>
  );
};

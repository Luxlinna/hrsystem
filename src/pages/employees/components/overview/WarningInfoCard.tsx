import React, { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee } from "../../types";
import { WarningDetailModal } from "@/pages/disciplinary/components/WarningDetailModal";
import type { DisciplinaryRecord } from "@/pages/disciplinary/types";

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
  action_to_take?: string;
  action_taken?: string;
  employee_promise?: string;
  remark?: string;
  notes?: string;
  document_url?: string;
  document_name?: string;
  created_at: string;
}

interface WarningInfoCardProps {
  employee: Employee;
  onCountLoaded?: (count: number) => void;
}

/**
 * Strips HTML tags, decodes common HTML entities, and formats multiline text cleanly.
 * Prevents raw HTML snippet dumps from breaking the UI.
 */
function cleanHtmlText(text?: string | null): string {
  if (!text) return "";
  const withBreaks = text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  const decoded = withBreaks
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&ndash;/gi, "–")
    .replace(/&mdash;/gi, "—");

  const lines = decoded
    .split("\n")
    .map((l) => l.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean);

  return lines.join("\n");
}

export const WarningInfoCard: React.FC<WarningInfoCardProps> = ({ employee, onCountLoaded }) => {
  const [warnings, setWarnings] = useState<DisciplinaryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<DisciplinaryItem | null>(null);
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
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900";
      case "high":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-900";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "voided":
      case "void":
        return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700";
      case "resolved":
      case "closed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900";
      case "in_progress":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900";
      default:
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-100 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-2xs">
            <i className="ri-alarm-warning-line text-xl" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Disciplinary &amp; Warning Records</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Official warnings, corrective actions, and incident inquiries</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-full text-gray-700 dark:text-gray-300">
            Total: {warnings.length} {warnings.length === 1 ? "Record" : "Records"}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
          <i className="ri-loader-4-line text-2xl animate-spin text-[#253C7D]" />
          <span>Loading warning history...</span>
        </div>
      ) : warnings.length === 0 ? (
        <div className="py-10 text-center bg-emerald-50/40 dark:bg-emerald-950/20 border border-dashed border-emerald-200 dark:border-emerald-800 rounded-2xl p-6">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2.5">
            <i className="ri-checkbox-circle-line text-2xl" />
          </div>
          <span className="text-sm font-bold text-emerald-950 dark:text-emerald-300 block">Clean Conduct Record</span>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 max-w-md mx-auto">
            No disciplinary warnings, violations, or corrective actions on file for this employee.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {warnings.map((w) => {
            const warningTypeDisplay = (w.warning_type || w.type || "Written Warning").replace(/_/g, " ");
            const displayDate = w.warning_date || w.incident_date;
            const isVoided =
              w.status?.toLowerCase() === "voided" ||
              w.status?.toLowerCase() === "void" ||
              Boolean(w.remark && w.remark.includes("[VOIDED]"));

            const cleanDescription = cleanHtmlText(w.description);
            const cleanAction = cleanHtmlText(w.action_to_take || w.action_taken);
            const cleanPromise = cleanHtmlText(w.employee_promise);

            return (
              <div
                key={w.id}
                className={`relative rounded-2xl border transition-all p-5 overflow-hidden flex flex-col gap-3.5 shadow-2xs ${
                  isVoided
                    ? "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80"
                    : "bg-white dark:bg-slate-800/80 border-gray-200/90 dark:border-slate-700 hover:shadow-md hover:border-gray-300 dark:hover:border-slate-600"
                }`}
              >
                {/* Left Severity Accent Stripe */}
                <div
                  className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                    isVoided
                      ? "bg-slate-300 dark:bg-slate-600"
                      : w.severity?.toLowerCase() === "critical"
                      ? "bg-rose-600"
                      : w.severity?.toLowerCase() === "high"
                      ? "bg-orange-500"
                      : w.severity?.toLowerCase() === "medium"
                      ? "bg-amber-500"
                      : "bg-blue-500"
                  }`}
                />

                {/* Card Header: Type, Badges & Date */}
                <div className="flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-gray-900 dark:text-white shadow-2xs capitalize">
                      <i className="ri-file-warning-line text-rose-500" />
                      {warningTypeDisplay}
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${getSeverityBadge(
                        w.severity
                      )}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current" />
                      {w.severity?.toUpperCase() || "STANDARD"}
                    </span>

                    {isVoided ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                        <i className="ri-close-circle-line" />
                        Voided
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border capitalize ${getStatusBadge(
                          w.status
                        )}`}
                      >
                        {w.status || "Open"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                      <i className="ri-calendar-line text-gray-400" />
                      {displayDate
                        ? new Date(displayDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "—"}
                    </span>

                    <button
                      type="button"
                      onClick={() => setSelectedRecord(w)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#253C7D] dark:text-indigo-400 bg-blue-50 hover:bg-blue-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-950 border border-blue-200/70 dark:border-indigo-800/60 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      title="View Full Warning Notice"
                    >
                      <i className="ri-eye-line" />
                      <span>Details</span>
                    </button>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                    {w.title || "Official Warning Notice"}
                  </h4>
                </div>

                {/* Cleaned Violation Description */}
                {cleanDescription && (
                  <div className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl p-3.5">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <i className="ri-information-line" />
                      <span>Description of Violation</span>
                    </div>
                    <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed font-['Kantumruy_Pro',sans-serif] whitespace-pre-line">
                      {cleanDescription}
                    </p>
                  </div>
                )}

                {/* Action Required & Employee Promise Grid */}
                {(cleanAction || cleanPromise) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cleanAction && (
                      <div className="rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 p-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 mb-1">
                            <i className="ri-shield-flash-line text-amber-600 dark:text-amber-400 text-sm" />
                            <span>Action to be Taken</span>
                          </div>
                          <p className="text-xs text-amber-950 dark:text-amber-200 font-['Kantumruy_Pro',sans-serif] leading-relaxed whitespace-pre-line">
                            {cleanAction}
                          </p>
                        </div>
                      </div>
                    )}

                    {cleanPromise && (
                      <div className="rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 p-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-1">
                            <i className="ri-hand-heart-line text-emerald-600 dark:text-emerald-400 text-sm" />
                            <span>Employee Commitment / Promise</span>
                          </div>
                          <p className="text-xs text-emerald-950 dark:text-emerald-200 italic font-['Kantumruy_Pro',sans-serif] leading-relaxed whitespace-pre-line">
                            "{cleanPromise}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Attached Document Pill / Card */}
                {w.document_url && (
                  <div className="flex items-center justify-between p-2.5 bg-slate-50/80 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/80 rounded-xl hover:border-blue-300 dark:hover:border-indigo-700 transition-all">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-indigo-950/50 text-[#253C7D] dark:text-indigo-400 border border-blue-100 dark:border-indigo-900 flex items-center justify-center shrink-0">
                        <i className="ri-file-text-line text-base" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                          {w.document_name || "Signed Warning Notice Document"}
                        </p>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500">Official Warning Attachment</span>
                      </div>
                    </div>
                    <a
                      href={w.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#253C7D] dark:text-indigo-400 bg-blue-50 dark:bg-indigo-950/60 hover:bg-blue-100 dark:hover:bg-indigo-950 px-3 py-1.5 rounded-lg transition-colors shrink-0"
                    >
                      <i className="ri-download-2-line" />
                      <span>View File</span>
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Warning Detail Modal */}
      {selectedRecord && (
        <WarningDetailModal
          record={
            {
              ...selectedRecord,
              employee_id: employee.id,
              type: selectedRecord.type || selectedRecord.warning_type || "written_warning",
              severity: (selectedRecord.severity || "medium") as any,
              title: selectedRecord.title || "Warning Notice",
              created_by: "",
              employees: {
                id: employee.id,
                first_name: employee.first_name,
                last_name: employee.last_name,
                department: employee.department || "",
                role: employee.role || "",
                avatar_url: employee.avatar_url || null,
                employee_id: employee.employee_id,
              },
            } as DisciplinaryRecord
          }
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </div>
  );
};

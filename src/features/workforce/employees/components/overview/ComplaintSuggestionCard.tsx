import React, { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee } from "../../types";
import { EmployeeMovementAttachmentSection } from "./movements/EmployeeMovementAttachmentSection";

export interface FeedbackItem {
  id: string;
  type: "complaint" | "suggestion" | "grievance";
  subject: string;
  details: string;
  date: string;
  status: "pending" | "in_review" | "resolved" | "dismissed";
  target_to?: string | null;
  direction?: "receiving" | "issuing";
}

interface ComplaintSuggestionCardProps {
  employee: Employee;
  onCountLoaded?: (count: number) => void;
}

export const ComplaintSuggestionCard: React.FC<ComplaintSuggestionCardProps> = ({
  employee,
  onCountLoaded,
}) => {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [, setLoading] = useState(true);

  const onCountLoadedRef = useRef(onCountLoaded);
  useEffect(() => {
    onCountLoadedRef.current = onCountLoaded;
  }, [onCountLoaded]);

  const loadFeedback = useCallback(async () => {
    if (!employee?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("complaints_suggestions")
        .select("*")
        .eq("employee_id", employee.id)
        .order("entry_date", { ascending: false });

      if (!error && data) {
        const mapped: FeedbackItem[] = data.map((d: any) => ({
          id: d.id,
          type: d.type,
          subject: d.subject,
          details: d.details,
          date: d.entry_date,
          status: d.status,
          target_to: d.target_to,
          direction: d.direction || "receiving",
        }));
        setItems(mapped);
        onCountLoadedRef.current?.(mapped.length);
      }
    } catch (err) {
      console.warn("Could not load complaints/suggestions:", err);
    } finally {
      setLoading(false);
    }
  }, [employee?.id]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const receivingItems = items.filter((i) => i.direction !== "issuing");
  const issuingItems = items.filter((i) => i.direction === "issuing");

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-sm sm:rounded-md p-5 sm:p-6 shadow-xs space-y-6">
      {/* 1. Receiving Complaints/Suggestions */}
      <div>
        <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-3">
          RECEIVING COMPLAINTS/SUGGESTIONS
        </h3>
        {receivingItems.length === 0 ? (
          <div className="py-2.5 px-4 bg-gray-50/70 dark:bg-slate-800/40 border border-gray-200/80 dark:border-slate-700/80 rounded text-center text-[13px] text-gray-500 dark:text-slate-400">
            No records found
          </div>
        ) : (
          <div className="space-y-2">
            {receivingItems.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded text-[13px] flex justify-between"
              >
                <div>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">{item.subject}</span>
                  <p className="text-gray-500 dark:text-slate-400 text-xs mt-0.5">{item.details}</p>
                </div>
                <span className="text-xs text-gray-400">{item.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Issuing Complaints/Suggestions */}
      <div>
        <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-3">
          ISSUING COMPLAINTS/SUGGESTIONS
        </h3>
        {issuingItems.length === 0 ? (
          <div className="py-2.5 px-4 bg-gray-50/70 dark:bg-slate-800/40 border border-gray-200/80 dark:border-slate-700/80 rounded text-center text-[13px] text-gray-500 dark:text-slate-400">
            No records found
          </div>
        ) : (
          <div className="space-y-2">
            {issuingItems.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-gray-50/50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded text-[13px] flex justify-between"
              >
                <div>
                  <span className="font-semibold text-gray-800 dark:text-slate-200">{item.subject}</span>
                  <p className="text-gray-500 dark:text-slate-400 text-[11px] mt-0.5">{item.details}</p>
                </div>
                <span className="text-[11px] text-gray-400">{item.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Attachment Info Section */}
      <EmployeeMovementAttachmentSection employee={employee} categoryKey="complaints" />
    </div>
  );
};

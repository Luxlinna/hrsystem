import React, { useState, useEffect } from "react";
import type { Employee } from "../../types";

export interface FeedbackItem {
  id: string;
  type: "complaint" | "suggestion" | "grievance";
  subject: string;
  details: string;
  date: string;
  status: "pending" | "in_review" | "resolved";
  response?: string;
}

interface ComplaintSuggestionCardProps {
  employee: Employee;
  onCountLoaded?: (count: number) => void;
}

export const ComplaintSuggestionCard: React.FC<ComplaintSuggestionCardProps> = ({
  employee,
  onCountLoaded,
}) => {
  const storageKey = `hrm_feedback_${employee.id}`;
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [formType, setFormType] = useState<"complaint" | "suggestion" | "grievance">("suggestion");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        setItems(parsed);
        onCountLoaded?.(parsed.length);
      } else {
        setItems([]);
        onCountLoaded?.(0);
      }
    } catch {
      setItems([]);
    }
  }, [storageKey, onCountLoaded]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !details.trim()) return;

    const newItem: FeedbackItem = {
      id: `fb_${Date.now()}`,
      type: formType,
      subject: subject.trim(),
      details: details.trim(),
      date: new Date().toISOString(),
      status: "pending",
    };

    const updated = [newItem, ...items];
    setItems(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
    onCountLoaded?.(updated.length);
    setSubject("");
    setDetails("");
    setShowAdd(false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <i className="ri-feedback-line text-lg" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Complaints &amp; Suggestions</h3>
            <p className="text-xs text-gray-500">Workplace grievances, feedback, and process improvement suggestions</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(!showAdd)}
          className="px-3 py-1.5 bg-[#253C7D] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-[#1a2b5a] cursor-pointer"
        >
          <i className={showAdd ? "ri-close-line" : "ri-add-line"} />
          <span>{showAdd ? "Cancel" : "Add Record"}</span>
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-gray-700">Category:</label>
            <div className="flex gap-2">
              {(["suggestion", "complaint", "grievance"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormType(t)}
                  className={`text-xs px-2.5 py-1 rounded-md font-semibold capitalize cursor-pointer ${
                    formType === t ? "bg-purple-600 text-white" : "bg-white border border-gray-300 text-gray-700"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subject / Topic..."
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
          />
          <textarea
            required
            rows={3}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Detailed description, impact, or suggestion..."
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 cursor-pointer"
            >
              Submit Record
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="py-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
          <i className="ri-chat-smile-2-line text-3xl text-gray-400 block mb-1" />
          <span className="text-xs font-bold text-gray-700">No Feedback Logged</span>
          <p className="text-[11px] text-gray-500 mt-0.5">No grievances, complaints, or workplace suggestions logged yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it) => (
            <div key={it.id} className="p-3.5 border border-gray-100 rounded-lg bg-gray-50/60">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{it.subject}</span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">
                      {it.type}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">{it.details}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-gray-400 block">
                    {new Date(it.date).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] font-bold text-amber-600 capitalize">{it.status.replace("_", " ")}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

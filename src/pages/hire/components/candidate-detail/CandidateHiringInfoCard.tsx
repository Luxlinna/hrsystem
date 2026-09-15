import React, { memo, useState, useMemo } from "react";
import type { Candidate } from "../../types";
import { EditHiringInfoModal } from "./EditHiringInfoModal";
import { HiringOrgAndIdentitySection } from "./HiringOrgAndIdentitySection";
import { HiringTermsAndPayrollSection } from "./HiringTermsAndPayrollSection";
import { HiringInfoExportMenu } from "./HiringInfoExportMenu";
import { HiringInfoAttachmentUpload } from "./HiringInfoAttachmentUpload";
import { toast } from "@/components/Toast";

interface CandidateHiringInfoCardProps {
  candidate: Candidate;
  onCandidateUpdated?: (updated: Partial<Candidate>) => void;
}

const HIRING_RECORD_KEYS: (keyof Candidate)[] = [
  "candidate_code", "full_name", "kh_name", "gender", "code_bu",
  "bu_full_name", "handle_bu", "division", "department", "position",
  "working_hour", "total_working_days", "employment_type", "start_date",
  "working_location", "national_id_number", "date_of_birth", "current_address",
  "basic_salary", "tax_method", "allowance", "line_manager", "contract_type",
  "fdc_end_date", "site", "bank_account_number", "nssf_number", "email",
  "phone", "emergency_contact_name", "emergency_phone_number", "hiring_status",
  "marital_status",
];

export const CandidateHiringInfoCard: React.FC<CandidateHiringInfoCardProps> = memo(
  function CandidateHiringInfoCard({ candidate, onCandidateUpdated }) {
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const handleCopy = (text: string | null | undefined, label: string) => {
      if (!text) return;
      navigator.clipboard.writeText(text);
      setCopiedField(label);
      toast("Copied", `${label} copied to clipboard`, "info");
      setTimeout(() => setCopiedField(null), 2000);
    };

    // Calculate completeness of the 33 standard fields
    const { filledCount, totalFields, percent } = useMemo(() => {
      let count = 0;
      HIRING_RECORD_KEYS.forEach((k) => {
        const val = candidate[k];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          count++;
        }
      });

      return {
        filledCount: count,
        totalFields: HIRING_RECORD_KEYS.length,
        percent: Math.round((count / HIRING_RECORD_KEYS.length) * 100),
      };
    }, [candidate]);

    const handleSaved = (updated: Partial<Candidate>) => {
      Object.assign(candidate, updated);
      onCandidateUpdated?.(updated);
    };

    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 sm:p-7 shadow-xs space-y-6">
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="w-2.5 h-2.5 rounded-full bg-[#253C7D]" />
              <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Hiring &amp; Employment Master Information</span>
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-[11px] font-mono font-black">
                33 Standard Fields
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/70 text-emerald-700 text-[11px] font-extrabold flex items-center gap-1">
                <i className="ri-checkbox-circle-line" />
                {filledCount} / {totalFields} Completed ({percent}%)
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Official recruitment master record covering physical site stationing, payroll specifications, and contractual terms.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <HiringInfoExportMenu candidate={candidate} />
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-black transition-all flex items-center gap-1.5 shadow-xs cursor-pointer hover:shadow-md"
            >
              <i className="ri-edit-line text-sm" />
              <span>Edit Hiring Info</span>
            </button>
          </div>
        </div>

        {/* Completeness Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              percent >= 80 ? "bg-emerald-500" : percent >= 50 ? "bg-blue-600" : "bg-amber-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Section 1 & 2: Personal ID & Organizational Structure */}
        <HiringOrgAndIdentitySection
          candidate={candidate}
          copiedField={copiedField}
          onCopy={handleCopy}
        />

        {/* Section 3, 4 & 5: Terms, Payroll & Contacts */}
        <HiringTermsAndPayrollSection
          candidate={candidate}
          copiedField={copiedField}
          onCopy={handleCopy}
        />

        {/* Section 6: File Upload & Attachments */}
        <HiringInfoAttachmentUpload
          candidate={candidate}
          onCandidateUpdated={handleSaved}
        />

        {/* Edit Modal */}
        <EditHiringInfoModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          candidate={candidate}
          onSaved={handleSaved}
        />
      </div>
    );
  }
);

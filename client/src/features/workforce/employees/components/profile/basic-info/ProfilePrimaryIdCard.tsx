import { memo } from "react";
import type { EmployeeIdentificationItem } from "../../../types";

interface Props {
  primaryId: EmployeeIdentificationItem;
  nationalIdNumber?: string | null;
  editing: boolean;
  onUpdate: (field: keyof EmployeeIdentificationItem, val: string) => void;
}

export const ProfilePrimaryIdCard = memo(function ProfilePrimaryIdCard({
  primaryId,
  nationalIdNumber,
  editing,
  onUpdate,
}: Props) {
  return (
    <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
        {editing ? "Primary Identification" : primaryId.identification_type || "National ID"}
      </span>
      {editing ? (
        <div className="space-y-1.5">
          <select
            value={primaryId.identification_type || "National ID Card"}
            onChange={(e) => onUpdate("identification_type", e.target.value)}
            className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-medium focus:outline-none focus:border-[#253C7D] bg-white"
          >
            <option value="National ID Card">National ID Card</option>
            <option value="Passport">Passport</option>
            <option value="Birth Certificate">Birth Certificate</option>
            <option value="Driving License">Driving License</option>
          </select>
          <input
            type="text"
            placeholder="ID Number"
            value={primaryId.identification_number === "—" ? "" : primaryId.identification_number}
            onChange={(e) => onUpdate("identification_number", e.target.value)}
            className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:border-[#253C7D] bg-white"
          />
          <input
            type="date"
            value={primaryId.expiration_date === "—" ? "" : primaryId.expiration_date}
            onChange={(e) => onUpdate("expiration_date", e.target.value)}
            className="w-full px-2 py-1 rounded-lg border border-slate-300 text-[11px] font-mono focus:outline-none focus:border-[#253C7D] bg-white"
          />
        </div>
      ) : (
        <>
          <p className="text-xs font-mono font-black text-slate-900">
            {primaryId.identification_number || nationalIdNumber || "—"}
          </p>
          {primaryId.expiration_date && primaryId.expiration_date !== "—" && (
            <p className="text-[10px] text-slate-500 mt-1">Exp: {primaryId.expiration_date}</p>
          )}
        </>
      )}
    </div>
  );
});

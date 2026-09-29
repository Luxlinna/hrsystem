import { memo } from "react";
import type { Branch } from "../types";

interface BranchCompanyProfileSectionProps {
  branch: Branch;
  canManage: boolean;
  onOpenEditModal: (branch: Branch) => void;
  allowedBranches?: Branch[];
  onSelectBranchId?: (id: string) => void;
  hideHeader?: boolean;
}

function ProfileRow({
  label,
  value,
  isBold = false,
  isLink = false,
  href = "",
}: {
  label: string;
  value: React.ReactNode;
  isBold?: boolean;
  isLink?: boolean;
  href?: string;
}) {
  return (
    <div className="flex items-baseline py-1.5 text-[13.5px] leading-relaxed">
      <div className="w-52 sm:w-60 shrink-0 text-slate-500 font-normal">
        {label}
      </div>
      <div className={`flex-1 min-h-[1.4rem] text-slate-800 ${isBold ? "font-semibold text-slate-900 text-[14px]" : ""}`}>
        {isLink && href && value ? (
          <a
            href={href.startsWith("http") ? href : `https://${href}`}
            target="_blank"
            rel="noreferrer"
            className="text-[#0088cc] hover:underline"
          >
            {value}
          </a>
        ) : (
          value ?? ""
        )}
      </div>
    </div>
  );
}

export const BranchCompanyProfileSection = memo(function BranchCompanyProfileSection({
  branch,
  canManage,
  onOpenEditModal,
  allowedBranches = [],
  onSelectBranchId,
  hideHeader = false,
}: BranchCompanyProfileSectionProps) {
  const companyName = branch.company_name || branch.name || "";
  const physicalAddr = branch.physical_address || branch.location || "";
  const physicalCity = branch.physical_city || "";
  const physicalProvince = branch.physical_province || "";
  const physicalPostalCode = branch.physical_postal_code || "";
  const physicalCountry = branch.physical_country || "";

  const mailingAddr = branch.mailing_address || "";
  const mailingCity = branch.mailing_city || "";
  const mailingProvince = branch.mailing_province || "";
  const mailingPostalCode = branch.mailing_postal_code || "";
  const mailingCountry = branch.mailing_country || "";

  return (
    <div className="bg-white">
      {/* Top Header matching reference screenshot */}
      {!hideHeader && (
        <div className="flex items-center justify-between px-6 sm:px-8 py-3.5 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-3">
            <h2 className="text-[16px] font-normal text-slate-800 tracking-tight">
              Company Profile
            </h2>

            {/* BU Switcher dropdown for Super Admins */}
            {allowedBranches.length > 1 && onSelectBranchId && (
              <select
                value={branch.id}
                onChange={(e) => onSelectBranchId(e.target.value)}
                className="text-xs font-semibold px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 text-slate-700 cursor-pointer focus:outline-none focus:border-[#0088cc]"
              >
                {allowedBranches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {canManage && (
            <button
              type="button"
              onClick={() => onOpenEditModal(branch)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0088cc] hover:bg-[#0077b3] text-white text-[12.5px] font-medium rounded shadow-2xs transition-colors cursor-pointer"
            >
              <i className="ri-edit-box-line text-sm" />
              Edit Company Profile
            </button>
          )}
        </div>
      )}

      <div className="p-6 sm:p-8 space-y-7">
        {/* 1. COMPANY INFO */}
        <div>
          <h3 className="text-[11.5px] font-bold text-[#0088cc] uppercase tracking-wider mb-2.5">
            Company Info
          </h3>

          <div className="space-y-0.5">
            {/* Logo */}
            <div className="flex items-center py-2 text-[13.5px]">
              <div className="w-52 sm:w-60 shrink-0 text-slate-500 font-normal">
                Logo
              </div>
              <div className="flex-1 min-h-[3rem] flex items-center">
                {branch.logo_url ? (
                  <img
                    src={branch.logo_url}
                    alt={companyName || "Logo"}
                    className="max-h-20 max-w-[260px] object-contain"
                  />
                ) : canManage ? (
                  <button
                    type="button"
                    onClick={() => onOpenEditModal(branch)}
                    className="text-[12.5px] text-[#0088cc] hover:underline cursor-pointer flex items-center gap-1.5"
                  >
                    <i className="ri-image-add-line text-base" />
                    Upload Logo
                  </button>
                ) : (
                  <span className="text-slate-400 text-[11px] italic">No logo</span>
                )}
              </div>
            </div>

            <ProfileRow label="Company Name" value={companyName} isBold />
            <ProfileRow label="Registration No." value={branch.registration_no} />
            <ProfileRow label="VAT No." value={branch.vat_no} />
            <ProfileRow label="Industry" value={branch.industry} />
            <ProfileRow label="Corarl Domain" value={branch.domain} />
            <ProfileRow label="Currency" value={branch.currency || "USD"} />
            <ProfileRow label="Rounding Digit" value={branch.rounding_digit ?? 2} />
          </div>
        </div>

        {/* 2. PHYSICAL ADDRESS INFO */}
        <div>
          <h3 className="text-[11.5px] font-bold text-[#0088cc] uppercase tracking-wider mb-2.5">
            Physical Address Info
          </h3>

          <div className="space-y-0.5">
            <ProfileRow label="Address" value={physicalAddr} />
            <ProfileRow label="City" value={physicalCity} />
            <ProfileRow label="Province" value={physicalProvince} />
            <ProfileRow label="Postal Code" value={physicalPostalCode} />
            <ProfileRow label="Country" value={physicalCountry} />
          </div>
        </div>

        {/* 3. MAILING ADDRESS INFO */}
        <div>
          <h3 className="text-[11.5px] font-bold text-[#0088cc] uppercase tracking-wider mb-2.5">
            Mailing Address Info
          </h3>

          <div className="space-y-0.5">
            <ProfileRow label="Address" value={mailingAddr} />
            <ProfileRow label="City" value={mailingCity} />
            <ProfileRow label="Province" value={mailingProvince} />
            <ProfileRow label="Postal Code" value={mailingPostalCode} />
            <ProfileRow label="Country" value={mailingCountry} />
          </div>
        </div>

        {/* 4. CONTACT INFO */}
        <div>
          <h3 className="text-[11.5px] font-bold text-[#0088cc] uppercase tracking-wider mb-2.5">
            Contact Info
          </h3>

          <div className="space-y-0.5">
            <ProfileRow label="Phone Number" value={branch.phone_number} />
            <ProfileRow label="Email" value={branch.email} />
            <ProfileRow
              label="Website"
              value={branch.website}
              isLink={Boolean(branch.website)}
              href={branch.website || ""}
            />
          </div>
        </div>

        {/* 5. TIMEZONE INFO */}
        <div>
          <h3 className="text-[11.5px] font-bold text-[#0088cc] uppercase tracking-wider mb-2.5">
            Timezone Info
          </h3>

          <div className="space-y-0.5">
            <ProfileRow label="Time Zone" value={branch.time_zone || "SE Asia Standard Time"} />
          </div>
        </div>

        {/* 6. LEGAL INFO */}
        <div>
          <h3 className="text-[11.5px] font-bold text-[#0088cc] uppercase tracking-wider mb-2.5">
            Legal Info
          </h3>

          <div className="space-y-0.5">
            <ProfileRow label="Tax Number" value={branch.legal_tax_number} />
            <ProfileRow label="Legal Name" value={branch.legal_name} />
            <ProfileRow label="Business Activity" value={branch.legal_business_activity} />
            <ProfileRow label="Address" value={branch.legal_address} />
            <ProfileRow label="Phone Number" value={branch.legal_phone_number} />
            <ProfileRow label="Email" value={branch.legal_email} />
          </div>
        </div>
      </div>
    </div>
  );
});

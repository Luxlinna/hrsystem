import React from "react";
import type { Branch } from "../../types";
import { formatLegalAddressDisplay } from "../../utils/legalAddressUtils";

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
    <div className="flex flex-col sm:flex-row sm:items-baseline py-1.5 text-[13.5px] leading-relaxed gap-0.5 sm:gap-2">
      <div className="w-full sm:w-56 lg:w-60 shrink-0 text-slate-500 font-normal text-[13px] sm:text-[13.5px]">
        {label}
      </div>
      <div
        className={`flex-1 min-h-[1.25rem] text-slate-800 dark:text-slate-200 break-words ${
          isBold ? "font-semibold text-slate-900 dark:text-slate-100 text-[14px]" : ""
        }`}
      >
        {isLink && href && value ? (
          <a
            href={href.startsWith("http") ? href : `https://${href}`}
            target="_blank"
            rel="noreferrer"
            className="text-[#0088cc] hover:underline break-all"
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

export function ProfileViewRows({
  branch,
  canManage,
  onOpenEdit,
}: {
  branch: Branch;
  canManage: boolean;
  onOpenEdit: () => void;
}) {
  const companyName = branch.company_name || branch.name || "";
  const physicalAddr = branch.physical_address || branch.location || "";

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-7">
      {/* 1. COMPANY INFO */}
      <div>
        <h3 className="text-[11.5px] font-bold text-[#0088cc] uppercase tracking-wider mb-2.5">
          Company Info
        </h3>
        <div className="space-y-1 sm:space-y-0.5">
          <div className="flex flex-col sm:flex-row sm:items-center py-2.5 text-[13.5px] gap-1 sm:gap-2">
            <div className="w-full sm:w-56 lg:w-60 shrink-0 text-slate-500 font-normal text-[13px] sm:text-[13.5px]">
              Logo
            </div>
            <div className="flex-1 min-h-[4.5rem] sm:min-h-[6rem] flex items-center">
              {branch.logo_url ? (
                <img
                  src={branch.logo_url}
                  alt={companyName || "Logo"}
                  className="h-20 sm:h-24 md:h-28 max-w-full sm:max-w-[360px] object-contain rounded-md"
                />
              ) : canManage ? (
                <button
                  type="button"
                  onClick={onOpenEdit}
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
          <ProfileRow label="BU Manager" value={branch.manager_name} />
          <ProfileRow
            label="Status"
            value={
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                  branch.status === "active"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : branch.status === "inactive"
                    ? "bg-slate-100 text-slate-600 border border-slate-200"
                    : "bg-amber-50 text-amber-700 border border-amber-200"
                }`}
              >
                {branch.status || "active"}
              </span>
            }
          />
          <ProfileRow label="Registration No." value={branch.registration_no} />
          <ProfileRow label="VAT No." value={branch.vat_no} />
          <ProfileRow label="Industry" value={branch.industry} />
          <ProfileRow label="Currency" value={branch.currency || "USD"} />
          <ProfileRow label="Rounding Digit" value={branch.rounding_digit ?? 2} />
          <ProfileRow
            label="Biometric Machines"
            value={
              branch.is_biometrics_enabled ? (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <i className="ri-fingerprint-line text-xs" /> Enabled (ZKTeco Active)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                  <i className="ri-fingerprint-line text-xs" /> Disabled (Not configured)
                </span>
              )
            }
          />
        </div>
      </div>

      {/* 2. PHYSICAL ADDRESS INFO */}
      <div>
        <h3 className="text-[11.5px] font-bold text-[#0088cc] uppercase tracking-wider mb-2.5">
          Physical Address Info
        </h3>
        <div className="space-y-1 sm:space-y-0.5">
          <ProfileRow label="Address" value={physicalAddr} />
          <ProfileRow label="City" value={branch.physical_city} />
          <ProfileRow label="Province" value={branch.physical_province} />
          <ProfileRow label="Postal Code" value={branch.physical_postal_code} />
          <ProfileRow label="Country" value={branch.physical_country} />
          {branch.latitude != null && branch.longitude != null && (
            <ProfileRow
              label="GPS & Geofence"
              value={`${branch.latitude}, ${branch.longitude} (${branch.geofence_radius_m || 100}m radius)`}
            />
          )}
        </div>
      </div>

      {/* 3. CONTACT INFO */}
      <div>
        <h3 className="text-[11.5px] font-bold text-[#0088cc] uppercase tracking-wider mb-2.5">
          Contact Info
        </h3>
        <div className="space-y-1 sm:space-y-0.5">
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

      {/* 4. LEGAL INFO */}
      <div>
        <h3 className="text-[11.5px] font-bold text-[#0088cc] uppercase tracking-wider mb-2.5">
          Legal Info
        </h3>
        <div className="space-y-1 sm:space-y-0.5">
          <ProfileRow label="Tax Number" value={branch.legal_tax_number} />
          <ProfileRow label="Legal Name" value={branch.legal_name} />
          <ProfileRow label="Business Activity" value={branch.legal_business_activity} />
          <ProfileRow label="Address" value={formatLegalAddressDisplay(branch.legal_address)} />
          <ProfileRow label="Phone Number" value={branch.legal_phone_number} />
          <ProfileRow label="Email" value={branch.legal_email} />
        </div>
      </div>
    </div>
  );
}

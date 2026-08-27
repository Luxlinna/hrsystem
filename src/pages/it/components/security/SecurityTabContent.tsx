import { memo } from "react";

export const SecurityTabContent = memo(function SecurityTabContent() {
  const securitySafeguards = [
    {
      title: "Role-Based Access Control (RBAC)",
      desc: "Granular permission sets mapped across 8 distinct enterprise organizational tiers.",
      status: "Enforced",
      icon: "ri-lock-password-line",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Encrypted Storage (AES-256)",
      desc: "All payroll records, contracts, and identity documents encrypted at rest and in transit.",
      status: "Compliant",
      icon: "ri-shield-keyhole-line",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Real-time Audit Trail Logging",
      desc: "Every write, update, delete, and credential change logged with actor signature & timestamp.",
      status: "Active",
      icon: "ri-history-line",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      title: "Database Row-Level Security (RLS)",
      desc: "Supabase PostgreSQL multi-tenant isolation enforced directly on database schemas.",
      status: "Operational",
      icon: "ri-database-2-line",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Security Posture Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-lg mb-4">
            <i className="ri-shield-check-line" />
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Security Posture Score
          </span>
          <p className="text-3xl font-black text-emerald-600 mt-1">98.4%</p>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            Enterprise infrastructure and data protection policies verified.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-lg mb-4">
            <i className="ri-fingerprint-line" />
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Access Controls
          </span>
          <p className="text-3xl font-black text-[#253C7D] mt-1">Tier-Based</p>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            Strict role permissions applied to all company records and routes.
          </p>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
          <div className="w-10 h-10 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-lg mb-4">
            <i className="ri-server-line" />
          </div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
            Endpoint Compliance
          </span>
          <p className="text-3xl font-black text-violet-700 mt-1">100%</p>
          <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
            All registered hardware assets mapped to active employee accounts.
          </p>
        </div>
      </div>

      {/* Safeguards List */}
      <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
        <h3 className="text-sm font-extrabold text-gray-900 mb-4">
          Enterprise Security Safeguards & Policies
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {securitySafeguards.map((s) => (
            <div
              key={s.title}
              className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 flex items-start gap-3.5"
            >
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200/80 text-[#253C7D] flex items-center justify-center text-base shrink-0 shadow-2xs">
                <i className={s.icon} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-extrabold text-xs text-gray-900">{s.title}</h4>
                  <span
                    className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border shrink-0 ${s.color}`}
                  >
                    {s.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

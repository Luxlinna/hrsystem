import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { PERMISSION_COLUMNS } from "../constants";
import type { AppRole } from "../types";

export function PermissionsSection() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  useEffect(() => {
    supabase
      .from("app_roles")
      .select("id, name, is_admin, allowed_modules")
      .order("id")
      .then(({ data }) => {
        setRoles(data || []);
        setLoadingRoles(false);
      });
  }, []);

  if (loadingRoles) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <div className="w-4 h-4 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px]">Loading roles...</span>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <p className="text-[13px] text-gray-400">
        No roles defined yet. Create roles from the{" "}
        <Link to="/admin" className="text-[#253C7D] font-semibold hover:underline">
          Admin Portal
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="border border-gray-100 rounded-xl overflow-x-auto">
      <div className="min-w-[500px]">
        <div className="grid grid-cols-5 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          <span>Role</span>
          {PERMISSION_COLUMNS.map((c) => (
            <span key={c.key}>{c.label}</span>
          ))}
        </div>
        {roles.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-5 px-5 py-4 border-t border-gray-50 items-center"
          >
            <span className="text-[13px] font-medium text-gray-900">
              {r.name}
            </span>
            {PERMISSION_COLUMNS.map((c) => (
              <span key={c.key} className="text-[13px] text-gray-600">
                {r.is_admin || r.allowed_modules.includes("*")
                  ? "Full"
                  : r.allowed_modules.includes(c.key)
                    ? "Access"
                    : "None"}
              </span>
            ))}
          </div>
        ))}
      </div>
      <div className="px-5 py-3 border-t border-gray-50 bg-gray-50/50">
        <Link
          to="/admin"
          className="text-[12px] text-[#253C7D] font-semibold hover:underline"
        >
          Manage roles in Admin Portal →
        </Link>
      </div>
    </div>
  );
}

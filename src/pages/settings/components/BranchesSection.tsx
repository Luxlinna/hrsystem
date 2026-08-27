import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import type { Branch } from "../types";

export function BranchesSection() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  useEffect(() => {
    supabase
      .from("branches")
      .select("id, name, location, employee_count, status")
      .order("name")
      .then(({ data }) => {
        setBranches(data || []);
        setLoadingBranches(false);
      });
  }, []);

  if (loadingBranches) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <div className="w-4 h-4 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
        <span className="text-[13px]">Loading branches...</span>
      </div>
    );
  }

  const activeBranches = branches.filter((b) => b.status === "active");
  const totalEmployees = branches.reduce(
    (sum, b) => sum + (b.employee_count || 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-gray-500">
            <strong className="text-gray-900">{activeBranches.length}</strong>{" "}
            active &middot; {totalEmployees.toLocaleString()} total employees
          </span>
        </div>
        <Link
          to="/branches"
          className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors whitespace-nowrap"
        >
          Manage in Branch Module
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {branches.map((b) => (
          <div
            key={b.id}
            className="border border-gray-100 rounded-xl p-5 flex items-start justify-between hover:border-[#253C7D]/20 transition-colors"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#253C7D]/10 flex items-center justify-center shrink-0 mt-0.5">
                <i className="ri-building-line text-[#253C7D] text-sm w-5 h-5 flex items-center justify-center" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-gray-900">
                  {b.name}
                </p>
                <p className="text-[12px] text-gray-500">{b.location}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[11px] text-gray-400">
                    {b.employee_count || 0} employees
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      b.status === "active"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
              </div>
            </div>
            <Link
              to="/branches"
              className="px-3 py-1.5 border border-gray-200 text-gray-700 text-[11px] font-medium rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap shrink-0"
            >
              View
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

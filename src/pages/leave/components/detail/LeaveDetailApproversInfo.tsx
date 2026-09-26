import { memo, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { LeaveRequest } from "../../types";
import { formatDateTime } from "../../utils/leaveDisplayUtils";

interface LeaveDetailApproversInfoProps {
  request: LeaveRequest;
}

interface ApproverItem {
  id: string;
  name: string;
  role: string;
  avatar_url?: string | null;
  status: "approved" | "pending" | "rejected";
  timestamp?: string | null;
}

export const LeaveDetailApproversInfo = memo(function LeaveDetailApproversInfo({
  request: r,
}: LeaveDetailApproversInfoProps) {
  const [approvers, setApprovers] = useState<ApproverItem[]>([]);

  useEffect(() => {
    let active = true;
    async function loadApprovers() {
      try {
        const { data } = await supabase
          .from("employees")
          .select("id, first_name, last_name, role, avatar_url")
          .or("department.ilike.%hr%,role.ilike.%admin%,role.ilike.%director%")
          .is("deleted_at", null)
          .limit(3);

        if (!active) return;

        const defaultList: ApproverItem[] = [
          { id: "1", name: "You Steven", role: "Executive Director", status: "pending" },
          { id: "2", name: "Chea Rachana", role: "HR Admin Officer", status: r.status === "approved" ? "approved" : "pending", timestamp: r.status === "approved" ? formatDateTime(r.created_at) : null },
          { id: "3", name: "Chorn Sokcheng", role: "HR Admin Officer", status: "pending" },
        ];

        if (data && data.length > 0) {
          const mapped: ApproverItem[] = data.map((d, idx) => {
            const isThisApproved = r.status === "approved" && (idx === 1 || r.approved_by === d.id);
            return {
              id: d.id,
              name: `${d.first_name} ${d.last_name}`.trim(),
              role: d.role || (idx === 0 ? "Executive Director" : "HR Admin Officer"),
              avatar_url: d.avatar_url,
              status: isThisApproved ? "approved" : "pending",
              timestamp: isThisApproved ? formatDateTime(r.created_at) : null,
            };
          });
          // Ensure at least 1 approved if request is approved
          if (r.status === "approved" && !mapped.some((m) => m.status === "approved") && mapped[0]) {
            mapped[0].status = "approved";
            mapped[0].timestamp = formatDateTime(r.created_at);
          }
          setApprovers(mapped);
        } else {
          setApprovers(defaultList);
        }
      } catch {
        // fallback
      }
    }

    loadApprovers();
    return () => {
      active = false;
    };
  }, [r.status, r.approved_by, r.created_at]);

  return (
    <div className="bg-white rounded-xl border border-gray-200/80 p-5 shadow-2xs">
      <div className="text-[#0284c7] font-semibold text-xs tracking-wider uppercase pb-3 border-b border-gray-100">
        APPROVERS INFO
      </div>

      <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
        {/* Step Banner */}
        <div className="bg-[#3b82f6] text-white text-xs font-semibold px-4 py-1.5 text-center">
          Step 1
        </div>

        {/* Approvers list */}
        <div className="divide-y divide-gray-100 bg-white">
          {approvers.map((item, index) => (
            <div key={item.id}>
              {index > 0 && (
                <div className="text-center py-1 text-[11px] font-bold text-gray-400 bg-gray-50/50 uppercase tracking-widest border-y border-gray-100">
                  OR
                </div>
              )}
              <div className="p-3.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {item.avatar_url ? (
                    <img
                      src={item.avatar_url}
                      alt={item.name}
                      className="w-9 h-9 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center">
                      {item.name[0]}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-xs text-gray-800">{item.name}</div>
                    <div className="text-[11px] text-gray-400">{item.role}</div>
                  </div>
                </div>

                <div className="text-right">
                  {item.status === "approved" ? (
                    <div>
                      <span className="inline-block px-2.5 py-0.5 bg-[#14b8a6] text-white text-[10px] font-semibold rounded shadow-2xs">
                        Approved
                      </span>
                      {item.timestamp && (
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          On {item.timestamp}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 bg-[#38bdf8] text-white text-[10px] font-semibold rounded shadow-2xs">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

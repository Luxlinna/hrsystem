import { memo, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { LeaveRequest } from "../../types";

interface LeaveDetailStatCardsProps {
  request: LeaveRequest;
}

export const LeaveDetailStatCards = memo(function LeaveDetailStatCards({
  request,
}: LeaveDetailStatCardsProps) {
  const [stats, setStats] = useState({
    entitlement: 18,
    used: 0,
    available: 18,
  });

  useEffect(() => {
    let isMounted = true;
    async function loadEmployeeLeaveStats() {
      try {
        const { data: emp } = await supabase
          .from("employees")
          .select("annual_leave_days")
          .eq("id", request.employee_id)
          .maybeSingle();

        const { data: allReqs } = await supabase
          .from("leave_requests")
          .select("days, status, leave_type")
          .eq("employee_id", request.employee_id)
          .is("deleted_at", null);

        if (!isMounted) return;

        const totalEntitlement =
          emp?.annual_leave_days !== null && emp?.annual_leave_days !== undefined
            ? Number(emp.annual_leave_days)
            : 18;

        const totalUsed = (allReqs || [])
          .filter((r) => r.status === "approved")
          .reduce((sum, r) => sum + (Number(r.days) || 0), 0);

        const available = Math.max(0, totalEntitlement - totalUsed);

        setStats({
          entitlement: totalEntitlement,
          used: totalUsed,
          available: available,
        });
      } catch {
        // fallback to standard display
      }
    }

    if (request.employee_id) {
      loadEmployeeLeaveStats();
    }
    return () => {
      isMounted = false;
    };
  }, [request.employee_id, request.status, request.days]);

  return (
    <div className="space-y-2.5 sm:space-y-3">
      {/* 1. Full-Width Pink / Coral Entitlement Card */}
      <div className="bg-gradient-to-r from-[#fb7185] via-[#f43f5e] to-[#e11d48] rounded-2xl p-3.5 sm:p-4 text-white shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white text-base shrink-0 shadow-2xs">
            <i className="ri-calendar-event-fill" />
          </div>
          <span className="text-xs sm:text-[13px] font-bold text-white/95 truncate">
            Total Entitlement
          </span>
        </div>
        <span className="text-2xl sm:text-3xl font-black tracking-tight text-white shrink-0">
          {stats.entitlement}
        </span>
      </div>

      {/* 2. Row of 2 Cards: Leave Used & Leave Available */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* Purple Card: Leave Used */}
        <div className="bg-gradient-to-br from-[#a855f7] via-[#9333ea] to-[#7e22ce] rounded-2xl p-3 sm:p-3.5 text-white shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white text-sm shrink-0 shadow-2xs">
              <i className="ri-download-2-fill" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-white/95 truncate">
              Leave Used
            </span>
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white shrink-0">
            {stats.used}
          </span>
        </div>

        {/* Teal / Cyan Card: Leave Available */}
        <div className="bg-gradient-to-br from-[#22d3ee] via-[#06b6d4] to-[#0891b2] rounded-2xl p-3 sm:p-3.5 text-white shadow-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white text-sm shrink-0 shadow-2xs">
              <i className="ri-checkbox-circle-fill" />
            </div>
            <span className="text-[11px] sm:text-xs font-bold text-white/95 truncate">
              Leave Available
            </span>
          </div>
          <span className="text-xl sm:text-2xl font-black tracking-tight text-white shrink-0">
            {stats.available}
          </span>
        </div>
      </div>
    </div>
  );
});

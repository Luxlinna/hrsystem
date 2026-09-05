import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { todayYMD } from "@/lib/date";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { applyUserEmployeeFilter } from "@/lib/phoneUtils";

interface MyEmployee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  avatar_url: string | null;
  branches: { name: string } | null;
}

const QUICK_ACTIONS = [
  { label: "Log Attendance", icon: "ri-fingerprint-line", note: "Check in / out", color: "bg-emerald-500", path: "/self-service?tab=checkin" },
  { label: "Submit Leave", icon: "ri-calendar-event-line", note: "Request time off", color: "bg-amber-500", path: "/self-service?tab=leave" },
  { label: "Tasks & Activity", icon: "ri-task-line", note: "View tasks", color: "bg-[#253C7D]", path: "/tasks" },
];

export default function SelfServiceHome() {
  const { user } = useAuth();
  const { can } = usePermissions();
  const [me, setMe] = useState<MyEmployee | null>(null);
  const [loading, setLoading] = useState(true);
  const [myLeave, setMyLeave] = useState<any[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<any | null>(null);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      const empQuery = applyUserEmployeeFilter(
        supabase
          .from("employees")
          .select("id, first_name, last_name, role, department, avatar_url, branches(name)"),
        user.email
      );
      const { data: emp } = await empQuery.maybeSingle();

      const myEmp = emp as unknown as MyEmployee | null;
      setMe(myEmp);

      const today = todayYMD();
      const [leaveRes, attRes, annRes, notifRes] = await Promise.all([
        myEmp ? supabase.from("leave_requests").select("id, leave_type, start_date, end_date, status").eq("employee_id", myEmp.id).order("created_at", { ascending: false }).limit(5) : Promise.resolve({ data: [] }),
        myEmp ? supabase.from("attendance_records").select("status").eq("employee_id", myEmp.id).eq("date", today).maybeSingle() : Promise.resolve({ data: null }),
        can("announcements") ? supabase.from("announcements").select("id, title, content").is("deleted_at", null).order("pinned", { ascending: false }).order("published_at", { ascending: false }).limit(3) : Promise.resolve({ data: [] }),
        can("notifications") ? supabase.from("notifications").select("id", { count: "exact", head: true }).or(`recipient_user_id.is.null,recipient_user_id.eq.${user.id}`).or(`branch_id.is.null,branch_id.eq.${(myEmp as any)?.branch_id}`).eq("is_read", false) : Promise.resolve({ count: 0 }),
      ]);

      setMyLeave((leaveRes as any).data || []);
      setTodayAttendance((attRes as any).data || null);
      setAnnouncements((annRes as any).data || []);
      setUnreadCount((notifRes as any).count || 0);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email, can]);

  const displayName = me ? `${me.first_name} ${me.last_name}` : (user?.user_metadata?.display_name as string) || user?.email?.split("@")[0] || "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F8F7]">
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-[#253C7D] via-[#29ABE2] to-[#74C8EC] text-white">
        <div className="px-6 lg:px-10 pt-10 pb-16">
          <p className="text-white/70 text-sm">{greeting},</p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight mt-1">{displayName}</h1>
          {me && (
            <p className="text-white/80 text-sm mt-3">{me.role} &middot; {me.department} &middot; {me.branches?.name || "HQ"}</p>
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-6 lg:px-10 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.label}
              to={action.path}
              className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#253C7D]/20 hover:shadow-sm transition-all flex items-center gap-4"
            >
              <div className={`w-11 h-11 rounded-xl ${action.color} flex items-center justify-center shrink-0`}>
                <i className={`${action.icon} text-white text-lg`} />
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-gray-900">{action.label}</p>
                <p className="text-[11px] text-gray-500">{action.note}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* My Status Cards */}
      <section className="px-6 lg:px-10 py-10 md:py-14">
        <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] mb-6">My Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <i className="ri-fingerprint-line text-[#253C7D] text-xl mb-3 block w-8 h-8 flex items-center justify-center" />
            <p className="text-lg font-bold text-gray-900 capitalize">{todayAttendance?.status || "Not checked in"}</p>
            <p className="text-[11px] text-gray-500 mt-1">Today's Attendance</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <i className="ri-calendar-event-line text-amber-600 text-xl mb-3 block w-8 h-8 flex items-center justify-center" />
            <p className="text-lg font-bold text-gray-900">{myLeave.filter((l) => l.status === "pending").length}</p>
            <p className="text-[11px] text-gray-500 mt-1">Pending Leave Requests</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <i className="ri-notification-3-line text-rose-600 text-xl mb-3 block w-8 h-8 flex items-center justify-center" />
            <p className="text-lg font-bold text-gray-900">{unreadCount}</p>
            <p className="text-[11px] text-gray-500 mt-1">Unread Notifications</p>
          </div>
        </div>
      </section>

      {/* My Leave Requests */}
      {myLeave.length > 0 && (
        <section className="px-6 lg:px-10 pb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1A1A1A]">My Leave Requests</h2>
            <Link to="/self-service?tab=leave" className="text-xs text-[#253C7D] font-bold hover:underline">
              View All
            </Link>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {myLeave.map((l) => (
              <div key={l.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900 capitalize">{l.leave_type} Leave</p>
                  <p className="text-xs text-gray-400 mt-0.5">{l.start_date} to {l.end_date}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${
                  l.status === "approved" ? "bg-emerald-50 text-emerald-700" :
                  l.status === "rejected" ? "bg-rose-50 text-rose-700" :
                  "bg-amber-50 text-amber-700"
                }`}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="px-6 lg:px-10 pb-14">
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">Announcements</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {announcements.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl p-5 border border-gray-100">
                <h3 className="text-sm font-bold text-gray-900 line-clamp-1">{a.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{a.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

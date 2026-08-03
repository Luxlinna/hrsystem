import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { toast } from "@/components/Toast";

interface MyEmployee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  status: string;
  join_date: string;
  phone: string | null;
  reports_to: string | null;
  branches: { name: string } | null;
}

interface DirectReport {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url: string | null;
}

export default function Profile() {
  const { user, updateProfile, updatePassword } = useAuth();
  const { role, loading: roleLoading, can } = usePermissions();

  const [displayName, setDisplayName] = useState((user?.user_metadata?.display_name as string) || "");
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [employee, setEmployee] = useState<MyEmployee | null>(null);
  const [employeeLoading, setEmployeeLoading] = useState(true);
  const [managerName, setManagerName] = useState<string | null>(null);
  const [directReports, setDirectReports] = useState<DirectReport[]>([]);
  const [phone, setPhone] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const initials = (displayName || user?.email || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!user?.email) return;
    (async () => {
      const { data: emp } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, status, join_date, phone, reports_to, branches(name)")
        .eq("email", user.email)
        .maybeSingle();
      const myEmp = emp as unknown as MyEmployee | null;
      setEmployee(myEmp);
      setPhone(myEmp?.phone || "");

      if (myEmp?.reports_to) {
        const { data: mgr } = await supabase
          .from("employees")
          .select("first_name, last_name")
          .eq("id", myEmp.reports_to)
          .maybeSingle();
        if (mgr) setManagerName(`${mgr.first_name} ${mgr.last_name}`);
      }

      if (myEmp?.id) {
        const { data: reports } = await supabase
          .from("employees")
          .select("id, first_name, last_name, role, avatar_url")
          .eq("reports_to", myEmp.id)
          .order("first_name");
        setDirectReports((reports as DirectReport[]) || []);
      }

      setEmployeeLoading(false);
    })();
  }, [user?.email]);

  const tenure = employee?.join_date
    ? Math.floor((Date.now() - new Date(employee.join_date).getTime()) / (365.25 * 86400000))
    : null;

  const statusStyles: Record<string, string> = {
    active: "bg-emerald-50 text-emerald-700",
    on_leave: "bg-amber-50 text-amber-700",
    inactive: "bg-gray-100 text-gray-500",
    suspended: "bg-red-50 text-red-700",
    onboarding: "bg-violet-50 text-violet-700",
  };

  const handleSavePhone = async () => {
    if (!employee) return;
    setSavingPhone(true);
    const { error } = await supabase.from("employees").update({ phone: phone.trim() || null }).eq("id", employee.id);
    setSavingPhone(false);
    if (error) { toast("Failed", error.message || "Could not update phone number.", "error"); return; }
    setEmployee((prev) => (prev ? { ...prev, phone: phone.trim() || null } : prev));
    toast("Saved", "Your phone number has been updated.", "success");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await updateProfile({ avatar_url: `${data.publicUrl}?t=${Date.now()}` });
      toast("Photo updated", "Your profile photo has been changed.", "success");
    } catch (err: any) {
      toast("Upload failed", err.message || "Could not upload photo.", "error");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) { toast("Name required", "Display name can't be empty.", "error"); return; }
    setSavingName(true);
    try {
      await updateProfile({ display_name: displayName.trim() });
      toast("Saved", "Your name has been updated.", "success");
    } catch (err: any) {
      toast("Failed", err.message || "Could not update name.", "error");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) { toast("Too short", "Password must be at least 8 characters.", "error"); return; }
    if (newPassword !== confirmPassword) { toast("Mismatch", "Passwords don't match.", "error"); return; }
    setSavingPassword(true);
    try {
      await updatePassword(newPassword);
      setNewPassword("");
      setConfirmPassword("");
      toast("Password changed", "Your password has been updated.", "success");
    } catch (err: any) {
      toast("Failed", err.message || "Could not change password.", "error");
    } finally {
      setSavingPassword(false);
    }
  };

  const fmtDateTime = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">My Profile</h1>
        <p className="text-[13px] text-gray-500 mt-1">Manage your personal account details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 max-w-5xl">
        {/* ── LEFT: account (editable) ── */}
        <div className="lg:col-span-2 space-y-10">
          {/* Avatar + name */}
          <div className="flex items-center gap-5">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-20 h-20 rounded-2xl object-cover border border-gray-100" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] text-xl font-bold">
                  {initials}
                </div>
              )}
              <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-[#253C7D] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#1F336A] transition-colors">
                <i className="ri-camera-line text-white text-xs" />
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">{displayName || user?.email}</p>
              <p className="text-[12px] text-gray-500">{user?.email}</p>
              {uploadingAvatar && <p className="text-[11px] text-[#253C7D] mt-1">Uploading photo...</p>}
            </div>
          </div>

          {/* Display name */}
          <div>
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">Display Name</label>
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
              />
              <button
                onClick={handleSaveName}
                disabled={savingName}
                className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {savingName ? "Saving..." : "Save"}
              </button>
            </div>
          </div>

          {/* Email — read only */}
          <div>
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">Email Address</label>
            <div className="mt-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-500">
              {user?.email}
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">Contact an admin to change the email on your account.</p>
          </div>

          {/* Phone — editable, stored on the HR employee record */}
          {employee && (
            <div>
              <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">Phone Number</label>
              <div className="flex gap-2 mt-1">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
                />
                <button
                  onClick={handleSavePhone}
                  disabled={savingPhone}
                  className="px-4 py-2 bg-[#253C7D] text-white text-[12px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
                >
                  {savingPhone ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          )}

          {/* Password change */}
          <div className="pt-6 border-t border-gray-100">
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">Change Password</label>
            <div className="space-y-3 mt-2 max-w-sm">
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
              />
              <button
                onClick={handleChangePassword}
                disabled={savingPassword || !newPassword}
                className="px-5 py-2.5 bg-[#253C7D] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-40 whitespace-nowrap"
              >
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: work info (read only) ── */}
        <div className="space-y-8">
          {/* Role */}
          <div>
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">Role</label>
            <div className="mt-1.5">
              {roleLoading ? (
                <p className="text-[13px] text-gray-400">Loading...</p>
              ) : role ? (
                <span
                  className="inline-flex items-center text-[12px] font-semibold px-3 py-1.5 rounded-full text-white"
                  style={{ backgroundColor: role.color }}
                >
                  {role.name}
                </span>
              ) : (
                <p className="text-[13px] text-gray-400">No role assigned yet — contact an admin.</p>
              )}
              <p className="text-[11px] text-gray-400 mt-2">
                Only a Super Admin can change your role, from the Admin Portal.
              </p>
            </div>
          </div>

          {/* Job details */}
          <div>
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">Job Details</label>
            {employeeLoading ? (
              <p className="text-[13px] text-gray-400 mt-1.5">Loading...</p>
            ) : employee ? (
              <div className="mt-2 border border-gray-100 rounded-xl divide-y divide-gray-50">
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12px] text-gray-500">Job Title</span>
                  <span className="text-[13px] font-medium text-gray-900 text-right">{employee.role || "—"}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12px] text-gray-500">Department</span>
                  <span className="text-[13px] font-medium text-gray-900 text-right">{employee.department || "—"}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12px] text-gray-500">Branch</span>
                  <span className="text-[13px] font-medium text-gray-900 text-right">{employee.branches?.name || "—"}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12px] text-gray-500">Status</span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyles[employee.status] || "bg-gray-100 text-gray-500"}`}>
                    {employee.status.replace("_", " ")}
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-[12px] text-gray-500">Joined</span>
                  <span className="text-[13px] font-medium text-gray-900 text-right">
                    {new Date(employee.join_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {tenure !== null && <span className="text-gray-400"> &middot; {tenure} yr{tenure !== 1 ? "s" : ""}</span>}
                  </span>
                </div>
                {managerName && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-[12px] text-gray-500">Reports To</span>
                    <span className="text-[13px] font-medium text-gray-900 text-right">{managerName}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-[13px] text-gray-400 mt-1.5">
                We couldn't find an employee record matching your account email ({user?.email}).
              </p>
            )}
          </div>

          {/* Account activity */}
          <div>
            <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">Account Activity</label>
            <div className="mt-2 border border-gray-100 rounded-xl divide-y divide-gray-50">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[12px] text-gray-500">Member Since</span>
                <span className="text-[13px] font-medium text-gray-900 text-right">{fmtDateTime(user?.created_at)}</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-[12px] text-gray-500">Last Sign-in</span>
                <span className="text-[13px] font-medium text-gray-900 text-right">{fmtDateTime(user?.last_sign_in_at)}</span>
              </div>
            </div>
          </div>

          {/* Direct reports */}
          {directReports.length > 0 && (
            <div>
              <label className="text-[12px] font-semibold text-gray-700 uppercase tracking-wider">
                Direct Reports ({directReports.length})
              </label>
              <div className="mt-2 border border-gray-100 rounded-xl divide-y divide-gray-50">
                {directReports.map((r) => {
                  const rInitials = `${r.first_name[0]}${r.last_name[0]}`.toUpperCase();
                  const content = (
                    <div className="flex items-center gap-3 px-4 py-3">
                      {r.avatar_url ? (
                        <img src={r.avatar_url} alt={r.first_name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] text-[11px] font-bold shrink-0">
                          {rInitials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-gray-900 truncate">{r.first_name} {r.last_name}</p>
                        <p className="text-[11px] text-gray-500 truncate">{r.role}</p>
                      </div>
                    </div>
                  );
                  return can("employees") ? (
                    <Link key={r.id} to={`/employees/${r.id}`} className="block hover:bg-gray-50 transition-colors">{content}</Link>
                  ) : (
                    <div key={r.id}>{content}</div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

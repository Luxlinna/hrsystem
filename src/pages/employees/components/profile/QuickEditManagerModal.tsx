import { memo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { Employee, ReportEntry } from "../../types";

interface QuickEditManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  manager: ReportEntry | null;
  allEmployees: any[];
  onSuccess: () => void;
}

export const QuickEditManagerModal = memo(function QuickEditManagerModal({
  isOpen,
  onClose,
  employee,
  manager,
  allEmployees,
  onSuccess,
}: QuickEditManagerModalProps) {
  const { user } = useAuth();
  const { role } = usePermissions();
  const [selectedManagerId, setSelectedManagerId] = useState<string>(
    employee.reports_to || manager?.id || ""
  );
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  if (!isOpen) return null;

  const eligibleManagers = allEmployees.filter(
    (e) => e.id !== employee.id &&
      (`${e.first_name || ""} ${e.last_name || ""} ${e.role || ""}`.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      const newManagerId = selectedManagerId || null;
      const chosen = allEmployees.find((e) => e.id === newManagerId);
      const managerName = chosen ? `${chosen.first_name} ${chosen.last_name}`.trim() : null;

      const { error } = await supabase
        .from("employees")
        .update({
          reports_to: newManagerId,
          line_manager: managerName,
        })
        .eq("id", employee.id);

      if (error) throw error;

      logActivity({
        module: "employees",
        action: "updated",
        entityType: "employee",
        entityId: employee.id,
        actorName: (user?.user_metadata?.display_name as string) || user?.email || "Unknown",
        actorRole: role?.name || "Admin",
        description: `Updated Line Manager for ${employee.first_name} ${employee.last_name} to "${managerName || "None"}"`,
      });

      toast("Line Manager Updated", `Direct manager set to ${managerName || "None"}`, "success");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast("Update Failed", err.message || "Could not update line manager", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#253C7D] flex items-center justify-center text-lg shadow-2xs">
              <i className="ri-user-star-line" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900">
                Edit Line Manager
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                Reporting line for {employee.first_name} {employee.last_name} • <span className="font-bold text-[#253C7D]">{employee.bu_full_name || employee.branches?.name || "Their BU"}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 cursor-pointer"
          >
            <i className="ri-close-line text-lg" />
          </button>
        </div>

        <div className="space-y-4 my-4">
          {/* Quick Search */}
          <div>
            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
              Search Managers
            </label>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by name or role..."
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          </div>

          {/* Select dropdown */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Select Direct Supervisor
              </label>
              <span className="text-[10px] font-bold text-[#253C7D]">
                {allEmployees.length} in this BU
              </span>
            </div>
            <select
              value={selectedManagerId}
              onChange={(e) => setSelectedManagerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D]"
            >
              <option value="">No manager (Reports directly to BU / Executive)</option>
              {eligibleManagers.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name} — {e.userRole || e.role || "Manager"} {e.department ? `(${e.department})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-[11px] text-blue-800 flex items-start gap-2">
            <i className="ri-information-line text-sm shrink-0 mt-0.5" />
            <span>
              This manager will receive and endorse <strong>Step 1 Leave Requests</strong> submitted by {employee.first_name}.
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={handleSave}
            className="px-5 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Line Manager"}
          </button>
        </div>
      </div>
    </div>
  );
});

import { useState } from "react";
import { useBranchScope } from "@/context/BranchContext";
import { CreateLeaveForm } from "@/pages/leave/components/form/CreateLeaveForm";
import { INITIAL_LEAVE_FORM } from "@/pages/leave/constants";
import { useSelfServiceLeave } from "../hooks/useSelfServiceLeave";
import { LeaveStatsCards } from "./leave/LeaveStatsCards";
import { LeaveRequestsList } from "./leave/LeaveRequestsList";
import type { Employee } from "@/pages/leave/types";

interface Props {
  employeeId: string;
  employee?: Employee | null;
}

export default function LeaveTab({ employeeId, employee }: Props) {
  const [showForm, setShowForm] = useState(false);
  const { isSuperAdmin, isBranchAdmin } = useBranchScope();

  const {
    requests,
    loading,
    submitting,
    toast,
    formData,
    setFormData,
    currentEmployee,
    allEmployees,
    myApproverName,
    hrApprovers,
    getLeaveTypeStats,
    handleSubmit,
    stats,
  } = useSelfServiceLeave({
    employeeId,
    initialEmployee: employee,
    isSuperAdmin,
    isBranchAdmin,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-7 h-7 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // When form is active, render the same comprehensive CreateLeaveForm from the Leave page
  if (showForm) {
    return (
      <div className="space-y-6">
        {toast && (
          <div
            className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-extrabold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-150 ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : toast.type === "error"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-slate-50 text-slate-800 border-slate-200"
            }`}
          >
            <i
              className={`text-sm ${
                toast.type === "success"
                  ? "ri-checkbox-circle-fill text-emerald-600"
                  : toast.type === "error"
                  ? "ri-error-warning-fill text-rose-600"
                  : "ri-information-fill text-slate-600"
              }`}
            />
            <span>{toast.message}</span>
          </div>
        )}

        <CreateLeaveForm
          onBack={() => {
            setShowForm(false);
            setFormData({ ...INITIAL_LEAVE_FORM, employee_id: employeeId });
          }}
          employees={allEmployees}
          myEmployee={currentEmployee}
          formData={formData}
          setFormData={setFormData}
          submitting={submitting}
          canManage={false}
          isSuperAdmin={isSuperAdmin}
          isBranchAdmin={isBranchAdmin}
          isDirectHrApproval={isSuperAdmin || isBranchAdmin}
          myApproverName={myApproverName}
          hrApprovers={hrApprovers}
          getLeaveTypeStats={getLeaveTypeStats}
          onSubmit={(e) => handleSubmit(e, () => setShowForm(false))}
          formMode="self"
          isEmbedded={true}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-extrabold flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-150 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : toast.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-slate-50 text-slate-800 border-slate-200"
          }`}
        >
          <i
            className={`text-sm ${
              toast.type === "success"
                ? "ri-checkbox-circle-fill text-emerald-600"
                : toast.type === "error"
                ? "ri-error-warning-fill text-rose-600"
                : "ri-information-fill text-slate-600"
            }`}
          />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Stats row & New Request action */}
      <LeaveStatsCards
        remainingDays={stats.remainingDays}
        totalRequests={stats.totalRequests}
        totalApproved={stats.totalApproved}
        totalPending={stats.totalPending}
        onNewRequest={() => {
          setFormData({ ...INITIAL_LEAVE_FORM, employee_id: employeeId });
          setShowForm(true);
        }}
      />

      {/* Leave Requests History List */}
      <LeaveRequestsList requests={requests} />
    </div>
  );
}
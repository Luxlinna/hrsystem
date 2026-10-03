import { memo, useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import type { HiringRequest } from "../../types";
import { HiringRequestCard } from "./HiringRequestCard";
import { HiringRequestsHeader } from "./HiringRequestsHeader";
import { exportRequestsPDF } from "../../exports/exportRequestsPDF";
import { ExportHiringRequestModal } from "../modals/ExportHiringRequestModal";

interface HiringRequestsTabProps {
  requests: HiringRequest[];
  canRequest: boolean;
  canApprove: boolean;
  canBranchApprove?: boolean;
  canHrReview?: boolean;
  canHrAdminApprove?: boolean;
  canChairmanApprove?: boolean;
  isHrDivisionBranch?: boolean;
  userBranchId?: string | null;
  isChairman: boolean;
  isSuperAdmin?: boolean;
  isAdmin?: boolean;
  actorName?: string;
  actorEmail?: string;
  myEmployeeId?: string;
  onOpenCreate: () => void;
  onOpenDecision: (req: HiringRequest, action: "approved" | "rejected") => void;
  onDeleteRequest?: (id: string) => void;
  onAssignHrOfficer?: (requestId: string, hrId: string | null, hrName: string | null) => void;
}

export const HiringRequestsTab = memo(function HiringRequestsTab({
  requests,
  canRequest,
  canApprove,
  canBranchApprove = false,
  canHrReview = false,
  canHrAdminApprove = false,
  canChairmanApprove = false,
  isHrDivisionBranch = false,
  userBranchId = null,
  isChairman,
  isSuperAdmin = false,
  isAdmin = false,
  actorName,
  actorEmail,
  myEmployeeId,
  onOpenCreate,
  onOpenDecision,
  onDeleteRequest,
  onAssignHrOfficer,
}: HiringRequestsTabProps) {
  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [buFilter, setBuFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [exportReq, setExportReq] = useState<HiringRequest | null>(null);
  const [exportMode, setExportMode] = useState<"full_requisition" | "job_description">("full_requisition");

  const businessUnits = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      const bu = r.branches?.name || r.business_unit;
      if (bu) set.add(bu);
    });
    return Array.from(set).sort();
  }, [requests]);

  useEffect(() => {
    if (highlightId) {
      const el = document.getElementById(`hiring-req-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [highlightId, requests]);

  const stats = useMemo(() => {
    return {
      total: requests.length,
      pendingBranch: requests.filter((r) => !r.status || r.status === "pending" || r.status === "pending_branch_review").length,
      pendingHr: requests.filter((r) => r.status === "pending_hr_review").length,
      pendingHrAdmin: requests.filter((r) => r.status === "pending_hr_admin_review").length,
      pendingChairman: requests.filter((r) => r.status === "pending_chairman_review").length,
      approved: requests.filter((r) => r.status === "approved").length,
    };
  }, [requests]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      if (statusFilter !== "all") {
        if (statusFilter === "pending") {
          if (r.status !== "pending" && r.status !== "pending_branch_review" && r.status !== undefined) return false;
        } else if (r.status !== statusFilter) {
          return false;
        }
      }
      if (buFilter !== "all") {
        const bu = r.branches?.name || r.business_unit || "";
        if (bu !== buFilter) {
          return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const title = (r.title || "").toLowerCase();
        const dept = (r.department || "").toLowerCase();
        const branch = (r.branches?.name || "").toLowerCase();
        const reqBy = (r.requested_by_name || "").toLowerCase();
        if (!title.includes(q) && !dept.includes(q) && !branch.includes(q) && !reqBy.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [requests, statusFilter, buFilter, search]);

  return (
    <div className="space-y-6">
      <HiringRequestsHeader
        isChairman={isChairman}
        canRequest={canRequest}
        onOpenCreate={onOpenCreate}
        stats={stats}
      />

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search requisitions by role, department, branch, requester..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50/80 rounded-xl text-xs text-gray-800 placeholder-gray-400 border border-gray-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {businessUnits.length > 0 && (
            <select
              value={buFilter}
              onChange={(e) => setBuFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50/80 rounded-xl text-xs font-semibold text-gray-700 border border-gray-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all cursor-pointer"
            >
              <option value="all">All Business Units ({businessUnits.length})</option>
              {businessUnits.map((bu) => (
                <option key={bu} value={bu}>
                  BU: {bu}
                </option>
              ))}
            </select>
          )}

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50/80 rounded-xl text-xs font-semibold text-gray-700 border border-gray-200/80 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all cursor-pointer"
          >
            <option value="all">All Requisition Statuses ({stats.total})</option>
            <option value="pending">Stage 1: Branch Endorsement ({stats.pendingBranch})</option>
            <option value="pending_hr_review">Stage 2: HR Manager Review ({stats.pendingHr})</option>
            <option value="pending_hr_admin_review">Stage 3: HR Admin Director Approval ({stats.pendingHrAdmin})</option>
            <option value="pending_chairman_review">Stage 4: Chairwoman Authorization ({stats.pendingChairman})</option>
            <option value="approved">Fully Approved & Job Live ({stats.approved})</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            type="button"
            onClick={() =>
              exportRequestsPDF(
                filtered,
                buFilter !== "all" ? `Requisitions Summary — BU: ${buFilter}` : "Enterprise Requisitions Summary"
              )
            }
            title="Export filtered list of requisitions as PDF"
            className="px-3 py-2 bg-white hover:bg-blue-50 text-[#253C7D] font-bold text-xs rounded-xl border border-blue-200 hover:border-[#253C7D] transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs shrink-0"
          >
            <i className="ri-file-pdf-2-line text-rose-600 text-sm" />
            <span>Export List PDF</span>
          </button>
        </div>
      </div>

      {/* Requisitions List */}
      <div className="space-y-4">
        {filtered.map((r) => (
          <HiringRequestCard
            key={r.id}
            request={r}
            canApprove={canApprove}
            canBranchApprove={canBranchApprove}
            canHrReview={canHrReview}
            canHrAdminApprove={canHrAdminApprove}
            canChairmanApprove={canChairmanApprove}
            isHrDivisionBranch={isHrDivisionBranch}
            userBranchId={userBranchId}
            isSuperAdmin={isSuperAdmin}
            isAdmin={isAdmin}
            actorName={actorName}
            actorEmail={actorEmail}
            myEmployeeId={myEmployeeId}
            onOpenDecision={onOpenDecision}
            onDelete={onDeleteRequest}
            onOpenExport={(req, mode) => {
              setExportReq(req);
              setExportMode(mode || "full_requisition");
            }}
          />
        ))}

        {filtered.length === 0 && (
          <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center text-gray-400">
            <i className="ri-file-list-3-line text-4xl mb-2 block text-gray-300" />
            <p className="text-sm font-bold text-gray-700">No hiring requisitions found</p>
            <p className="text-xs text-gray-400 mt-1">There are no employee requests matching your filter criteria.</p>
          </div>
        )}
      </div>

      <ExportHiringRequestModal
        isOpen={Boolean(exportReq)}
        request={exportReq}
        mode={exportMode}
        onClose={() => setExportReq(null)}
      />
    </div>
  );
});

import { memo, useState, useMemo, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { HiringRequest } from "../../types";
import { HiringRequestCard } from "./HiringRequestCard";
import { HiringRequestsHeader } from "./HiringRequestsHeader";
import { HiringRequestsFilterBar } from "./HiringRequestsFilterBar";
import { ExportHiringRequestModal } from "../modals/ExportHiringRequestModal";

const STATUS_ORDER = ["all", "pending", "pending_hr_review", "pending_hr_admin_review", "pending_chairman_review", "approved"];

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
  const [slideDir, setSlideDir] = useState<"right" | "left" | null>(null);
  const [buFilter, setBuFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [exportReq, setExportReq] = useState<HiringRequest | null>(null);
  const [exportMode, setExportMode] = useState<"full_requisition" | "job_description">("full_requisition");

  const handleStatusFilterChange = useCallback((nextStatus: string) => {
    const prevIdx = STATUS_ORDER.indexOf(statusFilter);
    const nextIdx = STATUS_ORDER.indexOf(nextStatus);
    setSlideDir(nextIdx >= prevIdx ? "right" : "left");
    setStatusFilter(nextStatus);
  }, [statusFilter]);

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

  const animClass = slideDir === "right" ? "animate-cover-slide-right" : slideDir === "left" ? "animate-cover-slide-left" : "";

  return (
    <div className="space-y-6">
      <HiringRequestsHeader
        isChairman={isChairman}
        canRequest={canRequest}
        onOpenCreate={onOpenCreate}
        stats={stats}
      />

      <HiringRequestsFilterBar
        stats={stats}
        statusFilter={statusFilter}
        setStatusFilter={handleStatusFilterChange}
        search={search}
        setSearch={setSearch}
        buFilter={buFilter}
        setBuFilter={setBuFilter}
        businessUnits={businessUnits}
        filtered={filtered}
      />

      {/* Requisitions List Stage */}
      <div className="relative w-full overflow-hidden">
        <div key={`${statusFilter}-${slideDir || "init"}`} className={`space-y-4 ${animClass}`}>
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

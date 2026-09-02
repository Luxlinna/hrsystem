import { useState, useCallback } from "react";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import type { StationeryItem, StationeryRequest, StationeryRequestFormState } from "../../types";
import { INITIAL_STATIONERY_REQUEST_FORM } from "../../constants";

interface UseStationeryRequestMutationsProps {
  items: StationeryItem[];
  setItems: React.Dispatch<React.SetStateAction<StationeryItem[]>>;
  requests: StationeryRequest[];
  setRequests: React.Dispatch<React.SetStateAction<StationeryRequest[]>>;
  actorName: string;
  actorRole: string;
  targetBranch: string | null;
}

export function useStationeryRequestMutations({
  items,
  setItems,
  requests,
  setRequests,
  actorName,
  actorRole,
  targetBranch,
}: UseStationeryRequestMutationsProps) {
  const [requestModal, setRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState<StationeryRequestFormState>(INITIAL_STATIONERY_REQUEST_FORM);

  const handleOpenNewRequest = useCallback((preselectedItemId?: string) => {
    const targetItem = items.find((i) => i.id === preselectedItemId) || items[0];
    setRequestForm({
      item_id: targetItem ? targetItem.id : "",
      requested_by_name: actorName,
      department: "Operations",
      quantity: 1,
      purpose: "",
      urgency: "normal",
      branch_id: targetBranch || "",
    });
    setRequestModal(true);
  }, [items, actorName, targetBranch]);

  const handleSubmitRequest = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const item = items.find((i) => i.id === requestForm.item_id);
    if (!item) {
      toast("Error", "Please select a valid stationery item.", "error");
      return;
    }
    if (requestForm.quantity <= 0) {
      toast("Error", "Quantity must be at least 1.", "error");
      return;
    }

    const newReq: StationeryRequest = {
      id: `req-${Date.now()}`,
      item_id: item.id,
      item_name: item.name,
      requested_by_name: requestForm.requested_by_name.trim() || actorName,
      department: requestForm.department.trim() || "General",
      quantity: Number(requestForm.quantity) || 1,
      purpose: requestForm.purpose.trim() || null,
      status: "pending",
      urgency: requestForm.urgency,
      branch_id: requestForm.branch_id || targetBranch || null,
      created_at: new Date().toISOString(),
    };

    setRequests((prev) => [newReq, ...prev]);
    toast("Requisition Submitted", `Requested ${newReq.quantity}x ${newReq.item_name}.`, "success");
    logActivity({
      module: "it",
      action: "created",
      entityType: "stationery_request",
      entityId: newReq.id,
      actorName,
      actorRole,
      description: `Submitted requisition for ${newReq.quantity}x ${newReq.item_name}`,
      metadata: { item: newReq.item_name, quantity: newReq.quantity, requester: newReq.requested_by_name },
    });
    setRequestModal(false);
  }, [items, requestForm, actorName, actorRole, targetBranch, setRequests]);

  const handleApproveRequest = useCallback(async (req: StationeryRequest) => {
    const updated: StationeryRequest = {
      ...req,
      status: "approved",
      approved_by: `${actorName} (${actorRole})`,
      approved_at: new Date().toISOString(),
    };
    setRequests((prev) => prev.map((r) => (r.id === req.id ? updated : r)));
    toast("Request Approved", `Requisition for ${req.item_name} approved. Ready to disburse.`, "success");
    logActivity({
      module: "it",
      action: "approved",
      entityType: "stationery_request",
      entityId: req.id,
      actorName,
      actorRole,
      description: `Approved requisition for ${req.item_name}`,
      metadata: { item: req.item_name, approved_by: actorName },
    });
  }, [actorName, actorRole, setRequests]);

  const handleIssueRequest = useCallback(async (req: StationeryRequest) => {
    const targetItem = items.find((i) => i.id === req.item_id);
    if (!targetItem) {
      toast("Error", "Item no longer exists in inventory.", "error");
      return;
    }
    if (targetItem.stock_quantity < req.quantity) {
      toast("Insufficient Stock", `Only ${targetItem.stock_quantity} available in stock. Cannot disburse ${req.quantity}.`, "error");
      return;
    }

    const newQty = targetItem.stock_quantity - req.quantity;
    setItems((prev) =>
      prev.map((i) => (i.id === targetItem.id ? { ...i, stock_quantity: newQty, updated_at: new Date().toISOString() } : i))
    );

    const updated: StationeryRequest = {
      ...req,
      status: "issued",
      approved_by: req.approved_by || `${actorName} (${actorRole})`,
      approved_at: req.approved_at || new Date().toISOString(),
    };
    setRequests((prev) => prev.map((r) => (r.id === req.id ? updated : r)));

    toast("Items Disbursed", `${req.quantity}x ${req.item_name} issued to ${req.requested_by_name}. Stock deducted.`, "success");
    logActivity({
      module: "it",
      action: "processed",
      entityType: "stationery_request",
      entityId: req.id,
      actorName,
      actorRole,
      description: `Issued ${req.quantity}x ${req.item_name} to ${req.requested_by_name}`,
      metadata: { item: req.item_name, quantity: req.quantity, remaining_stock: newQty, issued_to: req.requested_by_name },
    });
  }, [items, actorName, actorRole, setItems, setRequests]);

  const handleRejectRequest = useCallback(async (req: StationeryRequest) => {
    const reason = window.prompt("Reason for declining this requisition:");
    if (reason === null) return;

    const updated: StationeryRequest = {
      ...req,
      status: "rejected",
      approved_by: `${actorName} (${actorRole})`,
      approved_at: new Date().toISOString(),
      rejection_reason: reason.trim() || "Declined by administrator",
    };
    setRequests((prev) => prev.map((r) => (r.id === req.id ? updated : r)));
    toast("Request Declined", `Requisition for ${req.item_name} declined.`, "info");
    logActivity({
      module: "it",
      action: "rejected",
      entityType: "stationery_request",
      entityId: req.id,
      actorName,
      actorRole,
      description: `Rejected requisition for ${req.item_name}: ${updated.rejection_reason}`,
      metadata: { item: req.item_name, reason: updated.rejection_reason },
    });
  }, [actorName, actorRole, setRequests]);

  return {
    requestModal,
    setRequestModal,
    requestForm,
    setRequestForm,
    handleOpenNewRequest,
    handleSubmitRequest,
    handleApproveRequest,
    handleIssueRequest,
    handleRejectRequest,
  };
}

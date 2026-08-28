import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import type { ITTicket } from "../types";
import { useITData } from "./useITData";
import { useITFilters } from "./useITFilters";
import { useAssetMutations } from "./useAssetMutations";
import { useTicketMutations } from "./useTicketMutations";

export function useITManagement() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const actorRole = role?.name || "Unknown";
  const canManage = isAdmin || (!!role && role.name !== "Chairman");

  const [selectedTicket, setSelectedTicket] = useState<ITTicket | null>(null);

  // 1. Real-time data
  const data = useITData();

  // 2. Filters & metrics
  const filters = useITFilters(data.assets, data.tickets, setSelectedTicket);

  // 3. Asset mutations
  const assetMutations = useAssetMutations({
    canManage: canManage && !data.isPartnerBranchBlocked,
    actorName,
    actorRole,
    targetBranch: data.targetBranch,
    loadData: data.loadData,
  });

  // 4. Ticket mutations
  const ticketMutations = useTicketMutations({
    tickets: data.tickets,
    setTickets: data.setTickets,
    selectedTicket,
    setSelectedTicket,
    actorName,
    actorRole,
    targetBranch: data.targetBranch,
    loadData: data.loadData,
  });

  return {
    user,
    role,
    isAdmin,
    canManage: canManage && !data.isPartnerBranchBlocked,
    actorName,
    selectedTicket,
    setSelectedTicket,
    ...data,
    ...filters,
    ...assetMutations,
    ...ticketMutations,
  };
}

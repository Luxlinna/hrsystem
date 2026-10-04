import { useStationeryState } from "./stationery/useStationeryState";
import { useStationeryFilters } from "./stationery/useStationeryFilters";
import { useStationeryItemMutations } from "./stationery/useStationeryItemMutations";
import { useStationeryRequestMutations } from "./stationery/useStationeryRequestMutations";

interface UseStationeryDataProps {
  canManage: boolean;
  actorName: string;
  actorRole: string;
  targetBranch: string | null;
}

export function useStationeryData({
  canManage,
  actorName,
  actorRole,
  targetBranch,
}: UseStationeryDataProps) {
  // 1. Storage & State
  const { items, setItems, requests, setRequests } = useStationeryState();

  // 2. Filters & KPIs
  const filters = useStationeryFilters(items, requests, targetBranch);

  // 3. Item & Restock Mutations
  const itemMutations = useStationeryItemMutations({
    items,
    setItems,
    actorName,
    actorRole,
    targetBranch,
  });

  // 4. Requisition Requests Mutations
  const requestMutations = useStationeryRequestMutations({
    items,
    setItems,
    requests,
    setRequests,
    actorName,
    actorRole,
    targetBranch,
  });

  return {
    items,
    requests,
    ...filters,
    ...itemMutations,
    ...requestMutations,
  };
}

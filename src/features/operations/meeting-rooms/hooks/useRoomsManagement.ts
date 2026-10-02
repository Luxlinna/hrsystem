import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { MeetingRoom } from "../types";
import { ROOM_FLOORS, ROOM_AMENITIES, DEFAULT_AMENITIES } from "../constants";

interface UseRoomsManagementParams {
  isPartnerBranchBlocked: boolean;
  targetBranch: string;
  canViewCrossBranch: boolean;
}

export function useRoomsManagement({
  isPartnerBranchBlocked,
  targetBranch,
  canViewCrossBranch,
}: UseRoomsManagementParams) {
  const [rooms, setRooms] = useState<MeetingRoom[]>([]);

  const loadRooms = useCallback(async () => {
    if (isPartnerBranchBlocked) {
      setRooms([]);
      return;
    }

    const { data, error } = await supabase
      .from("meeting_rooms")
      .select("id, name, capacity, color, floor, branch_id, deleted_at, amenities, branches(id, name)")
      .is("deleted_at", null)
      .order("capacity");

    if (error) {
      console.error("Failed to load rooms:", error);
      return;
    }

    // Rooms belonging to this branch or shared company rooms (branch_id null),
    // or all rooms when in cross-branch HR Division scope
    const roomsToEnrich = (data || []).filter((r: any) => {
      if (canViewCrossBranch || !targetBranch) {
        return true;
      }
      return !r.branch_id || r.branch_id === targetBranch;
    });

    const enrichedRooms: MeetingRoom[] = roomsToEnrich.map((r: any) => {
      const floor = r.floor || ROOM_FLOORS[r.name] || (r.name.toLowerCase().includes("vip") ? 5 : 3);
      const amenities = Array.isArray(r.amenities) && r.amenities.length > 0
        ? r.amenities
        : ROOM_AMENITIES[r.name] || DEFAULT_AMENITIES;

      return {
        ...r,
        floor,
        amenities,
        branch_name: r.branches?.name || undefined,
      };
    });

    setRooms(enrichedRooms);
  }, [isPartnerBranchBlocked, targetBranch, canViewCrossBranch]);

  const deleteRoom = useCallback(
    async (roomId: string, roomName: string) => {
      if (!confirm(`Are you sure you want to remove room "${roomName}"?`)) return false;
      try {
        const { error } = await supabase
          .from("meeting_rooms")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", roomId);

        if (error) throw error;
        await loadRooms();
        return true;
      } catch (err: any) {
        console.error("Failed to delete room:", err);
        return false;
      }
    },
    [loadRooms]
  );

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  return {
    rooms,
    loadRooms,
    deleteRoom,
  };
}

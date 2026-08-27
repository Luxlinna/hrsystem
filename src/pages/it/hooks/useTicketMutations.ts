import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";
import type { ITTicket, TicketFormState } from "../types";
import { TICKET_STATUS_CONFIG, INITIAL_TICKET_FORM } from "../constants";

interface UseTicketMutationsProps {
  tickets: ITTicket[];
  setTickets: React.Dispatch<React.SetStateAction<ITTicket[]>>;
  selectedTicket: ITTicket | null;
  setSelectedTicket: React.Dispatch<React.SetStateAction<ITTicket | null>>;
  actorName: string;
  actorRole: string;
  loadData: () => Promise<void>;
}

export function useTicketMutations({
  tickets,
  setTickets,
  selectedTicket,
  setSelectedTicket,
  actorName,
  actorRole,
  loadData,
}: UseTicketMutationsProps) {
  const [ticketModal, setTicketModal] = useState(false);
  const [savingTicket, setSavingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState<TicketFormState>(INITIAL_TICKET_FORM);

  const handleCreateTicket = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!ticketForm.title || !ticketForm.requester_name || savingTicket) return;
      setSavingTicket(true);

      const { data, error } = await supabase
        .from("it_tickets")
        .insert([
          {
            title: ticketForm.title,
            requester_name: ticketForm.requester_name,
            priority: ticketForm.priority,
            category: ticketForm.category,
            description: ticketForm.description || null,
            status: "open",
          },
        ])
        .select()
        .single();

      setSavingTicket(false);
      if (error || !data) {
        toast("Error", "Failed to create ticket", "error");
        return;
      }

      setTicketModal(false);
      setTicketForm({
        ...INITIAL_TICKET_FORM,
        requester_name: actorName,
      });

      toast("Ticket Created", "IT incident logged into the helpdesk queue.", "success");
      logActivity({
        module: "it",
        action: "created",
        entityType: "it_ticket",
        entityId: data.id,
        actorName,
        actorRole,
        description: `New IT ticket "${ticketForm.title}" logged by ${ticketForm.requester_name}`,
      });

      notify({
        source: "it_management",
        type: ticketForm.priority === "critical" || ticketForm.priority === "high" ? "warning" : "info",
        title: "New IT Ticket Submitted",
        message: `"${ticketForm.title}" submitted by ${ticketForm.requester_name} (${ticketForm.priority} priority)`,
        entityId: data.id,
      });
      loadData();
    },
    [ticketForm, savingTicket, actorName, actorRole, loadData]
  );

  const updateTicketStatus = useCallback(
    async (id: string, status: string) => {
      const update: Record<string, unknown> = { status };
      if (status === "resolved" || status === "closed") {
        update.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase.from("it_tickets").update(update).eq("id", id);
      if (error) {
        toast("Error", "Failed to update ticket status", "error");
        return;
      }

      toast("Ticket Updated", `Status marked as ${TICKET_STATUS_CONFIG[status]?.label || status}`, "success");
      const t = tickets.find((tk) => tk.id === id);
      logActivity({
        module: "it",
        action: status === "resolved" ? "approved" : "updated",
        entityType: "it_ticket",
        entityId: id,
        actorName,
        actorRole,
        description: `IT ticket "${t?.title || id}" marked ${status.replace("_", " ")}`,
      });

      setTickets((prev) =>
        prev.map((tk) =>
          tk.id === id
            ? {
                ...tk,
                status,
                resolved_at:
                  status === "resolved" || status === "closed" ? new Date().toISOString() : tk.resolved_at,
              }
            : tk
        )
      );

      if (selectedTicket && selectedTicket.id === id) {
        setSelectedTicket({
          ...selectedTicket,
          status,
          resolved_at:
            status === "resolved" || status === "closed" ? new Date().toISOString() : selectedTicket.resolved_at,
        });
      }
    },
    [tickets, selectedTicket, actorName, actorRole, setTickets, setSelectedTicket]
  );

  const handleDeleteTicket = useCallback(
    async (ticket: ITTicket) => {
      if (!confirm(`Move ticket "${ticket.title}" to the Recycle Bin?`)) return;

      const { error } = await supabase
        .from("it_tickets")
        .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
        .eq("id", ticket.id);

      if (error) {
        toast("Error", "Failed to delete ticket", "error");
        return;
      }

      toast("Ticket Deleted", "Moved to Recycle Bin.", "success");
      logActivity({
        module: "it",
        action: "deleted",
        entityType: "it_ticket",
        entityId: ticket.id,
        actorName,
        actorRole,
        description: `Moved IT ticket "${ticket.title}" to the Recycle Bin`,
      });
      setSelectedTicket(null);
      loadData();
    },
    [actorName, actorRole, setSelectedTicket, loadData]
  );

  return {
    ticketModal,
    setTicketModal,
    savingTicket,
    ticketForm,
    setTicketForm,
    handleCreateTicket,
    updateTicketStatus,
    handleDeleteTicket,
  };
}

import { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  role?: string;
  avatar_url?: string | null;
}

interface Branch {
  id: string;
  name: string;
}

interface ITAsset {
  id: string;
  name: string;
  asset_tag: string;
  type: string;
  employee_id: string | null;
  branch_id: string | null;
  status: "active" | "inventory" | "maintenance" | "retired" | string;
  serial_number: string | null;
  created_at?: string;
  employees?: {
    id: string;
    first_name: string;
    last_name: string;
    department?: string;
    avatar_url?: string | null;
  } | null;
  branches?: { id?: string; name: string } | null;
}

interface ITTicket {
  id: string;
  title: string;
  requester_name: string;
  priority: "low" | "medium" | "high" | "critical" | string;
  status: "open" | "in_progress" | "resolved" | "closed" | string;
  category: string;
  description: string | null;
  created_at: string;
  resolved_at: string | null;
}

const ASSET_TYPE_CONFIG: Record<
  string,
  { label: string; icon: string; color: string; bg: string }
> = {
  // Asset TYPE is a category — it says nothing about whether the asset needs
  // attention. Status and ticket priority below own the colour signal, so
  // types share the brand accent and rely on their icon to differentiate.
  Laptop: { label: "Laptop", icon: "ri-macbook-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Display: { label: "Monitor / Display", icon: "ri-tv-2-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Mobile: { label: "Mobile Device", icon: "ri-smartphone-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Phone: { label: "VoIP / Desk Phone", icon: "ri-phone-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Peripheral: { label: "Peripheral & Accessory", icon: "ri-keyboard-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Server: { label: "Server Infrastructure", icon: "ri-server-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Network: { label: "Network & Router", icon: "ri-wifi-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Power: { label: "Power & UPS", icon: "ri-flashlight-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
  Furniture: { label: "Office Equipment", icon: "ri-armchair-line", color: "text-slate-600", bg: "bg-slate-100" },
  Other: { label: "Other Asset", icon: "ri-box-3-line", color: "text-slate-600", bg: "bg-slate-100" },
};

const ASSET_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  active: {
    label: "Active / Deployed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  inventory: {
    label: "In Stock / Ready",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    dot: "bg-slate-500",
  },
  maintenance: {
    label: "Under Repair",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  retired: {
    label: "Retired / Decommissioned",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

const TICKET_STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  open: {
    label: "Open Request",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-time-line",
  },
  in_progress: {
    label: "In Progress",
    bg: "bg-[#253C7D]/10",
    text: "text-[#253C7D]",
    border: "border-[#253C7D]/20",
    icon: "ri-loader-2-line",
  },
  resolved: {
    label: "Resolved",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "ri-checkbox-circle-fill",
  },
  closed: {
    label: "Closed",
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
    icon: "ri-archive-line",
  },
};

const PRIORITY_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  low: {
    label: "Low",
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: "ri-arrow-down-line",
  },
  medium: {
    label: "Medium",
    bg: "bg-[#253C7D]/10",
    text: "text-[#253C7D]",
    border: "border-[#253C7D]/20",
    icon: "ri-equal-line",
  },
  high: {
    label: "High Priority",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-arrow-up-line",
  },
  critical: {
    label: "Critical / Urgent",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "ri-alarm-warning-line",
  },
};

const TICKET_CATEGORIES = [
  "Hardware",
  "Software",
  "Network",
  "Access",
  "Account",
  "Security",
  "Email",
  "Other",
];

const initials = (first?: string, last?: string) =>
  `${first?.[0] || ""}${last?.[0] || ""}`.toUpperCase();

export default function ITManagement() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const canManage = isAdmin || (!!role && role.name !== "Chairman");

  const [tab, setTab] = useState<"assets" | "tickets" | "security">("assets");
  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Asset Filters & View
  const [assetSearch, setAssetSearch] = useState("");
  const [assetTypeFilter, setAssetTypeFilter] = useState("all");
  const [assetStatusFilter, setAssetStatusFilter] = useState("all");
  const [assetBranchFilter, setAssetBranchFilter] = useState("all");
  const [assetViewMode, setAssetViewMode] = useState<"table" | "cards">("table");

  // Ticket Filters
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketStatusFilter, setTicketStatusFilter] = useState("all");
  const [ticketPriorityFilter, setTicketPriorityFilter] = useState("all");
  const [ticketCategoryFilter, setTicketCategoryFilter] = useState("all");

  // Modals & Drawers
  const [assetModal, setAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<ITAsset | null>(null);
  const [ticketModal, setTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<ITTicket | null>(null);
  const [saving, setSaving] = useState(false);

  // Forms
  const [assetForm, setAssetForm] = useState({
    name: "",
    asset_tag: "",
    type: "Laptop",
    serial_number: "",
    branch_id: "",
    employee_id: "",
    status: "active",
  });

  const [ticketForm, setTicketForm] = useState({
    title: "",
    requester_name: actorName,
    priority: "medium",
    category: "Hardware",
    description: "",
  });

  const [searchParams] = useSearchParams();
  const highlightId = searchParams.get("highlight");

  const loadData = async () => {
    setLoading(true);
    const [{ data: a }, { data: t }, { data: e }, { data: b }] = await Promise.all([
      supabase
        .from("it_assets")
        .select("*, employees(id, first_name, last_name, department, avatar_url), branches(id, name)")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("it_tickets")
        .select("*")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url")
        .is("deleted_at", null)
        .order("first_name"),
      supabase.from("branches").select("id, name").order("name"),
    ]);

    setAssets((a as ITAsset[]) || []);
    setTickets((t as ITTicket[]) || []);
    setEmployees((e as Employee[]) || []);
    setBranches((b as Branch[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("it-management-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "it_assets" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "it_tickets" }, () => loadData())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  // Notification Deep-Linking
  useEffect(() => {
    if (!highlightId || tickets.length === 0) return;
    const match = tickets.find((t) => t.id === highlightId);
    if (!match) return;
    setTab("tickets");
    setTicketStatusFilter("all");
    setSelectedTicket(match);
    const t = setTimeout(() => {
      const el = document.getElementById(`it-ticket-${highlightId}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus({ preventScroll: true });
    }, 100);
    return () => clearTimeout(t);
  }, [highlightId, tickets]);

  // Aggregate Metrics
  const activeAssets = useMemo(() => assets.filter((a) => a.status === "active").length, [assets]);
  const inInventory = useMemo(() => assets.filter((a) => a.status === "inventory").length, [assets]);
  const inMaintenance = useMemo(() => assets.filter((a) => a.status === "maintenance").length, [assets]);
  const openTickets = useMemo(() => tickets.filter((t) => t.status === "open").length, [tickets]);
  const inProgressTickets = useMemo(() => tickets.filter((t) => t.status === "in_progress").length, [tickets]);
  const criticalTickets = useMemo(
    () => tickets.filter((t) => (t.priority === "critical" || t.priority === "high") && t.status !== "closed" && t.status !== "resolved").length,
    [tickets]
  );
  const resolvedCount = useMemo(() => tickets.filter((t) => t.status === "resolved" || t.status === "closed").length, [tickets]);

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      if (assetTypeFilter !== "all" && a.type !== assetTypeFilter) return false;
      if (assetStatusFilter !== "all" && a.status !== assetStatusFilter) return false;
      if (assetBranchFilter !== "all" && a.branch_id !== assetBranchFilter) return false;
      if (assetSearch.trim()) {
        const q = assetSearch.toLowerCase().trim();
        const name = (a.name || "").toLowerCase();
        const tag = (a.asset_tag || "").toLowerCase();
        const type = (a.type || "").toLowerCase();
        const serial = (a.serial_number || "").toLowerCase();
        const emp = `${a.employees?.first_name || ""} ${a.employees?.last_name || ""}`.toLowerCase();
        const branch = (a.branches?.name || "").toLowerCase();
        if (!name.includes(q) && !tag.includes(q) && !type.includes(q) && !serial.includes(q) && !emp.includes(q) && !branch.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [assets, assetTypeFilter, assetStatusFilter, assetBranchFilter, assetSearch]);

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (ticketStatusFilter !== "all" && t.status !== ticketStatusFilter) return false;
      if (ticketPriorityFilter !== "all" && t.priority !== ticketPriorityFilter) return false;
      if (ticketCategoryFilter !== "all" && t.category !== ticketCategoryFilter) return false;
      if (ticketSearch.trim()) {
        const q = ticketSearch.toLowerCase().trim();
        const title = (t.title || "").toLowerCase();
        const req = (t.requester_name || "").toLowerCase();
        const cat = (t.category || "").toLowerCase();
        const desc = (t.description || "").toLowerCase();
        const id = (t.id || "").toLowerCase();
        if (!title.includes(q) && !req.includes(q) && !cat.includes(q) && !desc.includes(q) && !id.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, ticketStatusFilter, ticketPriorityFilter, ticketCategoryFilter, ticketSearch]);

  // Asset Distribution by Type
  const assetTypeStats = useMemo(() => {
    const counts: Record<string, number> = {};
    assets.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [assets]);

  // --- CRUD: Asset Operations ---
  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetForm.name || !assetForm.asset_tag || !canManage || saving) return;
    setSaving(true);

    const { error } = await supabase.from("it_assets").insert([
      {
        name: assetForm.name,
        asset_tag: assetForm.asset_tag,
        type: assetForm.type,
        serial_number: assetForm.serial_number || null,
        branch_id: assetForm.branch_id || null,
        employee_id: assetForm.employee_id || null,
        status: assetForm.employee_id ? "active" : assetForm.status || "inventory",
      },
    ]);

    setSaving(false);
    if (error) {
      toast("Error", "Failed to register asset", "error");
      return;
    }

    setAssetModal(false);
    setAssetForm({
      name: "",
      asset_tag: "",
      type: "Laptop",
      serial_number: "",
      branch_id: "",
      employee_id: "",
      status: "active",
    });
    toast("Asset Registered", `Added ${assetForm.name} (${assetForm.asset_tag}) to hardware register.`, "success");
    logActivity({
      module: "it",
      action: "created",
      entityType: "it_asset",
      actorName,
      actorRole: role?.name || "Unknown",
      description: `Registered new IT asset "${assetForm.name}" (${assetForm.asset_tag})`,
    });
    loadData();
  };

  const openEditAsset = (asset: ITAsset) => {
    if (!canManage) return;
    setAssetForm({
      name: asset.name,
      asset_tag: asset.asset_tag,
      type: asset.type,
      serial_number: asset.serial_number || "",
      branch_id: asset.branch_id || "",
      employee_id: asset.employee_id || "",
      status: asset.status || "active",
    });
    setEditingAsset(asset);
  };

  const handleSaveAssetEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset || !canManage || saving) return;
    setSaving(true);

    const { error } = await supabase
      .from("it_assets")
      .update({
        name: assetForm.name,
        asset_tag: assetForm.asset_tag,
        type: assetForm.type,
        serial_number: assetForm.serial_number || null,
        branch_id: assetForm.branch_id || null,
        employee_id: assetForm.employee_id || null,
        status: assetForm.status,
      })
      .eq("id", editingAsset.id);

    setSaving(false);
    if (error) {
      toast("Error", "Failed to update asset", "error");
      return;
    }

    setEditingAsset(null);
    toast("Asset Updated", "Asset record details updated.", "success");
    logActivity({
      module: "it",
      action: "updated",
      entityType: "it_asset",
      entityId: editingAsset.id,
      actorName,
      actorRole: role?.name || "Unknown",
      description: `Updated IT asset "${assetForm.name}" (${assetForm.asset_tag})`,
    });
    loadData();
  };

  const handleDeleteAsset = async (asset: ITAsset) => {
    if (!canManage) return;
    if (
      !confirm(
        `Remove "${asset.name}" (${asset.asset_tag}) from the active hardware register? It will be moved to the Recycle Bin.`
      )
    )
      return;

    const { error } = await supabase
      .from("it_assets")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", asset.id);

    if (error) {
      toast("Error", "Failed to delete asset", "error");
      return;
    }

    toast("Asset Removed", "Moved to Recycle Bin.", "success");
    logActivity({
      module: "it",
      action: "deleted",
      entityType: "it_asset",
      entityId: asset.id,
      actorName,
      actorRole: role?.name || "Unknown",
      description: `Moved IT asset "${asset.name}" (${asset.asset_tag}) to the Recycle Bin`,
    });
    loadData();
  };

  // --- CRUD: Ticket Operations ---
  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketForm.title || !ticketForm.requester_name || saving) return;
    setSaving(true);

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

    setSaving(false);
    if (error || !data) {
      toast("Error", "Failed to create ticket", "error");
      return;
    }

    setTicketModal(false);
    setTicketForm({
      title: "",
      requester_name: actorName,
      priority: "medium",
      category: "Hardware",
      description: "",
    });

    toast("Ticket Created", "IT incident logged into the helpdesk queue.", "success");
    logActivity({
      module: "it",
      action: "created",
      entityType: "it_ticket",
      entityId: data.id,
      actorName,
      actorRole: role?.name || "Unknown",
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
  };

  const updateTicketStatus = async (id: string, status: string) => {
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
      actorRole: role?.name || "Unknown",
      description: `IT ticket "${t?.title || id}" marked ${status.replace("_", " ")}`,
    });

    setTickets((prev) =>
      prev.map((tk) =>
        tk.id === id
          ? {
              ...tk,
              status,
              resolved_at: status === "resolved" || status === "closed" ? new Date().toISOString() : tk.resolved_at,
            }
          : tk
      )
    );
    if (selectedTicket && selectedTicket.id === id) {
      setSelectedTicket({
        ...selectedTicket,
        status,
        resolved_at: status === "resolved" || status === "closed" ? new Date().toISOString() : selectedTicket.resolved_at,
      });
    }
  };

  const handleDeleteTicket = async (ticket: ITTicket) => {
    if (
      !confirm(
        `Move ticket "${ticket.title}" to the Recycle Bin?`
      )
    )
      return;

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
      actorRole: role?.name || "Unknown",
      description: `Moved IT ticket "${ticket.title}" to the Recycle Bin`,
    });
    setSelectedTicket(null);
    loadData();
  };

  // Export CSV
  const handleExportCSV = () => {
    if (tab === "assets") {
      const headers = ["Asset Name", "Tag", "Type", "Serial Number", "Status", "Branch", "Assigned Employee"];
      const rows = filteredAssets.map((a) => [
        `"${a.name}"`,
        `"${a.asset_tag}"`,
        `"${a.type}"`,
        `"${a.serial_number || ""}"`,
        `"${a.status}"`,
        `"${a.branches?.name || ""}"`,
        `"${a.employees ? `${a.employees.first_name} ${a.employees.last_name}` : "Unassigned"}"`,
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `it_assets_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast("Export Complete", `Exported ${filteredAssets.length} assets to CSV.`, "success");
    } else {
      const headers = ["Ticket ID", "Title", "Requester", "Priority", "Category", "Status", "Created Date", "Resolved Date"];
      const rows = filteredTickets.map((t) => [
        `"${t.id}"`,
        `"${t.title}"`,
        `"${t.requester_name}"`,
        `"${t.priority}"`,
        `"${t.category}"`,
        `"${t.status}"`,
        `"${t.created_at}"`,
        `"${t.resolved_at || ""}"`,
      ]);
      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `it_tickets_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast("Export Complete", `Exported ${filteredTickets.length} tickets to CSV.`, "success");
    }
  };

  if (loading && assets.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB] dark:bg-slate-900">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading IT operations & asset center...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-slate-900 p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Enterprise Infrastructure</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">IT Management & Helpdesk</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            IT Operations Center
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
              Hardware & Service Desk
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Manage company device inventory, track hardware assignments across branches, resolve service tickets, and monitor security posture.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
            Export CSV
          </button>

          {canManage && tab === "assets" && (
            <button
              onClick={() => {
                setAssetForm({
                  name: "",
                  asset_tag: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
                  type: "Laptop",
                  serial_number: "",
                  branch_id: branches[0]?.id || "",
                  employee_id: "",
                  status: "inventory",
                });
                setAssetModal(true);
              }}
              className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <i className="ri-add-circle-line text-base font-bold" />
              Register Asset
            </button>
          )}

          {tab === "tickets" && (
            <button
              onClick={() => {
                setTicketForm({
                  title: "",
                  requester_name: actorName,
                  priority: "medium",
                  category: "Hardware",
                  description: "",
                });
                setTicketModal(true);
              }}
              className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <i className="ri-customer-service-2-line text-base font-bold" />
              New IT Ticket
            </button>
          )}
        </div>
      </div>

      {/* Executive KPI Performance Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
        {/* Active Deployed Assets */}
        <div
          onClick={() => {
            setTab("assets");
            setAssetStatusFilter("active");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "assets" && assetStatusFilter === "active"
              ? "border-emerald-500 ring-2 ring-emerald-500/10"
              : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Active Assets</span>
            <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ri-macbook-line text-xs" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{activeAssets}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Deployed to staff</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Ready in Inventory */}
        <div
          onClick={() => {
            setTab("assets");
            setAssetStatusFilter("inventory");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "assets" && assetStatusFilter === "inventory"
              ? "border-slate-500 ring-2 ring-slate-500/10"
              : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">In Inventory</span>
            <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <i className="ri-archive-line text-xs" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-700 mt-2">{inInventory}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Ready for assignment</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-500" />
        </div>

        {/* Under Maintenance */}
        <div
          onClick={() => {
            setTab("assets");
            setAssetStatusFilter("maintenance");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "assets" && assetStatusFilter === "maintenance"
              ? "border-amber-500 ring-2 ring-amber-500/10"
              : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Maintenance</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i className="ri-tools-line text-xs" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{inMaintenance}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Hardware repair</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Open Helpdesk Tickets */}
        <div
          onClick={() => {
            setTab("tickets");
            setTicketStatusFilter("open");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "tickets" && ticketStatusFilter === "open"
              ? "border-amber-500 ring-2 ring-amber-500/10"
              : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Open Tickets</span>
            <div className="w-6 h-6 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i className="ri-time-line text-xs" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{openTickets}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Awaiting assignment</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* In Progress Tickets */}
        <div
          onClick={() => {
            setTab("tickets");
            setTicketStatusFilter("in_progress");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "tickets" && ticketStatusFilter === "in_progress"
              ? "border-[#253C7D] ring-2 ring-[#253C7D]/10"
              : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#253C7D] uppercase tracking-wider">In Progress</span>
            <div className="w-6 h-6 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
              <i className="ri-loader-2-line text-xs" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#253C7D] mt-2">{inProgressTickets}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">Under investigation</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]/100" />
        </div>

        {/* Critical & Resolved */}
        <div
          onClick={() => {
            setTab("tickets");
            setTicketPriorityFilter("critical");
          }}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            tab === "tickets" && ticketPriorityFilter === "critical"
              ? "border-rose-500 ring-2 ring-rose-500/10"
              : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Urgent Alerts</span>
            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <i className="ri-alarm-warning-line text-xs" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{criticalTickets}</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{resolvedCount} resolved</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-2 shadow-2xs mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setTab("assets")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              tab === "assets"
                ? "bg-[#253C7D] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <i className="ri-macbook-line text-sm" />
            <span>Hardware & Asset Register</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "assets" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {assets.length}
            </span>
          </button>

          <button
            onClick={() => setTab("tickets")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              tab === "tickets"
                ? "bg-[#253C7D] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <i className="ri-customer-service-2-line text-sm" />
            <span>IT Helpdesk & Tickets</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                tab === "tickets" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              {tickets.length}
            </span>
          </button>

          <button
            onClick={() => setTab("security")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              tab === "security"
                ? "bg-[#253C7D] text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            }`}
          >
            <i className="ri-shield-keyhole-line text-sm" />
            <span>Security & Governance</span>
          </button>
        </div>

        {/* Tab Context Hint */}
        <span className="text-[11px] font-bold text-gray-400 px-3 hidden md:inline">
          {tab === "assets"
            ? `${filteredAssets.length} Assets Listed`
            : tab === "tickets"
            ? `${filteredTickets.length} Tickets in Queue`
            : "Compliance Matrix"}
        </span>
      </div>

      {/* ========================================================================= */}
      {/* 1. HARDWARE & IT ASSET INVENTORY TAB                                      */}
      {/* ========================================================================= */}
      {tab === "assets" && (
        <div className="space-y-6">
          {/* Quick Hardware Category Cards Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {Object.entries(ASSET_TYPE_CONFIG)
              .slice(0, 8)
              .map(([type, cfg]) => {
                const count = assets.filter((a) => a.type === type).length;
                const isSelected = assetTypeFilter === type;

                return (
                  <button
                    key={type}
                    onClick={() => setAssetTypeFilter(isSelected ? "all" : type)}
                    className={`bg-white rounded-2xl p-3 border transition-all text-left flex flex-col justify-between shadow-2xs hover:shadow-xs cursor-pointer ${
                      isSelected ? "border-[#253C7D] ring-2 ring-[#253C7D]/15 bg-[#253C7D]/5" : "border-gray-200/80"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl ${cfg.bg} ${cfg.color} flex items-center justify-center text-sm font-bold mb-2`}>
                      <i className={cfg.icon} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-800 truncate">{type}</p>
                      <p className="text-[11px] font-extrabold text-[#253C7D] mt-0.5">{count} units</p>
                    </div>
                  </button>
                );
              })}
          </div>

          {/* Asset Filters & Controls Bar */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
            <div className="relative w-full sm:w-64">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                placeholder="Search tag, serial, employee..."
                className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
              />
              {assetSearch && (
                <button
                  onClick={() => setAssetSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-circle-fill text-xs" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Type Filter */}
              <select
                value={assetTypeFilter}
                onChange={(e) => setAssetTypeFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold"
              >
                <option value="all">All Hardware Types</option>
                {Object.keys(ASSET_TYPE_CONFIG).map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={assetStatusFilter}
                onChange={(e) => setAssetStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active / Deployed</option>
                <option value="inventory">In Inventory</option>
                <option value="maintenance">Under Repair</option>
                <option value="retired">Retired</option>
              </select>

              {/* Branch Filter */}
              {branches.length > 0 && (
                <select
                  value={assetBranchFilter}
                  onChange={(e) => setAssetBranchFilter(e.target.value)}
                  className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[130px] truncate font-medium"
                >
                  <option value="all">All Branches</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              )}

              {/* View Mode Toggle */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
                <button
                  onClick={() => setAssetViewMode("table")}
                  title="Table View"
                  className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    assetViewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <i className="ri-table-line" />
                </button>
                <button
                  onClick={() => setAssetViewMode("cards")}
                  title="Cards View"
                  className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    assetViewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <i className="ri-layout-grid-fill" />
                </button>
              </div>

              {/* Reset */}
              {(assetSearch || assetTypeFilter !== "all" || assetStatusFilter !== "all" || assetBranchFilter !== "all") && (
                <button
                  onClick={() => {
                    setAssetSearch("");
                    setAssetTypeFilter("all");
                    setAssetStatusFilter("all");
                    setAssetBranchFilter("all");
                  }}
                  title="Reset Filters"
                  className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <i className="ri-refresh-line text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* Assets Data Display */}
          {filteredAssets.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
              <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
                <i className="ri-macbook-line" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No IT Assets Found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No hardware equipment matches your active search and filter criteria.
              </p>
              {canManage && (
                <button
                  onClick={() => {
                    setAssetForm({
                      name: "",
                      asset_tag: `AST-${Math.floor(1000 + Math.random() * 9000)}`,
                      type: "Laptop",
                      serial_number: "",
                      branch_id: branches[0]?.id || "",
                      employee_id: "",
                      status: "inventory",
                    });
                    setAssetModal(true);
                  }}
                  className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
                >
                  + Register New Asset
                </button>
              )}
            </div>
          ) : assetViewMode === "table" ? (
            /* Table View */
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Asset Details</th>
                      <th className="px-5 py-3.5">Asset Tag</th>
                      <th className="px-5 py-3.5">Type</th>
                      <th className="px-5 py-3.5">Assigned Employee</th>
                      <th className="px-5 py-3.5">Branch Location</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Serial Number</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAssets.map((a) => {
                      const typeCfg = ASSET_TYPE_CONFIG[a.type] || ASSET_TYPE_CONFIG.Other;
                      const statusCfg = ASSET_STATUS_CONFIG[a.status] || ASSET_STATUS_CONFIG.inventory;
                      const emp = a.employees;

                      return (
                        <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-9 h-9 rounded-xl ${typeCfg.bg} ${typeCfg.color} flex items-center justify-center text-base font-bold shrink-0 shadow-2xs`}
                              >
                                <i className={typeCfg.icon} />
                              </div>
                              <div>
                                <p className="font-extrabold text-gray-900">{a.name}</p>
                                <p className="text-[10px] text-gray-400">{a.type}</p>
                              </div>
                            </div>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-gray-800">
                            <span className="bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">{a.asset_tag}</span>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-600">
                            {a.type}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            {emp ? (
                              <Link
                                to={`/employees/${a.employee_id}`}
                                className="flex items-center gap-2 group cursor-pointer"
                              >
                                <div className="w-6 h-6 rounded-full bg-[#253C7D] text-white flex items-center justify-center font-bold text-[9px] overflow-hidden">
                                  {emp.avatar_url ? (
                                    <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <span>{initials(emp.first_name, emp.last_name)}</span>
                                  )}
                                </div>
                                <span className="font-bold text-gray-900 group-hover:text-[#253C7D] transition-colors">
                                  {emp.first_name} {emp.last_name}
                                </span>
                              </Link>
                            ) : (
                              <span className="text-gray-400 italic text-[11px] flex items-center gap-1">
                                <i className="ri-inbox-unarchive-line text-xs" /> Unassigned
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-600">
                            {a.branches?.name || "General HQ"}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                              {statusCfg.label}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[11px] text-gray-500">
                            {a.serial_number || "—"}
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            {canManage && (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEditAsset(a)}
                                  className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                  title="Edit Asset / Reassign"
                                >
                                  <i className="ri-edit-line text-sm" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAsset(a)}
                                  className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Delete Asset"
                                >
                                  <i className="ri-delete-bin-line text-sm" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredAssets.map((a) => {
                const typeCfg = ASSET_TYPE_CONFIG[a.type] || ASSET_TYPE_CONFIG.Other;
                const statusCfg = ASSET_STATUS_CONFIG[a.status] || ASSET_STATUS_CONFIG.inventory;
                const emp = a.employees;

                return (
                  <div
                    key={a.id}
                    className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-2xl ${typeCfg.bg} ${typeCfg.color} flex items-center justify-center font-bold text-lg shrink-0 shadow-2xs`}
                          >
                            <i className={typeCfg.icon} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors truncate text-sm">
                              {a.name}
                            </h4>
                            <p className="font-mono text-[10px] text-gray-400 font-bold">{a.asset_tag}</p>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border shrink-0 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                        >
                          {statusCfg.label}
                        </span>
                      </div>

                      <div className="p-3 bg-gray-50 rounded-2xl space-y-1.5 text-xs mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-[11px]">Type:</span>
                          <span className="font-bold text-gray-800">{a.type}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-[11px]">Branch:</span>
                          <span className="font-semibold text-gray-700 truncate">{a.branches?.name || "HQ"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500 text-[11px]">Serial:</span>
                          <span className="font-mono text-[11px] text-gray-600 truncate">{a.serial_number || "—"}</span>
                        </div>
                      </div>

                      {/* Assignment */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-gray-400 font-medium">Assigned to:</span>
                        {emp ? (
                          <Link
                            to={`/employees/${a.employee_id}`}
                            className="font-bold text-[#253C7D] hover:underline truncate max-w-[140px]"
                          >
                            {emp.first_name} {emp.last_name}
                          </Link>
                        ) : (
                          <span className="text-gray-400 italic text-[11px]">Unassigned</span>
                        )}
                      </div>
                    </div>

                    {canManage && (
                      <div className="flex items-center justify-end gap-1.5 pt-3 mt-3 border-t border-gray-100">
                        <button
                          onClick={() => openEditAsset(a)}
                          className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                        >
                          <i className="ri-edit-line mr-1" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteAsset(a)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. IT HELPDESK & SERVICE TICKETS TAB                                      */}
      {/* ========================================================================= */}
      {tab === "tickets" && (
        <div className="space-y-6">
          {/* Ticket Filters Bar */}
          <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
            <div className="relative w-full sm:w-64">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="Search ticket title, requester..."
                className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] font-medium"
              />
              {ticketSearch && (
                <button
                  onClick={() => setTicketSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <i className="ri-close-circle-fill text-xs" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <select
                value={ticketStatusFilter}
                onChange={(e) => setTicketStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold"
              >
                <option value="all">All Ticket Statuses</option>
                <option value="open">Open Requests</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              {/* Priority Filter */}
              <select
                value={ticketPriorityFilter}
                onChange={(e) => setTicketPriorityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical / Urgent</option>
                <option value="high">High Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="low">Low Priority</option>
              </select>

              {/* Category Filter */}
              <select
                value={ticketCategoryFilter}
                onChange={(e) => setTicketCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
              >
                <option value="all">All Categories</option>
                {TICKET_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              {/* Reset */}
              {(ticketSearch || ticketStatusFilter !== "all" || ticketPriorityFilter !== "all" || ticketCategoryFilter !== "all") && (
                <button
                  onClick={() => {
                    setTicketSearch("");
                    setTicketStatusFilter("all");
                    setTicketPriorityFilter("all");
                    setTicketCategoryFilter("all");
                  }}
                  title="Reset Filters"
                  className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <i className="ri-refresh-line text-sm" />
                </button>
              )}
            </div>
          </div>

          {/* Tickets List */}
          {filteredTickets.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
              <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
                <i className="ri-customer-service-2-line" />
              </div>
              <h3 className="text-base font-bold text-gray-900">No Support Tickets Found</h3>
              <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                No tickets in the queue matching your current filters.
              </p>
              <button
                onClick={() => setTicketModal(true)}
                className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
              >
                + Create New IT Ticket
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-3.5">Ticket ID & Title</th>
                      <th className="px-5 py-3.5">Requester</th>
                      <th className="px-5 py-3.5">Priority</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Created Date</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredTickets.map((t) => {
                      const statusCfg = TICKET_STATUS_CONFIG[t.status] || TICKET_STATUS_CONFIG.open;
                      const priorityCfg = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.medium;
                      const isHighlight = t.id === highlightId;

                      return (
                        <tr
                          key={t.id}
                          id={`it-ticket-${t.id}`}
                          onClick={() => setSelectedTicket(t)}
                          className={`hover:bg-slate-50/80 transition-colors cursor-pointer group outline-none ${
                            isHighlight ? "bg-amber-50/40 ring-2 ring-inset ring-[#253C7D]" : ""
                          }`}
                        >
                          <td className="px-5 py-3.5">
                            <div>
                              <span className="font-mono text-[11px] font-bold text-[#253C7D] block mb-0.5">
                                #{t.id.slice(0, 8)}
                              </span>
                              <p className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors text-sm">
                                {t.title}
                              </p>
                              {t.description && (
                                <p className="text-[11px] text-gray-400 truncate max-w-sm mt-0.5">{t.description}</p>
                              )}
                            </div>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-800">
                            {t.requester_name}
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${priorityCfg.bg} ${priorityCfg.text} ${priorityCfg.border}`}
                            >
                              <i className={priorityCfg.icon} />
                              {priorityCfg.label}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span className="bg-slate-100 text-gray-700 font-semibold px-2.5 py-0.5 rounded-full text-[11px]">
                              {t.category}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                            >
                              <i className={statusCfg.icon} />
                              {statusCfg.label}
                            </span>
                          </td>

                          <td className="px-5 py-3.5 whitespace-nowrap text-gray-500 font-medium">
                            {new Date(t.created_at).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>

                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <div
                              className="flex items-center justify-end gap-1.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {t.status === "open" && (
                                <button
                                  onClick={() => updateTicketStatus(t.id, "in_progress")}
                                  className="px-2.5 py-1 text-xs font-bold text-[#253C7D] bg-[#253C7D]/10 hover:bg-[#253C7D]/20 rounded-lg transition-colors cursor-pointer"
                                >
                                  Start
                                </button>
                              )}

                              {(t.status === "open" || t.status === "in_progress") && (
                                <button
                                  onClick={() => updateTicketStatus(t.id, "resolved")}
                                  className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  Resolve
                                </button>
                              )}

                              {t.status === "resolved" && (
                                <button
                                  onClick={() => updateTicketStatus(t.id, "closed")}
                                  className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                >
                                  Close
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteTicket(t)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <i className="ri-delete-bin-line text-sm" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SECURITY, INFRASTRUCTURE & ACCESS TAB                                  */}
      {/* ========================================================================= */}
      {tab === "security" && (
        <div className="space-y-6">
          {/* Security Posture Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {[
              { label: "Active VPN Tunnels", value: "87", sub: "All branches online", color: "bg-[#253C7D]/10 text-[#253C7D]" },
              { label: "Failed Auth (24h)", value: "12", sub: "Blocked by firewall", color: "bg-rose-50 text-rose-700" },
              { label: "2FA Coverage", value: "96%", sub: "Enforced for staff", color: "bg-emerald-50 text-emerald-700" },
              { label: "Active MDM Devices", value: "142", sub: "Compliant firmware", color: "bg-[#253C7D]/10 text-[#253C7D]" },
              { label: "Security Incidents", value: "0", sub: "Last 30 days", color: "bg-slate-100 text-slate-700" },
              { label: "Last Audit Pass", value: "100%", sub: "SOC-2 / ISO 27001", color: "bg-slate-100 text-slate-800" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-2xs">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">{s.label}</span>
                <p className={`text-2xl font-black mt-1 ${s.color.split(" ")[1]}`}>{s.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Security Policies Matrix */}
          <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">Corporate IT & Access Security Policies</h3>
                <p className="text-xs text-gray-400 mt-0.5">Automated compliance controls enforced across workstations</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                ● 100% Policy Compliance
              </span>
            </div>

            <div className="space-y-3">
              {[
                { label: "Mandatory Multi-Factor Authentication (MFA)", value: "Required for all admin and staff portal logins", status: "Enforced", icon: "ri-shield-keyhole-line" },
                { label: "Minimum Password Complexity & Length", value: "12+ alphanumeric characters with special symbols", status: "Enforced", icon: "ri-lock-password-line" },
                { label: "Automatic Workstation Session Lockout", value: "Locks screen after 15 minutes of idle activity", status: "Enforced", icon: "ri-macbook-line" },
                { label: "Zero-Trust VPN Access Gateway", value: "Required for remote branch & out-of-office network access", status: "Active", icon: "ri-router-line" },
                { label: "Full-Disk Device Encryption (AES-256)", value: "BitLocker / FileVault enabled on 100% company laptops", status: "Active", icon: "ri-hard-drive-2-line" },
                { label: "Automatic Security Patch Management", value: "Weekly updates pushed to all connected endpoints", status: "Scheduled", icon: "ri-refresh-line" },
              ].map((p) => (
                <div
                  key={p.label}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100/70 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-[#253C7D] flex items-center justify-center text-base font-bold shrink-0">
                      <i className={p.icon} />
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-gray-900">{p.label}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{p.value}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/70 px-3 py-1 rounded-full w-fit">
                    {p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: TICKET DETAIL & ACTION VIEW                                       */}
      {/* ========================================================================= */}
      {selectedTicket && !ticketModal && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedTicket(null)}
          />
          <div className="relative w-full sm:w-[480px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#253C7D] font-mono block">
                    #{selectedTicket.id}
                  </span>
                  <h3 className="text-base font-extrabold text-gray-900 mt-0.5">Support Incident Details</h3>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <h4 className="text-lg font-extrabold text-gray-900">{selectedTicket.title}</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Submitted by <strong className="text-gray-800">{selectedTicket.requester_name}</strong> on{" "}
                    {new Date(selectedTicket.created_at).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Status & Priority Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      TICKET_STATUS_CONFIG[selectedTicket.status]?.bg
                    } ${TICKET_STATUS_CONFIG[selectedTicket.status]?.text} border ${
                      TICKET_STATUS_CONFIG[selectedTicket.status]?.border
                    }`}
                  >
                    <i className={TICKET_STATUS_CONFIG[selectedTicket.status]?.icon} />
                    {TICKET_STATUS_CONFIG[selectedTicket.status]?.label}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      PRIORITY_CONFIG[selectedTicket.priority]?.bg
                    } ${PRIORITY_CONFIG[selectedTicket.priority]?.text} border ${
                      PRIORITY_CONFIG[selectedTicket.priority]?.border
                    }`}
                  >
                    <i className={PRIORITY_CONFIG[selectedTicket.priority]?.icon} />
                    {PRIORITY_CONFIG[selectedTicket.priority]?.label}
                  </span>

                  <span className="bg-slate-100 text-gray-700 font-semibold px-3 py-1 rounded-full text-xs">
                    {selectedTicket.category}
                  </span>
                </div>

                {/* Description */}
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Problem Description & Scope
                  </span>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-xs text-gray-700 leading-relaxed">
                    {selectedTicket.description || "No additional description provided."}
                  </div>
                </div>

                {/* Resolution Status */}
                {selectedTicket.resolved_at && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                    <i className="ri-checkbox-circle-fill text-emerald-600 text-base shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Incident Resolved</span>
                      <span>
                        Closed on{" "}
                        {new Date(selectedTicket.resolved_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Status Update Toolbar */}
            <div className="p-6 border-t border-gray-100 space-y-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                Update Ticket Lifecycle
              </span>
              <div className="flex gap-2">
                {selectedTicket.status === "open" && (
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, "in_progress")}
                    className="flex-1 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Start Investigation
                  </button>
                )}

                {(selectedTicket.status === "open" || selectedTicket.status === "in_progress") && (
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, "resolved")}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Mark as Resolved
                  </button>
                )}

                {selectedTicket.status === "resolved" && (
                  <button
                    onClick={() => updateTicketStatus(selectedTicket.id, "closed")}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Archive & Close
                  </button>
                )}

                <button
                  onClick={() => handleDeleteTicket(selectedTicket)}
                  className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                  title="Delete Ticket"
                >
                  <i className="ri-delete-bin-line text-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REGISTER NEW IT ASSET                                              */}
      {/* ========================================================================= */}
      {assetModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !saving && setAssetModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
                  <i className="ri-macbook-line" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Register New Hardware Asset</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Add device to company asset inventory</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAssetModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Asset Name / Model <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    placeholder="e.g. MacBook Pro 16' M3 Max"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Asset Tag Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={assetForm.asset_tag}
                    onChange={(e) => setAssetForm({ ...assetForm, asset_tag: e.target.value })}
                    placeholder="AST-1042"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Hardware Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={assetForm.type}
                    onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    {Object.keys(ASSET_TYPE_CONFIG).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Serial Number / Service Tag
                  </label>
                  <input
                    value={assetForm.serial_number}
                    onChange={(e) => setAssetForm({ ...assetForm, serial_number: e.target.value })}
                    placeholder="C02XG1234AB"
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Assign to Employee
                  </label>
                  <select
                    value={assetForm.employee_id}
                    onChange={(e) => setAssetForm({ ...assetForm, employee_id: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    <option value="">Unassigned (Inventory Stock)</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Branch Location
                  </label>
                  <select
                    value={assetForm.branch_id}
                    onChange={(e) => setAssetForm({ ...assetForm, branch_id: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    <option value="">General Headquarters</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Initial Status
                </label>
                <select
                  value={assetForm.status}
                  onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  <option value="active">Active / Deployed</option>
                  <option value="inventory">In Inventory Stock</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="retired">Retired</option>
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssetModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !assetForm.name || !assetForm.asset_tag}
                  className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Registering..." : "Register Hardware Asset"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT IT ASSET & REASSIGN                                           */}
      {/* ========================================================================= */}
      {editingAsset && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !saving && setEditingAsset(null)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
                  <i className="ri-edit-line" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Edit Asset & Assignment</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Modify hardware specifications & staff ownership</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingAsset(null)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveAssetEdit} className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Asset Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={assetForm.name}
                    onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Asset Tag <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={assetForm.asset_tag}
                    onChange={(e) => setAssetForm({ ...assetForm, asset_tag: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Type
                  </label>
                  <select
                    value={assetForm.type}
                    onChange={(e) => setAssetForm({ ...assetForm, type: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    {Object.keys(ASSET_TYPE_CONFIG).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Serial Number
                  </label>
                  <input
                    value={assetForm.serial_number}
                    onChange={(e) => setAssetForm({ ...assetForm, serial_number: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Assignee (Employee)
                  </label>
                  <select
                    value={assetForm.employee_id}
                    onChange={(e) => setAssetForm({ ...assetForm, employee_id: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    <option value="">Unassigned (Inventory Stock)</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.first_name} {emp.last_name} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Operating Status
                  </label>
                  <select
                    value={assetForm.status}
                    onChange={(e) => setAssetForm({ ...assetForm, status: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    <option value="active">Active / Deployed</option>
                    <option value="inventory">In Inventory Stock</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="retired">Retired</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Branch Location
                </label>
                <select
                  value={assetForm.branch_id}
                  onChange={(e) => setAssetForm({ ...assetForm, branch_id: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                >
                  <option value="">General Headquarters</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingAsset(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW IT SERVICE TICKET                                       */}
      {/* ========================================================================= */}
      {ticketModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !saving && setTicketModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
                  <i className="ri-customer-service-2-line" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Create Helpdesk Incident Ticket</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Submit request to IT support engineers</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setTicketModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Issue Summary / Title <span className="text-rose-500">*</span>
                </label>
                <input
                  required
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })}
                  placeholder="e.g., VPN authentication timeout on remote laptop"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Requester Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    required
                    value={ticketForm.requester_name}
                    onChange={(e) => setTicketForm({ ...ticketForm, requester_name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={ticketForm.category}
                    onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    {TICKET_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Severity & Priority Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["low", "medium", "high", "critical"] as const).map((p) => {
                    const cfg = PRIORITY_CONFIG[p];
                    const isSelected = ticketForm.priority === p;

                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setTicketForm({ ...ticketForm, priority: p })}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-1.5 ${
                          isSelected
                            ? `${cfg.bg} ${cfg.text} ${cfg.border} font-black ring-2 ring-[#253C7D]/20`
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <i className={cfg.icon} />
                        <span className="text-xs capitalize font-bold">{p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Detailed Error Description & Symptoms
                </label>
                <textarea
                  rows={3}
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                  placeholder="Steps to reproduce, error codes, device name..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTicketModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !ticketForm.title || !ticketForm.requester_name}
                  className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Submitting..." : "Submit IT Ticket"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
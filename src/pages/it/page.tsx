import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

interface ITAsset {
  id: string;
  name: string;
  asset_tag: string;
  type: string;
  employee_id: string | null;
  branch_id: string | null;
  status: string;
  serial_number: string | null;
  employees?: { first_name: string; last_name: string } | null;
  branches?: { name: string } | null;
}

interface ITTicket {
  id: string;
  title: string;
  requester_name: string;
  priority: string;
  status: string;
  category: string;
  created_at: string;
  resolved_at: string | null;
}

const assetTypeIcons: Record<string, string> = {
  Laptop: "ri-computer-line",
  Mobile: "ri-phone-line",
  Phone: "ri-phone-line",
  Display: "ri-tv-line",
  Peripheral: "ri-tools-line",
  Furniture: "ri-home-line",
  Server: "ri-server-line",
  Network: "ri-wifi-line",
  Power: "ri-flashlight-line",
  Other: "ri-archive-line",
};

const statusColors: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  inventory: "bg-gray-50 text-gray-600",
  maintenance: "bg-amber-50 text-amber-700",
  retired: "bg-red-50 text-red-700",
};

const ticketStatusColors: Record<string, string> = {
  open: "bg-gray-50 text-gray-600",
  in_progress: "bg-blue-50 text-blue-700",
  resolved: "bg-green-50 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-50 text-blue-700",
  medium: "bg-amber-50 text-amber-700",
  high: "bg-red-50 text-red-700",
  critical: "bg-red-100 text-red-800",
};

export default function ITManagement() {
  const [tab, setTab] = useState<"assets" | "tickets" | "security">("assets");
  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [assetFilter, setAssetFilter] = useState("all");
  const [ticketFilter, setTicketFilter] = useState("all");
  const [assetModal, setAssetModal] = useState(false);
  const [ticketModal, setTicketModal] = useState(false);
  const [newAsset, setNewAsset] = useState({ name: "", asset_tag: "", type: "Laptop", serial_number: "" });
  const [newTicket, setNewTicket] = useState({ title: "", requester_name: "", priority: "medium", category: "Hardware", description: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: a } = await supabase
      .from("it_assets")
      .select("*, employees(first_name, last_name), branches(name)")
      .order("created_at", { ascending: false });
    setAssets(a || []);

    const { data: t } = await supabase
      .from("it_tickets")
      .select("*")
      .order("created_at", { ascending: false });
    setTickets(t || []);
    setLoading(false);
  };

  const createAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsset.name || !newAsset.asset_tag) return;
    await supabase.from("it_assets").insert([{
      name: newAsset.name,
      asset_tag: newAsset.asset_tag,
      type: newAsset.type,
      serial_number: newAsset.serial_number || null,
    }]);
    setAssetModal(false);
    setNewAsset({ name: "", asset_tag: "", type: "Laptop", serial_number: "" });
    toast("Asset added", "New IT asset registered", "success");
    loadData();
  };

  const createTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.title || !newTicket.requester_name) return;
    await supabase.from("it_tickets").insert([{
      title: newTicket.title,
      requester_name: newTicket.requester_name,
      priority: newTicket.priority,
      category: newTicket.category,
      description: newTicket.description || null,
      status: "open",
    }]);
    setTicketModal(false);
    setNewTicket({ title: "", requester_name: "", priority: "medium", category: "Hardware", description: "" });
    toast("Ticket created", "IT ticket submitted", "success");
    loadData();
  };

  const updateTicketStatus = async (id: string, status: string) => {
    const update: Record<string, unknown> = { status };
    if (status === "resolved" || status === "closed") {
      update.resolved_at = new Date().toISOString();
    }
    await supabase.from("it_tickets").update(update).eq("id", id);
    toast("Ticket updated", `Status changed to ${status.replace("_", " ")}`, "success");
    loadData();
  };

  const filteredAssets = assetFilter === "all" ? assets : assets.filter((a) => a.status === assetFilter);
  const filteredTickets = ticketFilter === "all" ? tickets : tickets.filter((t) => t.status === ticketFilter);

  const activeAssets = assets.filter((a) => a.status === "active").length;
  const inInventory = assets.filter((a) => a.status === "inventory").length;
  const inMaintenance = assets.filter((a) => a.status === "maintenance").length;
  const openTickets = tickets.filter((t) => t.status === "open").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const resolvedToday = tickets.filter((t) => t.status === "resolved" && t.resolved_at && new Date(t.resolved_at).toDateString() === new Date().toDateString()).length;

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-[#FAFAF8]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">IT Management</h1>
          <p className="text-[13px] text-gray-500 mt-1">Manage IT assets, tickets, and infrastructure across branches</p>
        </div>
        <div className="flex gap-2">
          {tab === "assets" && (
            <button onClick={() => setAssetModal(true)} className="px-4 py-2.5 bg-[#0D7377] text-white text-[13px] font-semibold rounded-lg hover:bg-[#0a5c60] whitespace-nowrap">
              <i className="ri-add-line mr-1" /> Add Asset
            </button>
          )}
          {tab === "tickets" && (
            <button onClick={() => setTicketModal(true)} className="px-4 py-2.5 bg-[#0D7377] text-white text-[13px] font-semibold rounded-lg hover:bg-[#0a5c60] whitespace-nowrap">
              <i className="ri-add-line mr-1" /> New Ticket
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-green-50 rounded-xl p-5">
          <p className="text-2xl font-bold text-green-700">{activeAssets}</p>
          <p className="text-[12px] font-medium text-green-600 mt-1">Active Assets</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-5">
          <p className="text-2xl font-bold text-gray-700">{inInventory}</p>
          <p className="text-[12px] font-medium text-gray-600 mt-1">In Inventory</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-5">
          <p className="text-2xl font-bold text-amber-700">{inMaintenance}</p>
          <p className="text-[12px] font-medium text-amber-600 mt-1">In Maintenance</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-5">
          <p className="text-2xl font-bold text-blue-700">{openTickets}</p>
          <p className="text-[12px] font-medium text-blue-600 mt-1">Open Tickets</p>
        </div>
        <div className="bg-purple-50 rounded-xl p-5">
          <p className="text-2xl font-bold text-purple-700">{inProgress}</p>
          <p className="text-[12px] font-medium text-purple-600 mt-1">In Progress</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-5">
          <p className="text-2xl font-bold text-emerald-700">{resolvedToday}</p>
          <p className="text-[12px] font-medium text-emerald-600 mt-1">Resolved Today</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        {(["assets", "tickets", "security"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-[12px] font-medium capitalize transition-colors whitespace-nowrap ${
              tab === t ? "bg-[#0D7377] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {tab === "assets" && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap mb-4">
                {["all", "active", "inventory", "maintenance", "retired"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setAssetFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium capitalize transition-colors whitespace-nowrap ${
                      assetFilter === f ? "bg-[#0D7377] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-7 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider items-center">
                  <span>Asset</span>
                  <span>Tag</span>
                  <span>Type</span>
                  <span>Assigned To</span>
                  <span>Branch</span>
                  <span>Status</span>
                  <span>Serial</span>
                </div>
                {filteredAssets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-[13px]">No assets found</div>
                ) : (
                  filteredAssets.map((a) => (
                    <div key={a.id} className="grid grid-cols-7 px-5 py-4 border-t border-gray-50 items-center">
                      <span className="text-[13px] font-medium text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#0D7377]/10 flex items-center justify-center shrink-0">
                          <i className={`${assetTypeIcons[a.type] || "ri-box-3-line"} text-sm text-[#0D7377] w-4 h-4 flex items-center justify-center`} />
                        </div>
                        {a.name}
                      </span>
                      <span className="text-[13px] text-gray-600">{a.asset_tag}</span>
                      <span className="text-[13px] text-gray-600">{a.type}</span>
                      <span className="text-[13px] text-gray-700">
                        {a.employees ? (
                          <Link to={`/employees/${a.employee_id}`} className="hover:text-[#0D7377] transition-colors">
                            {a.employees.first_name} {a.employees.last_name}
                          </Link>
                        ) : (
                          <span className="text-gray-400">Unassigned</span>
                        )}
                      </span>
                      <span className="text-[13px] text-gray-600">{a.branches?.name || "—"}</span>
                      <span className={`inline-flex text-[11px] font-semibold px-2 py-1 rounded-full w-fit capitalize ${statusColors[a.status] || "bg-gray-50 text-gray-600"}`}>
                        {a.status}
                      </span>
                      <span className="text-[13px] text-gray-500">{a.serial_number || "—"}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === "tickets" && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap mb-4">
                {["all", "open", "in_progress", "resolved", "closed"].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTicketFilter(f)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-medium capitalize transition-colors whitespace-nowrap ${
                      ticketFilter === f ? "bg-[#0D7377] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {f.replace("_", " ")}
                  </button>
                ))}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="grid grid-cols-6 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider items-center">
                  <span>Ticket</span>
                  <span>Requester</span>
                  <span>Priority</span>
                  <span>Category</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                {filteredTickets.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 text-[13px]">No tickets found</div>
                ) : (
                  filteredTickets.map((t) => (
                    <div key={t.id} className="grid grid-cols-6 px-5 py-4 border-t border-gray-50 items-center">
                      <div>
                        <span className="text-[13px] font-semibold text-[#0D7377]">#{t.id.slice(0, 8)}</span>
                        <p className="text-[12px] text-gray-600 mt-0.5 truncate max-w-[200px]">{t.title}</p>
                      </div>
                      <span className="text-[13px] text-gray-600">{t.requester_name}</span>
                      <span className={`inline-flex text-[11px] font-semibold px-2 py-1 rounded-full w-fit capitalize ${priorityColors[t.priority]}`}>
                        {t.priority}
                      </span>
                      <span className="text-[13px] text-gray-600">{t.category}</span>
                      <span className={`inline-flex text-[11px] font-semibold px-2 py-1 rounded-full w-fit capitalize ${ticketStatusColors[t.status]}`}>
                        {t.status.replace("_", " ")}
                      </span>
                      <div className="flex gap-1">
                        {t.status === "open" && (
                          <button onClick={() => updateTicketStatus(t.id, "in_progress")} className="text-[11px] text-[#0D7377] font-medium hover:underline">Start</button>
                        )}
                        {(t.status === "open" || t.status === "in_progress") && (
                          <button onClick={() => updateTicketStatus(t.id, "resolved")} className="text-[11px] text-green-600 font-medium hover:underline ml-2">Resolve</button>
                        )}
                        {t.status === "resolved" && (
                          <button onClick={() => updateTicketStatus(t.id, "closed")} className="text-[11px] text-gray-500 font-medium hover:underline">Close</button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {tab === "security" && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Active VPN Users", value: "87", color: "bg-blue-50", text: "text-blue-700" },
                  { label: "Failed Logins (24h)", value: "12", color: "bg-red-50", text: "text-red-700" },
                  { label: "Password Resets (7d)", value: "5", color: "bg-amber-50", text: "text-amber-700" },
                  { label: "2FA Enabled", value: "94%", color: "bg-green-50", text: "text-green-700" },
                  { label: "Security Alerts", value: "3", color: "bg-red-50", text: "text-red-700" },
                  { label: "Last Security Audit", value: "May 5", color: "bg-gray-50", text: "text-gray-700" },
                ].map((s) => (
                  <div key={s.label} className={`rounded-xl p-5 ${s.color}`}>
                    <p className={`text-2xl font-bold ${s.text}`}>{s.value}</p>
                    <p className="text-[12px] font-medium text-gray-600 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h3 className="text-[15px] font-bold text-[#1A1A1A] mb-4">Security Policies</h3>
                <div className="space-y-3">
                  {[
                    { label: "Minimum password length", value: "12 characters", status: "Enforced" },
                    { label: "Password expiration", value: "90 days", status: "Enforced" },
                    { label: "Account lockout threshold", value: "5 failed attempts", status: "Enforced" },
                    { label: "MFA for admin accounts", value: "Required", status: "Enforced" },
                    { label: "Session timeout", value: "30 minutes idle", status: "Enforced" },
                    { label: "Data encryption at rest", value: "AES-256", status: "Active" },
                  ].map((p) => (
                    <div key={p.label} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-[13px] font-medium text-gray-900">{p.label}</p>
                        <p className="text-[11px] text-gray-500">{p.value}</p>
                      </div>
                      <span className="text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">{p.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Add Asset Modal */}
      {assetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Register IT Asset</h3>
              <button onClick={() => setAssetModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <i className="ri-close-line text-xl text-gray-500" />
              </button>
            </div>
            <form onSubmit={createAsset} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Asset Name</label>
                <input required value={newAsset.name} onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="e.g., MacBook Pro M3" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Asset Tag</label>
                  <input required value={newAsset.asset_tag} onChange={(e) => setNewAsset({ ...newAsset, asset_tag: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="e.g., NB-004" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Type</label>
                  <select value={newAsset.type} onChange={(e) => setNewAsset({ ...newAsset, type: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377] bg-white">
                    {Object.keys(assetTypeIcons).map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Serial Number</label>
                <input value={newAsset.serial_number} onChange={(e) => setNewAsset({ ...newAsset, serial_number: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="Optional" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#0D7377] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60]">Register Asset</button>
            </form>
          </div>
        </div>
      )}

      {/* New Ticket Modal */}
      {ticketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">New IT Ticket</h3>
              <button onClick={() => setTicketModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <i className="ri-close-line text-xl text-gray-500" />
              </button>
            </div>
            <form onSubmit={createTicket} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Title</label>
                <input required value={newTicket.title} onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="Describe the issue" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Requester Name</label>
                <input required value={newTicket.requester_name} onChange={(e) => setNewTicket({ ...newTicket, requester_name: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="Full name" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Priority</label>
                  <select value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377] bg-white">
                    {["low", "medium", "high", "critical"].map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Category</label>
                  <select value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377] bg-white">
                    {["Hardware", "Software", "Network", "Access", "Account", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Description</label>
                <textarea rows={3} value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="Details about the issue..." />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#0D7377] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60]">Submit Ticket</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
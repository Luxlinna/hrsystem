import { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/context/AuthContext";
import { logActivity } from "@/lib/audit";

interface Branch {
  id: string;
  name: string;
}

interface Expense {
  id: string;
  category: string;
  branch_id: string | null;
  amount: number;
  date: string;
  status: "pending" | "approved" | "paid" | "rejected";
  description: string | null;
  submitted_by: string | null;
  created_at?: string;
  branches?: { id?: string; name: string } | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  pending: {
    label: "Pending Review",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: "ri-time-line",
  },
  approved: {
    label: "Approved",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: "ri-checkbox-circle-line",
  },
  paid: {
    label: "Paid / Disbursed",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: "ri-check-double-line",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
    icon: "ri-close-circle-line",
  },
};

const CATEGORIES = [
  "All Categories",
  "Office Rent",
  "IT Equipment",
  "Travel",
  "Training",
  "Marketing",
  "Utilities",
  "Software",
  "Catering",
  "Office Supplies",
  "Legal",
  "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  "Office Rent": "#253C7D",
  "IT Equipment": "#0284C7",
  Travel: "#F59E0B",
  Training: "#8B5CF6",
  Marketing: "#EC4899",
  Utilities: "#10B981",
  Software: "#6366F1",
  Catering: "#F97316",
  "Office Supplies": "#64748B",
  Legal: "#DC2626",
  Other: "#94A3B8",
};

// Helper for Local YYYY-MM-DD
function toYMD(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Finance() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin } = usePermissions();
  const canManage = isAdmin || (!!role && role.name !== "Chairman");

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  // Date Range Filter Presets
  const [datePreset, setDatePreset] = useState<
    "all" | "this_month" | "last_month" | "this_quarter" | "this_year" | "last_year" | "custom"
  >("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Views & Pagination
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [pageSize, setPageSize] = useState(15);
  const [page, setPage] = useState(1);

  // Modals & Panels
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [modal, setModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    category: "Office Supplies",
    branch_id: "",
    amount: "",
    date: toYMD(new Date()),
    description: "",
    submitted_by: actorName,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [{ data: expData }, { data: branchData }] = await Promise.all([
      supabase
        .from("expense_records")
        .select("*, branches(id, name)")
        .is("deleted_at", null)
        .order("date", { ascending: false }),
      supabase.from("branches").select("id, name").order("name"),
    ]);

    setExpenses((expData as unknown as Expense[]) || []);
    setBranches((branchData as Branch[]) || []);
    setLoading(false);
  };

  // Date Range Bounds Resolver
  const dateRangeBounds = useMemo(() => {
    const now = new Date();
    const todayStr = toYMD(now);

    if (datePreset === "this_month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: toYMD(start), end: todayStr };
    }

    if (datePreset === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: toYMD(start), end: toYMD(end) };
    }

    if (datePreset === "this_quarter") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), currentQuarter * 3, 1);
      return { start: toYMD(start), end: todayStr };
    }

    if (datePreset === "this_year") {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start: toYMD(start), end: todayStr };
    }

    if (datePreset === "last_year") {
      const start = new Date(now.getFullYear() - 1, 0, 1);
      const end = new Date(now.getFullYear() - 1, 11, 31);
      return { start: toYMD(start), end: toYMD(end) };
    }

    if (datePreset === "custom") {
      return {
        start: fromDate || "1970-01-01",
        end: toDate || "2099-12-31",
      };
    }

    return null; // All Historical Dates
  }, [datePreset, fromDate, toDate]);

  // Filtered Expenses
  const filtered = useMemo(() => {
    return expenses.filter((d) => {
      if (categoryFilter !== "All Categories" && d.category !== categoryFilter) return false;
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (branchFilter !== "all" && d.branch_id !== branchFilter) return false;

      if (dateRangeBounds) {
        if (d.date < dateRangeBounds.start || d.date > dateRangeBounds.end) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const cat = (d.category || "").toLowerCase();
        const desc = (d.description || "").toLowerCase();
        const submitter = (d.submitted_by || "").toLowerCase();
        const branch = (d.branches?.name || "").toLowerCase();
        const amt = String(d.amount);
        const date = (d.date || "").toLowerCase();

        if (
          !cat.includes(q) &&
          !desc.includes(q) &&
          !submitter.includes(q) &&
          !branch.includes(q) &&
          !amt.includes(q) &&
          !date.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [expenses, categoryFilter, statusFilter, branchFilter, dateRangeBounds, searchQuery]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const pageEnd = Math.min(safePage * pageSize, filtered.length);
  const pagedExpenses = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Financial Aggregate KPIs
  const totalAmount = useMemo(() => filtered.reduce((s, d) => s + Number(d.amount || 0), 0), [filtered]);
  const paidAmount = useMemo(
    () => filtered.filter((d) => d.status === "paid").reduce((s, d) => s + Number(d.amount || 0), 0),
    [filtered]
  );
  const approvedAmount = useMemo(
    () => filtered.filter((d) => d.status === "approved").reduce((s, d) => s + Number(d.amount || 0), 0),
    [filtered]
  );
  const pendingAmount = useMemo(
    () => filtered.filter((d) => d.status === "pending").reduce((s, d) => s + Number(d.amount || 0), 0),
    [filtered]
  );

  // Category Breakdown Chart Data
  const categoryChartData = useMemo(() => {
    const acc: Record<string, number> = {};
    filtered.forEach((e) => {
      acc[e.category] = (acc[e.category] || 0) + Number(e.amount || 0);
    });
    return Object.entries(acc)
      .map(([name, value]) => ({
        name,
        value: +value.toFixed(2),
        fill: CATEGORY_COLORS[name] || "#253C7D",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  // Monthly Spending Timeline (Historical Cashflow Trend)
  const monthlyTimelineData = useMemo(() => {
    const acc: Record<string, { total: number; paid: number }> = {};
    expenses.forEach((e) => {
      const month = e.date ? e.date.slice(0, 7) : "Unknown";
      if (!acc[month]) acc[month] = { total: 0, paid: 0 };
      acc[month].total += Number(e.amount || 0);
      if (e.status === "paid") acc[month].paid += Number(e.amount || 0);
    });

    return Object.entries(acc)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, val]) => ({
        month,
        total: +(val.total / 1000).toFixed(1),
        paid: +(val.paid / 1000).toFixed(1),
      }));
  }, [expenses]);

  // Status Update Flow
  const updateStatus = async (id: string, status: "pending" | "approved" | "paid" | "rejected") => {
    if (!canManage) return;
    const { error } = await supabase.from("expense_records").update({ status }).eq("id", id);
    if (error) {
      toast("Error", "Failed to update status", "error");
      return;
    }

    toast("Status Updated", `Expense marked as ${STATUS_CONFIG[status]?.label || status}`, "success");
    const exp = expenses.find((e) => e.id === id);
    const logAction = status === "approved" ? "approved" : status === "rejected" ? "rejected" : "processed";
    logActivity({
      module: "finance",
      action: logAction,
      entityType: "expense_record",
      entityId: id,
      actorName,
      actorRole: role?.name || "Unknown",
      description: `${exp?.category || "Expense"} ($${exp ? Number(exp.amount).toLocaleString() : "?"}) marked ${status}`,
    });

    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    if (selectedExpense && selectedExpense.id === id) {
      setSelectedExpense({ ...selectedExpense, status });
    }
  };

  // Create Expense Flow
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.category || !expenseForm.amount || !expenseForm.date || !canManage || saving) return;
    setSaving(true);

    const { error } = await supabase.from("expense_records").insert([
      {
        category: expenseForm.category,
        branch_id: expenseForm.branch_id || null,
        amount: Number(expenseForm.amount),
        date: expenseForm.date,
        description: expenseForm.description || null,
        submitted_by: expenseForm.submitted_by || actorName,
        status: "pending",
      },
    ]);

    setSaving(false);
    if (error) {
      toast("Error", "Failed to submit expense", "error");
      return;
    }

    setModal(false);
    setExpenseForm({
      category: "Office Supplies",
      branch_id: "",
      amount: "",
      date: toYMD(new Date()),
      description: "",
      submitted_by: actorName,
    });
    toast("Expense Submitted", "New expense entry added into review queue.", "success");
    logActivity({
      module: "finance",
      action: "created",
      entityType: "expense_record",
      actorName,
      actorRole: role?.name || "Unknown",
      description: `New ${expenseForm.category} expense submitted ($${Number(expenseForm.amount).toLocaleString()})`,
    });
    loadData();
  };

  // Edit Expense Flow
  const openEditModal = (expense: Expense) => {
    if (!canManage) return;
    setExpenseForm({
      category: expense.category,
      branch_id: expense.branch_id || "",
      amount: String(expense.amount),
      date: expense.date,
      description: expense.description || "",
      submitted_by: expense.submitted_by || "",
    });
    setEditingExpense(expense);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense || !canManage || saving) return;
    setSaving(true);

    const { error } = await supabase
      .from("expense_records")
      .update({
        category: expenseForm.category,
        branch_id: expenseForm.branch_id || null,
        amount: Number(expenseForm.amount),
        date: expenseForm.date,
        description: expenseForm.description || null,
        submitted_by: expenseForm.submitted_by || null,
      })
      .eq("id", editingExpense.id);

    setSaving(false);
    if (error) {
      toast("Error", "Failed to update expense", "error");
      return;
    }

    setEditingExpense(null);
    toast("Expense Saved", "Expense record updated successfully.", "success");
    logActivity({
      module: "finance",
      action: "updated",
      entityType: "expense_record",
      entityId: editingExpense.id,
      actorName,
      actorRole: role?.name || "Unknown",
      description: `${expenseForm.category} expense record updated ($${Number(expenseForm.amount).toLocaleString()})`,
    });
    loadData();
  };

  // Soft Delete Flow
  const handleDeleteExpense = async (expense: Expense) => {
    if (!canManage) return;
    if (
      !confirm(
        `Delete this ${expense.category} expense ($${Number(
          expense.amount
        ).toLocaleString()})? It will be moved to the Recycle Bin.`
      )
    )
      return;

    const { error } = await supabase
      .from("expense_records")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", expense.id);

    if (error) {
      toast("Error", "Failed to delete expense", "error");
      return;
    }

    toast("Expense Deleted", "Moved to Recycle Bin.", "success");
    logActivity({
      module: "finance",
      action: "deleted",
      entityType: "expense_record",
      entityId: expense.id,
      actorName,
      actorRole: role?.name || "Unknown",
      description: `${expense.category} expense ($${Number(expense.amount).toLocaleString()}) moved to Recycle Bin`,
    });
    setSelectedExpense(null);
    loadData();
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast("Export", "No expenses found matching current filters", "warning");
      return;
    }

    const headers = ["Category", "Branch", "Amount", "Date", "Status", "Description", "Submitted By"];
    const rows = filtered.map((d) => [
      `"${d.category}"`,
      `"${d.branches?.name || "General"}"`,
      d.amount,
      d.date,
      d.status,
      `"${(d.description || "").replace(/"/g, '""')}"`,
      `"${d.submitted_by || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `expenses_export_${toYMD(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast("Export Complete", `Exported ${filtered.length} expense records to CSV`, "success");
  };

  // Page Window for Pagination
  const pageWindow = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  if (loading && expenses.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading financial operations...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Corporate Finance</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Expenses & Cashflow</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            Finance & Expense Management
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
              Complete Records
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Track operational spending, review branch budgets, approve expenditures, and manage company cashflow.
          </p>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-gray-200/80 hover:bg-gray-50 text-gray-700 text-xs font-bold rounded-xl shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-file-excel-2-line text-emerald-600 text-sm" />
            Export CSV
          </button>

          {canManage && (
            <button
              onClick={() => {
                setExpenseForm({
                  category: "Office Supplies",
                  branch_id: branches[0]?.id || "",
                  amount: "",
                  date: toYMD(new Date()),
                  description: "",
                  submitted_by: actorName,
                });
                setModal(true);
              }}
              className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
            >
              <i className="ri-add-circle-line text-base font-bold" />
              New Expense
            </button>
          )}
        </div>
      </div>

      {/* Executive Financial KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
        {/* Total Expenses */}
        <div
          onClick={() => setStatusFilter("all")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            statusFilter === "all" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#253C7D] uppercase tracking-wider">Total Expenses</span>
            <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
              <i className="ri-wallet-3-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-[#253C7D] mt-2">${(totalAmount / 1000).toFixed(1)}k</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            ${totalAmount.toLocaleString()} across {filtered.length} records
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
        </div>

        {/* Paid / Disbursed */}
        <div
          onClick={() => setStatusFilter("paid")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            statusFilter === "paid" ? "border-emerald-500 ring-2 ring-emerald-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Paid / Disbursed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ri-check-double-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">${(paidAmount / 1000).toFixed(1)}k</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Disbursed transactions</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Approved (Pending Payment) */}
        <div
          onClick={() => setStatusFilter("approved")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            statusFilter === "approved" ? "border-blue-500 ring-2 ring-blue-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Approved</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700 mt-2">${(approvedAmount / 1000).toFixed(1)}k</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Ready for payout</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Pending Review */}
        <div
          onClick={() => setStatusFilter("pending")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            statusFilter === "pending" ? "border-amber-500 ring-2 ring-amber-500/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Review</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i className="ri-time-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">${(pendingAmount / 1000).toFixed(1)}k</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Awaiting authorization</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Category Breakdown Horizontal Progress Bars */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <i className="ri-pie-chart-2-line text-[#253C7D]" />
                Spending by Expense Category
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Operational cost allocation across categories</p>
            </div>
            <span className="text-xs font-bold text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200/60">
              {categoryChartData.length} active categories
            </span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {categoryChartData.map((item) => {
              const maxVal = categoryChartData[0]?.value || 1;
              const pct = Math.round((item.value / (totalAmount || 1)) * 100);

              return (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-32 shrink-0 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                    <span className="text-xs font-bold text-gray-700 truncate">{item.name}</span>
                  </div>

                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(item.value / maxVal) * 100}%`,
                        backgroundColor: item.fill,
                      }}
                    />
                  </div>

                  <div className="w-24 text-right shrink-0">
                    <span className="text-xs font-black text-gray-900">${item.value.toLocaleString()}</span>
                    <span className="text-[10px] text-gray-400 font-semibold block">{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Historical Timeline Area Chart */}
        <div className="bg-white rounded-3xl border border-gray-200/80 p-6 shadow-2xs">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-1">
            <i className="ri-line-chart-line text-[#253C7D]" />
            Monthly Cashflow Trend ($k)
          </h3>
          <p className="text-xs text-gray-400 mb-3">Historical expense volume over time</p>

          {monthlyTimelineData.length > 0 ? (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTimelineData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#253C7D" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#253C7D" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      fontSize: "12px",
                    }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#253C7D" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" name="Total ($k)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-gray-400 text-xs">
              <i className="ri-line-chart-line text-3xl mb-2 text-gray-300" />
              No historical timeline data
            </div>
          )}
        </div>
      </div>

      {/* Control Bar: Search, Category, Status, Branch & Historical Date Range */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        {/* Search Input */}
        <div className="relative w-full sm:w-60">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search category, desc, user..."
            className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              <i className="ri-close-circle-fill text-xs" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold max-w-[140px] truncate"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="paid">Paid</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Branch Filter */}
          {branches.length > 0 && (
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setPage(1);
              }}
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

          {/* Historical Date Preset Dropdown */}
          <select
            value={datePreset}
            onChange={(e) => {
              setDatePreset(e.target.value as any);
              setPage(1);
            }}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold"
          >
            <option value="all">📅 All Historical Dates</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="this_quarter">This Quarter</option>
            <option value="this_year">This Year</option>
            <option value="last_year">Last Year</option>
            <option value="custom">Custom Date Range...</option>
          </select>

          {/* Custom Date Pickers */}
          {datePreset === "custom" && (
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="From"
                className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-[#253C7D]"
              />
              <span className="text-[10px] text-gray-400 font-bold">to</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="To"
                className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:border-[#253C7D]"
              />
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/60">
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "table" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-table-line" />
            </button>
            <button
              onClick={() => setViewMode("cards")}
              title="Cards View"
              className={`p-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === "cards" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-layout-grid-fill" />
            </button>
          </div>

          {/* Reset Filters */}
          {(searchQuery || categoryFilter !== "All Categories" || statusFilter !== "all" || branchFilter !== "all" || datePreset !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("All Categories");
                setStatusFilter("all");
                setBranchFilter("all");
                setDatePreset("all");
                setFromDate("");
                setToDate("");
                setPage(1);
              }}
              title="Reset Filters"
              className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <i className="ri-refresh-line text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* Expenses Data Display */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-200/80 shadow-2xs">
          <div className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
            <i className="ri-file-list-3-line" />
          </div>
          <h3 className="text-base font-bold text-gray-900">No Expense Records Found</h3>
          <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
            No entries match your selected category, date range, and filters.
          </p>
          {canManage && (
            <button
              onClick={() => setModal(true)}
              className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
            >
              + Create New Expense
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        /* Table View */
        <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Branch Location</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Transaction Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Submitted By</th>
                  <th className="px-5 py-3.5">Description / Remarks</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pagedExpenses.map((d) => {
                  const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.pending;
                  const catColor = CATEGORY_COLORS[d.category] || "#253C7D";

                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedExpense(d)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: catColor }} />
                          <span className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors">
                            {d.category}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className="font-semibold text-gray-600 bg-slate-100 px-2.5 py-0.5 rounded-full text-[11px]">
                          {d.branches?.name || "General Headquarters"}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-black text-gray-900 text-sm">
                        ${Number(d.amount).toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-bold text-gray-700">
                        {new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${cfg.bg} ${cfg.text} ${cfg.border}`}
                        >
                          <i className={cfg.icon} />
                          {cfg.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-medium text-gray-600">
                        {d.submitted_by || "Finance Team"}
                      </td>

                      <td className="px-5 py-3.5 max-w-[200px] truncate text-gray-400 text-[11px]">
                        {d.description || "—"}
                      </td>

                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {canManage && d.status === "pending" && (
                            <>
                              <button
                                onClick={() => updateStatus(d.id, "approved")}
                                className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateStatus(d.id, "rejected")}
                                className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {canManage && d.status === "approved" && (
                            <button
                              onClick={() => updateStatus(d.id, "paid")}
                              className="px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                            >
                              Mark Paid
                            </button>
                          )}

                          {canManage && (
                            <>
                              <button
                                onClick={() => openEditModal(d)}
                                className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                title="Edit"
                              >
                                <i className="ri-edit-line text-sm" />
                              </button>

                              <button
                                onClick={() => handleDeleteExpense(d)}
                                className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <i className="ri-delete-bin-line text-sm" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3.5 px-5 py-3.5 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-xs text-gray-500">
                Showing <span className="font-bold text-gray-800">{pageStart}</span>–
                <span className="font-bold text-gray-800">{pageEnd}</span> of{" "}
                <span className="font-bold text-gray-800">{filtered.length}</span> records
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-400">Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="px-2 py-1 border border-gray-200 rounded-lg text-xs bg-white text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer font-bold"
                >
                  {[10, 15, 25, 50].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <i className="ri-arrow-left-s-line font-bold" />
              </button>

              {pageWindow(safePage, totalPages).map((p, i) =>
                p === "..." ? (
                  <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      p === safePage ? "bg-[#253C7D] text-white shadow-xs" : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <i className="ri-arrow-right-s-line font-bold" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Cards View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pagedExpenses.map((d) => {
            const cfg = STATUS_CONFIG[d.status] || STATUS_CONFIG.pending;
            const catColor = CATEGORY_COLORS[d.category] || "#253C7D";

            return (
              <div
                key={d.id}
                onClick={() => setSelectedExpense(d)}
                className="bg-white rounded-3xl border border-gray-200/80 p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                        style={{ backgroundColor: catColor }}
                      >
                        <i className="ri-money-dollar-circle-line" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors truncate text-sm">
                          {d.category}
                        </h4>
                        <p className="text-[11px] text-gray-400 truncate">{d.branches?.name || "HQ"}</p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border shrink-0 ${cfg.bg} ${cfg.text} ${cfg.border}`}
                    >
                      {cfg.label}
                    </span>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-2xl space-y-1.5 text-xs mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-[11px]">Amount:</span>
                      <span className="font-black text-sm text-[#253C7D]">
                        ${Number(d.amount).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-[11px]">Date:</span>
                      <span className="font-bold text-gray-800">
                        {new Date(d.date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500 text-[11px]">Submitted By:</span>
                      <span className="font-semibold text-gray-700 truncate">{d.submitted_by || "Finance"}</span>
                    </div>
                  </div>

                  {d.description && (
                    <p className="text-[11px] text-gray-500 line-clamp-2 bg-slate-50 p-2 rounded-xl border border-gray-100 mb-2">
                      {d.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-1.5">
                  {canManage && d.status === "pending" && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(d.id, "approved");
                        }}
                        className="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                      >
                        Approve
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateStatus(d.id, "rejected");
                        }}
                        className="flex-1 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {canManage && d.status === "approved" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(d.id, "paid");
                      }}
                      className="w-full py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                    >
                      Mark as Paid
                    </button>
                  )}

                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(d);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <i className="ri-edit-line text-sm" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteExpense(d);
                        }}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete"
                      >
                        <i className="ri-delete-bin-line text-sm" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER: EXPENSE DETAIL VIEW                                               */}
      {/* ========================================================================= */}
      {selectedExpense && !modal && !editingExpense && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedExpense(null)}
          />
          <div className="relative w-full sm:w-[440px] bg-white h-full overflow-y-auto shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">Expense Transaction Details</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(selectedExpense.date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedExpense(null)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 cursor-pointer"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Amount Highlight Card */}
                <div className="p-5 bg-gradient-to-r from-[#253C7D] to-[#17254E] rounded-3xl text-white shadow-md">
                  <span className="text-[10px] font-bold text-sky-200 uppercase tracking-wider block">
                    Expenditure Amount
                  </span>
                  <p className="text-3xl font-black text-white mt-1">
                    ${Number(selectedExpense.amount).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-semibold text-white/80">{selectedExpense.category}</span>
                    <span>·</span>
                    <span className="text-xs text-white/70">{selectedExpense.branches?.name || "HQ"}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                    Approval & Payment Status
                  </span>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      STATUS_CONFIG[selectedExpense.status]?.bg
                    } ${STATUS_CONFIG[selectedExpense.status]?.text} border ${
                      STATUS_CONFIG[selectedExpense.status]?.border
                    }`}
                  >
                    <i className={STATUS_CONFIG[selectedExpense.status]?.icon} />
                    {STATUS_CONFIG[selectedExpense.status]?.label}
                  </span>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Submitted By
                    </span>
                    <p className="text-xs font-bold text-gray-900 mt-1">
                      {selectedExpense.submitted_by || "Finance Team"}
                    </p>
                  </div>

                  <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Branch Allocation
                    </span>
                    <p className="text-xs font-bold text-gray-900 mt-1">
                      {selectedExpense.branches?.name || "General HQ"}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {selectedExpense.description && (
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
                      Description & Invoicing Notes
                    </span>
                    <p className="text-xs text-gray-700 bg-gray-50 rounded-2xl p-3.5 border border-gray-100 leading-relaxed">
                      {selectedExpense.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Actions */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-3">
              {canManage && selectedExpense.status === "pending" && (
                <>
                  <button
                    onClick={() => updateStatus(selectedExpense.id, "approved")}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Approve Expense
                  </button>
                  <button
                    onClick={() => updateStatus(selectedExpense.id, "rejected")}
                    className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Reject
                  </button>
                </>
              )}

              {canManage && selectedExpense.status === "approved" && (
                <button
                  onClick={() => updateStatus(selectedExpense.id, "paid")}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Mark as Paid / Disbursed
                </button>
              )}

              {canManage && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(selectedExpense)}
                    className="p-2.5 text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors cursor-pointer"
                    title="Edit Record"
                  >
                    <i className="ri-edit-line text-sm" />
                  </button>

                  <button
                    onClick={() => handleDeleteExpense(selectedExpense)}
                    className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors cursor-pointer"
                    title="Delete Record"
                  >
                    <i className="ri-delete-bin-line text-sm" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW EXPENSE RECORD                                          */}
      {/* ========================================================================= */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !saving && setModal(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-100/80 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm">
                  <i className="ri-wallet-3-line" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Record New Expense</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Submit operational expense for review</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModal(false)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Amount ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Transaction Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Branch Allocation
                  </label>
                  <select
                    value={expenseForm.branch_id}
                    onChange={(e) => setExpenseForm({ ...expenseForm, branch_id: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    <option value="">General HQ / Unassigned</option>
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
                  Submitted By
                </label>
                <input
                  type="text"
                  value={expenseForm.submitted_by}
                  onChange={(e) => setExpenseForm({ ...expenseForm, submitted_by: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  placeholder="Your Name or Department"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Description / Invoicing Notes
                </label>
                <textarea
                  rows={2}
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Invoice number, vendor name, or expense justification..."
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !expenseForm.category || !expenseForm.amount || !expenseForm.date}
                  className="px-5 py-2 bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Submitting..." : "Submit Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT EXPENSE RECORD                                                */}
      {/* ========================================================================= */}
      {editingExpense && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => !saving && setEditingExpense(null)}
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
                  <h3 className="text-base font-bold text-gray-900">Edit Expense Record</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">Modify transaction details</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={expenseForm.category}
                    onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    {CATEGORIES.filter((c) => c !== "All Categories").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Amount ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                    Branch Allocation
                  </label>
                  <select
                    value={expenseForm.branch_id}
                    onChange={(e) => setExpenseForm({ ...expenseForm, branch_id: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                  >
                    <option value="">General HQ / Unassigned</option>
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
                  Submitted By
                </label>
                <input
                  type="text"
                  value={expenseForm.submitted_by}
                  onChange={(e) => setExpenseForm({ ...expenseForm, submitted_by: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                  Description / Invoicing Notes
                </label>
                <textarea
                  rows={2}
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:bg-white focus:outline-none focus:border-[#253C7D]"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
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
    </div>
  );
}
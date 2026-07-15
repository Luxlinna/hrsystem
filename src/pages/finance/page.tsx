import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

interface Expense {
  id: string;
  category: string;
  branch_id: string | null;
  amount: number;
  date: string;
  status: string;
  description: string | null;
  submitted_by: string | null;
  branches?: { name: string } | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  approved: "bg-blue-50 text-blue-700",
  paid: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

const categories = ["All", "Office Rent", "IT Equipment", "Travel", "Training", "Marketing", "Utilities", "Software", "Catering", "Office Supplies", "Legal", "Other"];

export default function Finance() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modal, setModal] = useState(false);
  const [newExpense, setNewExpense] = useState({ category: "", amount: "", date: "", description: "", submitted_by: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("expense_records")
      .select("*, branches(name)")
      .order("date", { ascending: false });
    setExpenses(data || []);
    setLoading(false);
  };

  const createExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.category || !newExpense.amount || !newExpense.date) return;
    await supabase.from("expense_records").insert([{
      category: newExpense.category,
      amount: Number(newExpense.amount),
      date: newExpense.date,
      description: newExpense.description || null,
      submitted_by: newExpense.submitted_by || null,
      status: "pending",
    }]);
    setModal(false);
    setNewExpense({ category: "", amount: "", date: "", description: "", submitted_by: "" });
    toast("Expense submitted", "New expense record added", "success");
    loadData();
  };

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("expense_records").update({ status }).eq("id", id);
    toast("Status updated", `Expense marked as ${status}`, "success");
    loadData();
  };

  const filtered = expenses.filter((d) => {
    const catMatch = filter === "All" || d.category === filter;
    const statusMatch = statusFilter === "all" || d.status === statusFilter;
    return catMatch && statusMatch;
  });

  const total = expenses.reduce((s, d) => s + Number(d.amount), 0);
  const paid = expenses.filter((d) => d.status === "paid").reduce((s, d) => s + Number(d.amount), 0);
  const pending = expenses.filter((d) => d.status === "pending").reduce((s, d) => s + Number(d.amount), 0);
  const approved = expenses.filter((d) => d.status === "approved").reduce((s, d) => s + Number(d.amount), 0);

  // Simple bar chart data by category
  const byCategory = expenses.reduce(
    (acc, e) => { acc[e.category] = (acc[e.category] || 0) + Number(e.amount); return acc; },
    {} as Record<string, number>
  );
  const maxCat = Math.max(...Object.values(byCategory), 1);

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-[#FAFAF8]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Finance Management</h1>
          <p className="text-[13px] text-gray-500 mt-1">Track expenses, budgets, and financial operations across branches</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="px-4 py-2.5 bg-[#0D7377] text-white text-[13px] font-semibold rounded-lg hover:bg-[#0a5c60] whitespace-nowrap"
        >
          <i className="ri-add-line mr-1" /> New Expense
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#0D7377]/10 rounded-xl p-5">
          <p className="text-xl font-bold text-[#0D7377]">${total.toLocaleString()}</p>
          <p className="text-[12px] font-medium text-[#0D7377]/70 mt-1">Total Expenses (May)</p>
        </div>
        <div className="bg-green-50 rounded-xl p-5">
          <p className="text-xl font-bold text-green-700">${paid.toLocaleString()}</p>
          <p className="text-[12px] font-medium text-green-600 mt-1">Paid</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-5">
          <p className="text-xl font-bold text-blue-700">${approved.toLocaleString()}</p>
          <p className="text-[12px] font-medium text-blue-600 mt-1">Approved</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-5">
          <p className="text-xl font-bold text-amber-700">${pending.toLocaleString()}</p>
          <p className="text-[12px] font-medium text-amber-600 mt-1">Pending</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-8">
        <h3 className="text-[14px] font-bold text-[#1A1A1A] mb-4">Spending by Category</h3>
        <div className="space-y-3">
          {Object.entries(byCategory).sort((a, b) => b[1] - a[1]).map(([cat, amt]) => (
            <div key={cat} className="flex items-center gap-4">
              <span className="text-[12px] text-gray-600 w-32 shrink-0 truncate">{cat}</span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-[#0D7377] rounded-full" style={{ width: `${(amt / maxCat) * 100}%` }} />
              </div>
              <span className="text-[12px] font-semibold text-gray-900 w-20 text-right shrink-0">${amt.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {categories.slice(0, 6).map((c) => (
            <button
              key={c}
              onClick={() => setFilter(c)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors whitespace-nowrap ${
                filter === c ? "bg-[#0D7377] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {["all", "pending", "approved", "paid"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-medium capitalize transition-colors whitespace-nowrap ${
                statusFilter === s ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-10 h-10 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider items-center">
            <span>Category</span>
            <span>Branch</span>
            <span>Amount</span>
            <span>Date</span>
            <span>Status</span>
            <span>Submitted By</span>
            <span>Action</span>
          </div>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500 text-[13px]">No expenses found</div>
          ) : (
            filtered.map((d) => (
              <div key={d.id} className="grid grid-cols-7 px-5 py-4 border-t border-gray-50 items-center">
                <span className="text-[13px] font-medium text-gray-900">{d.category}</span>
                <span className="text-[13px] text-gray-600">{d.branches?.name || "—"}</span>
                <span className="text-[13px] font-semibold text-gray-900">${Number(d.amount).toLocaleString()}</span>
                <span className="text-[13px] text-gray-500">{new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                <span className={`inline-flex text-[11px] font-semibold px-2 py-1 rounded-full w-fit capitalize ${statusColors[d.status] || "bg-gray-50 text-gray-600"}`}>
                  {d.status}
                </span>
                <span className="text-[13px] text-gray-500">{d.submitted_by || "—"}</span>
                <div className="flex gap-1">
                  {d.status === "pending" && (
                    <>
                      <button onClick={() => updateStatus(d.id, "approved")} className="text-[11px] text-blue-600 font-medium hover:underline">Approve</button>
                      <button onClick={() => updateStatus(d.id, "rejected")} className="text-[11px] text-red-500 font-medium hover:underline ml-2">Reject</button>
                    </>
                  )}
                  {d.status === "approved" && (
                    <button onClick={() => updateStatus(d.id, "paid")} className="text-[11px] text-green-600 font-medium hover:underline">Mark Paid</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* New Expense Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">New Expense</h3>
              <button onClick={() => setModal(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <i className="ri-close-line text-xl text-gray-500" />
              </button>
            </div>
            <form onSubmit={createExpense} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Category</label>
                  <select required value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377] bg-white">
                    <option value="">Select</option>
                    {categories.slice(1).map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1">Amount ($)</label>
                  <input type="number" required min="0" step="0.01" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Date</label>
                <input type="date" required value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Description</label>
                <input value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="Optional details" />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">Submitted By</label>
                <input value={newExpense.submitted_by} onChange={(e) => setNewExpense({ ...newExpense, submitted_by: e.target.value })} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]" placeholder="Your name" />
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#0D7377] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60]">Submit Expense</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
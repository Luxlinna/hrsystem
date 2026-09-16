import { memo, useState, useCallback } from "react";
import type { EmployeeRateItemSetting } from "../types";

interface RateItemsTabProps {
  rateItems: EmployeeRateItemSetting[];
  loading: boolean;
  saving: boolean;
  onSave: (item: Partial<EmployeeRateItemSetting> & { name: string }) => Promise<boolean>;
  onToggleStatus: (id: string, currentStatus: "active" | "inactive") => void;
  onDelete: (id: string) => void;
}

export const RateItemsTab = memo(function RateItemsTab({
  rateItems,
  loading,
  saving,
  onSave,
  onToggleStatus,
  onDelete,
}: RateItemsTabProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<EmployeeRateItemSetting | null>(null);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState(0);
  const [remark, setRemark] = useState("");

  const handleOpenAdd = useCallback(() => {
    setEditingItem(null);
    setName("");
    setAmount(0);
    setRemark("");
    setModalOpen(true);
  }, []);

  const handleOpenEdit = useCallback((item: EmployeeRateItemSetting) => {
    setEditingItem(item);
    setName(item.name);
    setAmount(item.default_amount || 0);
    setRemark(item.remark || "");
    setModalOpen(true);
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
      const ok = await onSave({
        id: editingItem?.id,
        name: name.trim(),
        default_amount: amount,
        remark: remark.trim(),
        status: editingItem?.status || "active",
        display_order: editingItem?.display_order ?? rateItems.length + 1,
      });
      if (ok) setModalOpen(false);
    },
    [name, amount, remark, editingItem, rateItems.length, onSave]
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Payroll Rate & Allowance Items</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage allowance items available for employee compensation packages.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-lg hover:bg-[#1E3066] transition-colors cursor-pointer shadow-xs self-start"
        >
          <i className="ri-add-line text-sm" />
          Add Rate Item
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Loading rate items...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                <th className="px-4 py-3">Item Name</th>
                <th className="px-4 py-3">Default Amount</th>
                <th className="px-4 py-3">Remark</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rateItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-800">{item.name}</td>
                  <td className="px-4 py-3 font-medium text-slate-700">${item.default_amount || 0}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate" title={item.remark || ""}>
                    {item.remark || "—"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleStatus(item.id, item.status)}
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border cursor-pointer transition-colors ${
                        item.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200"
                      }`}
                    >
                      {item.status === "active" ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="w-7 h-7 inline-flex items-center justify-center text-slate-400 hover:text-[#253C7D] hover:bg-slate-100 rounded transition-colors cursor-pointer"
                    >
                      <i className="ri-edit-line text-sm" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete rate item "${item.name}"?`)) onDelete(item.id);
                      }}
                      className="w-7 h-7 inline-flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                    >
                      <i className="ri-delete-bin-line text-sm" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit/Add Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in zoom-in-95">
            <h4 className="text-sm font-bold text-slate-900 mb-4">
              {editingItem ? "Edit Rate Item" : "New Rate Item"}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Gasoline, Meal Allowance"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-[#253C7D]"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Default Amount ($)</label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-[#253C7D]"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">Remark</label>
                <textarea
                  rows={3}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Notes or conditions..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:border-[#253C7D]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 font-bold text-white bg-[#253C7D] hover:bg-[#1E3066] rounded-lg shadow-xs disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
});

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useEmployeePermission } from "../hooks/useEmployeePermission";
import { useEmployeeSettings } from "./useEmployeeSettings";
import { useEmployeeRateItems } from "./useEmployeeRateItems";
import { useEmployeeFields } from "./useEmployeeFields";
import { GeneralSettingTab } from "./tabs/GeneralSettingTab";
import { EmployeeFieldsTab } from "./tabs/EmployeeFieldsTab";
import { RateItemsTab } from "./tabs/RateItemsTab";
import type { EmployeeSettingTab } from "./types";

export default function EmployeeSettingsPage() {
  const navigate = useNavigate();
  const { canManageEmployeeSettings } = useEmployeePermission();
  const [activeTab, setActiveTab] = useState<EmployeeSettingTab>("employee-setting");

  const {
    settings,
    loading: loadingSettings,
    saving: savingSettings,
    handleChange,
    applySettings,
  } = useEmployeeSettings();

  const {
    rateItems,
    loading: loadingRateItems,
    saving: savingRateItems,
    saveRateItem,
    toggleStatus: toggleRateItemStatus,
    deleteRateItem,
  } = useEmployeeRateItems();

  const {
    fields,
    loading: loadingFields,
    toggleRequired,
    toggleEnabled,
  } = useEmployeeFields();

  if (!canManageEmployeeSettings) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center py-24 space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto text-3xl">
          <i className="ri-shield-cross-line" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Access Restricted</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          You do not have permission to configure employee settings. Please contact your SuperAdmin or BU CEO.
        </p>
        <button
          onClick={() => navigate("/employees")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl"
        >
          <i className="ri-arrow-left-line" />
          Back to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            <Link to="/employees" className="hover:text-slate-600 transition-colors">
              Employee Directory
            </Link>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Settings</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Employee Setting
          </h1>
        </div>
        <Link
          to="/employees"
          className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <i className="ri-arrow-left-line" />
          Back to Directory
        </Link>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveTab("employee-setting")}
            className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "employee-setting"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Employee Setting
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("employee-field")}
            className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "employee-field"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Employee Field
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("rate-item")}
            className={`pb-3 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "rate-item"
                ? "border-sky-600 text-sky-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Rate Item
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8">
        {activeTab === "employee-setting" && (
          loadingSettings ? (
            <div className="py-20 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading settings...
            </div>
          ) : (
            <GeneralSettingTab
              settings={settings}
              onChange={handleChange}
              onApply={applySettings}
              saving={savingSettings}
            />
          )
        )}

        {activeTab === "employee-field" && (
          <EmployeeFieldsTab
            fields={fields}
            loading={loadingFields}
            onToggleRequired={toggleRequired}
            onToggleEnabled={toggleEnabled}
          />
        )}

        {activeTab === "rate-item" && (
          <RateItemsTab
            rateItems={rateItems}
            loading={loadingRateItems}
            saving={savingRateItems}
            onSave={saveRateItem}
            onToggleStatus={toggleRateItemStatus}
            onDelete={deleteRateItem}
          />
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { supabase } from "@/lib/supabase";
import { uploadMultipleFilesToS3 } from "@/lib/s3-storage";
import { toast } from "@/components/Toast";
import { getBranchCode } from "../../constants";
import { AssetModal } from "@/pages/it/components/modals/AssetModal";
import { INITIAL_ASSET_FORM } from "@/pages/it/constants";
import type { AssetFormState } from "@/pages/it/types";
import type { EmployeeFormState, EmployeeAssetBookingItem, EmployeeAssetAttachment } from "../../types";

interface AddEmployeeAssetTabProps {
  form: EmployeeFormState;
  onChange: (field: keyof EmployeeFormState, value: any) => void;
  cleanBranches?: Array<{ id: string; name: string; location: string | null }>;
  currentBranch?: { id: string; name: string; location: string | null } | null;
}

interface AvailableAsset {
  id: string;
  name: string;
  category: string;
  tag: string;
  typeBadge?: string;
  serial?: string;
  branch_id?: string | null;
  branch_name?: string | null;
  branch_code?: string | null;
}

export const AddEmployeeAssetTab: React.FC<AddEmployeeAssetTabProps> = memo(
  function AddEmployeeAssetTab({ form, onChange, cleanBranches = [], currentBranch = null }) {
    // Local branches state if not passed from parent
    const [fetchedBranches, setFetchedBranches] = useState<
      Array<{ id: string; name: string; location: string | null }>
    >([]);

    // Fetch branches from Supabase if parent did not provide cleanBranches
    useEffect(() => {
      if (cleanBranches && cleanBranches.length > 0) return;
      supabase
        .from("branches")
        .select("id, name, location")
        .is("deleted_at", null)
        .order("name")
        .then(({ data, error }) => {
          if (!error && data) {
            setFetchedBranches(data);
          }
        });
    }, [cleanBranches]);

    const allBranches = useMemo(() => {
      if (cleanBranches && cleanBranches.length > 0) return cleanBranches;
      return fetchedBranches;
    }, [cleanBranches, fetchedBranches]);

    // Determine current employee's BU details
    const employeeBuId = form.branch_id || currentBranch?.id || "";
    const employeeBuName =
      form.bu_full_name ||
      currentBranch?.name ||
      allBranches.find((b) => b.id === employeeBuId)?.name ||
      "";
    const employeeBuCode =
      form.code_bu || (employeeBuName ? getBranchCode(employeeBuName) : "BU");

    // Top Assign Info form state
    const [assignFor, setAssignFor] = useState<"Full Day" | "Half Day" | "Hourly">("Full Day");
    const [fromDate, setFromDate] = useState<string>(
      form.start_date || new Date().toISOString().split("T")[0]
    );
    const [toDateNever, setToDateNever] = useState<boolean>(true);
    const [toDate, setToDate] = useState<string>(
      form.start_date || new Date().toISOString().split("T")[0]
    );
    const [assignRemark, setAssignRemark] = useState<string>("");

    // Selected rows in main table for bulk deletion
    const [selectedBookingIds, setSelectedBookingIds] = useState<string[]>([]);

    // Select Asset Modal state
    const [showAssetModal, setShowAssetModal] = useState(false);
    const [systemAssets, setSystemAssets] = useState<AvailableAsset[]>([]);
    const [loadingAssets, setLoadingAssets] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [modalSelectedIds, setModalSelectedIds] = useState<string[]>([]);

    // Create Asset Inventory Modal state
    const [showCreateInventoryModal, setShowCreateInventoryModal] = useState(false);
    const [savingInventory, setSavingInventory] = useState(false);
    const [inventoryForm, setInventoryForm] = useState<AssetFormState>({
      ...INITIAL_ASSET_FORM,
      branch_id: employeeBuId || "",
      site: employeeBuName || "",
    });

    // Attachments Handling
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const assetBookings: EmployeeAssetBookingItem[] = form.asset_bookings || [];
    const assetAttachments: EmployeeAssetAttachment[] = form.asset_attachments || [];

    // Fetch real system IT assets strictly from it_assets table in Supabase
    const fetchAssets = useCallback(async () => {
      setLoadingAssets(true);
      try {
        let { data, error } = await supabase
          .from("it_assets")
          .select("id, name, asset_tag, type, category, status, serial_number, site, branch_id, branches(id, name, location)")
          .is("deleted_at", null)
          .order("name", { ascending: true });

        // Graceful fallback if custom columns (category, site) haven't been migrated yet
        if (error) {
          const fallbackRes = await supabase
            .from("it_assets")
            .select("id, name, asset_tag, type, status, serial_number, branch_id, branches(id, name, location)")
            .is("deleted_at", null)
            .order("name", { ascending: true });
          data = fallbackRes.data;
          error = fallbackRes.error;
        }

        const dbAssets: AvailableAsset[] = [];
        if (!error && data && data.length > 0) {
          data.forEach((a: any) => {
            const bObj = Array.isArray(a.branches) ? a.branches[0] : a.branches;
            const bName =
              bObj?.name ||
              allBranches.find((b) => b.id === a.branch_id)?.name ||
              allBranches.find((b) => a.site && b.name.toLowerCase() === a.site.toLowerCase())?.name ||
              a.site ||
              null;
            const bCode = bName ? getBranchCode(bName) : null;
            const catDisplay = a.category || a.type || "Asset";

            dbAssets.push({
              id: a.id,
              name: a.name,
              category: `${catDisplay}: ${a.name} (${a.asset_tag || "N/A"})`,
              tag: a.asset_tag || "N/A",
              typeBadge: catDisplay,
              serial: a.serial_number || undefined,
              branch_id: a.branch_id || null,
              branch_name: bName,
              branch_code: bCode,
            });
          });
        }

        // Show strictly real assets from the database without synthetic mock templates
        setSystemAssets(dbAssets);
      } catch (err) {
        console.warn("Could not fetch real it_assets:", err);
        setSystemAssets([]);
      } finally {
        setLoadingAssets(false);
      }
    }, [allBranches]);

    useEffect(() => {
      fetchAssets();
    }, [fetchAssets]);

    // Handle saving new inventory asset from CREATE ASSET INVENTORY form
    const handleSaveNewInventory = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inventoryForm.name || savingInventory) return;
      setSavingInventory(true);

      const resolvedBranch = inventoryForm.branch_id || employeeBuId || null;
      const resolvedTag =
        inventoryForm.asset_tag?.trim() ||
        `AST-${Math.floor(1000 + Math.random() * 9000)}`;
      const resolvedCategory = inventoryForm.category || inventoryForm.type || "Other";
      const resolvedType =
        resolvedCategory.includes("Laptop") ? "Laptop" :
        resolvedCategory.includes("Desktop") ? "Display" :
        resolvedCategory.includes("Display") || resolvedCategory.includes("Monitor") ? "Display" :
        resolvedCategory.includes("Mobile") || resolvedCategory.includes("Phone") ? "Mobile" :
        resolvedCategory.includes("Peripheral") ? "Peripheral" :
        resolvedCategory.includes("Furniture") ? "Furniture" :
        resolvedCategory.includes("Server") ? "Server" :
        resolvedCategory.includes("Network") ? "Network" : "Other";

      try {
        let insertRes = await supabase
          .from("it_assets")
          .insert([
            {
              name: inventoryForm.name,
              asset_tag: resolvedTag,
              type: resolvedType,
              category: resolvedCategory,
              purchase_date: inventoryForm.purchase_date || null,
              description: inventoryForm.description || null,
              condition: inventoryForm.condition || "New",
              price: Number(inventoryForm.price) || 0,
              price_currency: inventoryForm.price_currency || "USD",
              site: inventoryForm.site || null,
              branch_id: resolvedBranch,
              status: "inventory",
              photo_url: inventoryForm.photo_url || null,
              attachments: inventoryForm.attachments || [],
            },
          ])
          .select("id, name, asset_tag")
          .single();

        // Graceful fallback if custom columns do not exist yet in Supabase
        if (insertRes.error) {
          console.warn("Retrying asset insert with core columns:", insertRes.error);
          insertRes = await supabase
            .from("it_assets")
            .insert([
              {
                name: inventoryForm.name,
                asset_tag: resolvedTag,
                type: resolvedType,
                branch_id: resolvedBranch,
                status: "inventory",
              },
            ])
            .select("id, name, asset_tag")
            .single();
        }

        if (!insertRes.error && insertRes.data) {
          toast("Asset Registered", `Created asset "${inventoryForm.name}" in inventory.`, "success");
          setShowCreateInventoryModal(false);
          await fetchAssets();
        } else {
          toast("Error", insertRes.error?.message || "Could not create asset inventory", "error");
        }
      } catch (err: any) {
        console.error("Asset creation error:", err);
        toast("Error", err?.message || "Failed to create asset", "error");
      } finally {
        setSavingInventory(false);
      }
    };

    // Filter available assets in modal strictly to employee's assigned BU from Step 2
    const filteredCatalog = useMemo(() => {
      return systemAssets.filter((item) => {
        // Must belong to current employee's BU (selected in Step 2)
        if (employeeBuId || employeeBuName) {
          const matchesBranchId = Boolean(employeeBuId && item.branch_id === employeeBuId);
          const matchesBranchName = Boolean(
            employeeBuName &&
            item.branch_name &&
            item.branch_name.toLowerCase().trim() === employeeBuName.toLowerCase().trim()
          );

          if (!matchesBranchId && !matchesBranchName) {
            return false;
          }
        }

        // Search Query
        const matchesSearch =
          !searchQuery.trim() ||
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tag.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.branch_name || "").toLowerCase().includes(searchQuery.toLowerCase());

        // Category Filter
        const matchesCat =
          categoryFilter === "All" ||
          item.typeBadge?.toLowerCase() === categoryFilter.toLowerCase() ||
          item.category.toLowerCase().includes(categoryFilter.toLowerCase());

        return matchesSearch && matchesCat;
      });
    }, [systemAssets, employeeBuId, employeeBuName, searchQuery, categoryFilter]);

    const uniqueCategories = useMemo(() => {
      const buAssets = systemAssets.filter((item) => {
        if (!employeeBuId && !employeeBuName) return true;
        const matchesBranchId = Boolean(employeeBuId && item.branch_id === employeeBuId);
        const matchesBranchName = Boolean(
          employeeBuName &&
          item.branch_name &&
          item.branch_name.toLowerCase().trim() === employeeBuName.toLowerCase().trim()
        );
        return matchesBranchId || matchesBranchName;
      });
      return [
        "All",
        ...Array.from(new Set(buAssets.map((a) => a.typeBadge || "Electronic Hardware"))),
      ];
    }, [systemAssets, employeeBuId, employeeBuName]);

    // Open Modal
    const handleOpenModal = () => {
      setModalSelectedIds([]);
      setSearchQuery("");
      setCategoryFilter("All");
      setShowAssetModal(true);
    };

    // Toggle Modal Checkbox
    const handleToggleModalAsset = (id: string) => {
      setModalSelectedIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    };

    // Toggle All Modal Checkboxes
    const handleToggleAllModal = () => {
      if (modalSelectedIds.length === filteredCatalog.length) {
        setModalSelectedIds([]);
      } else {
        setModalSelectedIds(filteredCatalog.map((a) => a.id));
      }
    };

    // Confirm Asset Selection
    const handleConfirmAssetSelection = () => {
      const selectedItems = systemAssets.filter((a) => modalSelectedIds.includes(a.id));
      if (!selectedItems.length) {
        toast("No Assets Selected", "Please tick at least one asset to assign.", "info");
        return;
      }

      const newBookings: EmployeeAssetBookingItem[] = selectedItems.map((item) => ({
        id: `${item.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        name: item.name,
        category: item.category,
        tag: item.tag,
        assign_for: assignFor,
        from_date: fromDate,
        to_date_never: toDateNever,
        to_date: toDateNever ? "Never" : toDate,
        remark: assignRemark.trim() || `Assigned from ${item.branch_name || employeeBuName || "BU Inventory"} on employee hiring setup.`,
        status: "Assigned",
        branch_id: item.branch_id || employeeBuId || null,
        bu_name: item.branch_name || employeeBuName || "General BU",
        bu_code: item.branch_code || employeeBuCode || "BU",
      }));

      const updated = [...assetBookings, ...newBookings];
      onChange("asset_bookings", updated);
      setShowAssetModal(false);
      toast("Assets Booked", `Assigned ${newBookings.length} asset(s) to employee.`, "success");
    };

    // Toggle Table Row Selection
    const handleToggleTableRow = (id: string) => {
      setSelectedBookingIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
      );
    };

    // Toggle All Table Rows
    const handleToggleAllTable = () => {
      if (selectedBookingIds.length === assetBookings.length) {
        setSelectedBookingIds([]);
      } else {
        setSelectedBookingIds(assetBookings.map((b) => b.id));
      }
    };

    // Remove Selected Assets
    const handleRemoveSelectedAssets = () => {
      if (!selectedBookingIds.length) {
        toast("Selection Required", "Tick the checkbox of assets you want to remove.", "info");
        return;
      }
      const updated = assetBookings.filter((b) => !selectedBookingIds.includes(b.id));
      onChange("asset_bookings", updated);
      setSelectedBookingIds([]);
      toast("Assets Removed", "Removed selected assets from booking.", "info");
    };

    // Attachments Handling with AWS S3
    const handleFiles = async (fileList: FileList | File[] | null) => {
      if (!fileList || !fileList.length) return;
      const fileArray = Array.from(fileList);

      setUploading(true);
      try {
        const uploaded = await uploadMultipleFilesToS3(fileArray, "employees/asset-attachments");
        const newItems: EmployeeAssetAttachment[] = uploaded.map((item) => ({
          name: item.name,
          url: item.url,
          size: item.size,
          type: item.type,
          uploaded_at: new Date().toISOString(),
          key: item.key,
        }));

        const updated = [...assetAttachments, ...newItems];
        onChange("asset_attachments", updated);
        toast("Stored on AWS S3", `Attached ${fileArray.length} asset handover document(s).`, "success");
      } catch (err) {
        console.error("Asset document upload error:", err);
        toast("Upload Failed", err instanceof Error ? err.message : "Could not upload file to AWS S3", "error");
      } finally {
        setUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
    };

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    }, [assetAttachments]);

    const handleRemoveAttachment = (idx: number) => {
      const updated = assetAttachments.filter((_, i) => i !== idx);
      onChange("asset_attachments", updated);
      toast("Attachment Removed", "Handover attachment removed.", "info");
    };

    const formatFileSize = (bytes?: number) => {
      if (!bytes) return "";
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
      <div className="space-y-6 w-full">
        {/* Top Header Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/90 via-sky-50/40 to-white border border-blue-200/80 flex items-start gap-3.5 shadow-2xs">
          <div className="w-9 h-9 rounded-xl bg-[#253C7D] text-white flex items-center justify-center shrink-0 shadow-xs">
            <i className="ri-computer-line text-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-black text-slate-900 tracking-wide">
                Asset Assignment &amp; BU Inventory Booking
              </h3>
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200/60">
                Step 5 of 6
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium mt-0.5 leading-relaxed">
              Book corporate hardware, workstations, laptops, accessories, and SIM cards scoped by Business Unit (BU) with AWS S3 custody agreements.
            </p>
          </div>
        </div>

        {/* BU Context Pill Banner */}
        <div className="p-3.5 bg-slate-50/80 border border-slate-200 rounded-xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center text-xs shrink-0 shadow-2xs">
              <i className="ri-building-2-fill text-xs" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  Target Business Unit (BU):
                </span>
                {employeeBuName ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300/80 text-xs font-black">
                    <span className="font-mono bg-emerald-200/70 text-emerald-900 px-1 py-0.2 rounded text-[10px]">
                      {employeeBuCode}
                    </span>
                    <span>{employeeBuName}</span>
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex items-center gap-1">
                    <i className="ri-information-line text-xs" />
                    No BU selected in Step 2 (Organizational Placement) — using General Inventory
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                Assets booked here are registered under this employee and deducted from the respective BU's physical inventory pool.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <span className="font-extrabold text-[#253C7D]">{assetBookings.length}</span> Asset{assetBookings.length === 1 ? "" : "s"} Assigned
            </span>
          </div>
        </div>

        {/* 1. ASSIGN INFO SECTION */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-5">
          <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
            ASSIGN INFO
          </h3>

          <div className="space-y-4 max-w-2xl">
            {/* Assign For Radio Options */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <label className="sm:col-span-3 text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
                Assign For
              </label>
              <div className="sm:col-span-9 flex items-center gap-6">
                {(["Full Day", "Half Day", "Hourly"] as const).map((opt) => (
                  <label key={opt} className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="assignForRadio"
                      value={opt}
                      checked={assignFor === opt}
                      onChange={() => setAssignFor(opt)}
                      className="w-4 h-4 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                    />
                    <span>{opt}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* From Date */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <label className="sm:col-span-3 text-xs font-bold text-slate-700 sm:text-right sm:pr-4">
                From Date <span className="text-rose-500">*</span>
              </label>
              <div className="sm:col-span-9">
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>

            {/* To Date */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
              <label className="sm:col-span-3 text-xs font-bold text-slate-700 sm:text-right sm:pr-4 sm:pt-2">
                To Date <span className="text-rose-500">*</span>
              </label>
              <div className="sm:col-span-9 space-y-2">
                <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
                  <input
                    type="radio"
                    name="toDateChoice"
                    checked={toDateNever}
                    onChange={() => setToDateNever(true)}
                    className="w-4 h-4 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                  />
                  <span>Never</span>
                </label>

                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-700">
                    <input
                      type="radio"
                      name="toDateChoice"
                      checked={!toDateNever}
                      onChange={() => setToDateNever(false)}
                      className="w-4 h-4 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                    />
                  </label>
                  <input
                    type="date"
                    disabled={toDateNever}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-xl bg-white border text-xs font-semibold focus:outline-none focus:border-[#253C7D] ${
                      toDateNever ? "border-slate-200 bg-slate-50 text-slate-400" : "border-slate-300 text-slate-900"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Remark Textarea */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
              <label className="sm:col-span-3 text-xs font-bold text-slate-700 sm:text-right sm:pr-4 sm:pt-2">
                Remark <span className="text-rose-500">*</span>
              </label>
              <div className="sm:col-span-9">
                <textarea
                  rows={3}
                  value={assignRemark}
                  onChange={(e) => setAssignRemark(e.target.value)}
                  placeholder="Remark / Serial number / Handover condition / BU allocation..."
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#253C7D] resize-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. ASSET BOOKING INFO SECTION (With BU Column) */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider">
                ASSET BOOKING INFO
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Physical assets allocated to this employee across Business Units.
              </p>
            </div>

            {/* Action Buttons: Remove Asset & Add Asset */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={handleRemoveSelectedAssets}
                disabled={selectedBookingIds.length === 0}
                className="px-3.5 py-1.5 rounded-lg border border-rose-400 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs"
              >
                <i className="ri-delete-bin-line text-sm" />
                <span>Remove Asset</span>
              </button>

              <button
                type="button"
                onClick={handleOpenModal}
                className="px-4 py-1.5 rounded-lg bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
              >
                <i className="ri-add-circle-line text-sm" />
                <span>Add Asset (Select by BU)</span>
              </button>
            </div>
          </div>

          {/* Asset Bookings Table */}
          <div className="border border-slate-200 rounded-xl overflow-x-auto shadow-2xs">
            <table className="w-full text-xs text-left min-w-[760px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={assetBookings.length > 0 && selectedBookingIds.length === assetBookings.length}
                      onChange={handleToggleAllTable}
                      className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] border-slate-300 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3 w-12 text-center">No.</th>
                  <th className="py-2.5 px-3">Asset</th>
                  <th className="py-2.5 px-3">Business Unit (BU)</th>
                  <th className="py-2.5 px-3">Assign Date</th>
                  <th className="py-2.5 px-3">Remark</th>
                  <th className="py-2.5 px-3 w-28 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {assetBookings.length > 0 ? (
                  assetBookings.map((booking, idx) => (
                    <tr
                      key={booking.id || idx}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        selectedBookingIds.includes(booking.id) ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedBookingIds.includes(booking.id)}
                          onChange={() => handleToggleTableRow(booking.id)}
                          className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] border-slate-300 cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-semibold">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span>{booking.name}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-mono border border-slate-200">
                            {booking.tag}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-normal mt-0.5">{booking.category}</p>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#253C7D] border border-blue-200/80 text-[11px] font-extrabold">
                          <i className="ri-building-line text-xs" />
                          <span>{booking.bu_name || employeeBuName || "Head Office"}</span>
                          {booking.bu_code && (
                            <span className="font-mono text-[9px] bg-blue-200/60 px-1 rounded text-blue-900 ml-0.5">
                              {booking.bu_code}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 font-medium">
                        {booking.from_date} {booking.to_date_never ? "(Permanent)" : `to ${booking.to_date}`}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">{booking.remark || "-"}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                          {booking.status || "Assigned"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400 font-semibold text-xs">
                      <div className="flex flex-col items-center justify-center">
                        <i className="ri-inbox-line text-2xl text-slate-300 mb-1" />
                        <span>No assets booked yet. Click "Add Asset (Select by BU)" to allocate hardware.</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. ATTACHMENT INFO SECTION (Direct AWS S3 Storage) */}
        <div className="p-6 bg-white border border-slate-200/90 rounded-2xl shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-[#253C7D] uppercase tracking-wider flex items-center gap-2">
              <span>ATTACHMENT INFO</span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200/70 inline-flex items-center gap-1">
                <i className="ri-amazon-line text-xs" /> AWS S3
              </span>
            </h3>
            {assetAttachments.length > 0 && (
              <span className="text-[11px] font-bold text-slate-500">
                {assetAttachments.length} file{assetAttachments.length > 1 ? "s" : ""} attached
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
            <label className="md:col-span-3 text-xs font-bold text-slate-700 md:text-right md:pt-3 md:pr-8">
              Attachment
            </label>
            <div className="md:col-span-9 space-y-3">
              {/* Dropzone with AWS S3 integration */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-7 flex flex-col items-center justify-center cursor-pointer transition-all group shadow-2xs ${
                  isDragOver
                    ? "border-[#253C7D] bg-blue-50/50 scale-[1.005]"
                    : "border-slate-300 hover:border-[#253C7D] bg-white hover:bg-slate-50/60"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />

                <div className="w-12 h-12 rounded-full bg-blue-50/90 text-[#253C7D] flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform shadow-xs">
                  {uploading ? (
                    <i className="ri-loader-4-line text-2xl text-blue-600 animate-spin" />
                  ) : (
                    <i className="ri-upload-cloud-2-line text-2xl text-[#253C7D]" />
                  )}
                </div>

                <p className="text-xs font-bold text-slate-700 text-center">
                  {uploading ? (
                    <span className="text-[#253C7D] animate-pulse">Uploading handover document to AWS S3...</span>
                  ) : (
                    <>
                      Drop file here or <span className="text-[#253C7D] underline font-extrabold">Browse</span>
                    </>
                  )}
                </p>

                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-400 font-medium">
                  <span>Signed asset agreement, custody forms, serial photos</span>
                  <span>•</span>
                  <span className="text-emerald-600 font-semibold inline-flex items-center gap-1">
                    <i className="ri-shield-check-line text-xs" /> Cloud Encrypted
                  </span>
                </div>
              </div>

              {/* Uploaded Documents List */}
              {assetAttachments.length > 0 && (
                <div className="space-y-2 pt-1">
                  {assetAttachments.map((fileItem, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50/90 border border-slate-200 text-xs text-slate-800 hover:border-slate-300 hover:bg-white transition-all shadow-2xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#253C7D] flex items-center justify-center shrink-0 border border-blue-100">
                          {fileItem.name.toLowerCase().endsWith(".pdf") ? (
                            <i className="ri-file-pdf-line text-base text-rose-500" />
                          ) : fileItem.name.match(/\.(jpg|jpeg|png|webp)$/i) ? (
                            <i className="ri-image-line text-base text-emerald-600" />
                          ) : (
                            <i className="ri-file-text-line text-base text-[#253C7D]" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-slate-800 text-xs leading-tight">
                            {fileItem.name}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            {fileItem.size ? <span>{formatFileSize(fileItem.size)}</span> : null}
                            <span className="inline-flex items-center gap-0.5 text-amber-600 font-bold bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/50">
                              <i className="ri-cloud-line text-[10px]" /> AWS S3
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {fileItem.url && (
                          <a
                            href={fileItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-[#253C7D] hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center"
                            title="Open / Download Document from AWS S3"
                          >
                            <i className="ri-external-link-line text-sm" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove Attachment"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4. SELECT ASSET MODAL — SCOPED BY EACH BU */}
        {showAssetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[88vh] border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-4 px-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#253C7D] text-white flex items-center justify-center text-sm shadow-xs">
                    <i className="ri-archive-line" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#253C7D] uppercase tracking-wide">
                      SELECT ASSET FROM BU INVENTORY
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Physical IT assets available for Business Unit:{" "}
                      <span className="font-bold text-[#253C7D]">{employeeBuName || "Assigned BU"}</span>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>

              {/* DEDICATED BU SCOPE BAR (Strictly Locked to Step 2 Selection) */}
              <div className="px-6 py-3 bg-gradient-to-r from-blue-50/80 via-slate-50 to-indigo-50/40 border-b border-slate-200/80 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="ri-building-line text-[#253C7D]" />
                    <span>Business Unit (BU):</span>
                  </span>

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-[#253C7D] border border-blue-200 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-black">
                      {employeeBuName || "Assigned Business Unit"}
                    </span>
                    {employeeBuCode && (
                      <span className="text-[10px] font-mono font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-[#253C7D]">
                        [{employeeBuCode}]
                      </span>
                    )}
                    <span className="text-[10px] font-bold text-slate-400 border-l border-slate-200 pl-2">
                      Selected in Step 2
                    </span>
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-600">
                  <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#253C7D] font-mono font-bold border border-blue-200">
                    {filteredCatalog.length} asset{filteredCatalog.length === 1 ? "" : "s"} available in this BU
                  </span>
                </div>
              </div>

              {/* Search & Category Filter Bar */}
              <div className="p-4 px-6 bg-slate-50/60 border-b border-slate-100 flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px] flex rounded-xl border border-slate-300 bg-white overflow-hidden shadow-2xs focus-within:border-[#253C7D]">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search asset name, tag, category..."
                    className="flex-1 px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    className="px-3.5 bg-[#253C7D] hover:bg-[#1E3066] text-white flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <i className="ri-search-line text-xs" />
                  </button>
                </div>

                {/* Filter Dropdown */}
                <div className="relative shrink-0">
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 focus:outline-none focus:border-[#253C7D] cursor-pointer shadow-2xs"
                  >
                    {uniqueCategories.map((cat) => (
                      <option key={cat} value={cat}>
                        Category: {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Create New Inventory Asset Button */}
                <button
                  type="button"
                  onClick={() => {
                    setInventoryForm({
                      ...INITIAL_ASSET_FORM,
                      branch_id: employeeBuId || (allBranches[0]?.id ?? ""),
                      site: employeeBuName || (allBranches[0]?.name ?? ""),
                    });
                    setShowCreateInventoryModal(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0 active:scale-95"
                  title="Create a new physical asset inventory using standard ERP form"
                >
                  <i className="ri-add-line text-sm" />
                  <span>+ Create Asset Inventory</span>
                </button>
              </div>

              {/* Modal Asset Table List */}
              <div className="flex-1 overflow-y-auto p-4 px-6">
                {loadingAssets ? (
                  <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center">
                    <i className="ri-loader-4-line text-2xl animate-spin text-[#253C7D] mb-2" />
                    <span className="text-xs font-semibold">Loading assets from BU inventories...</span>
                  </div>
                ) : filteredCatalog.length > 0 ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">
                            <input
                              type="checkbox"
                              checked={
                                filteredCatalog.length > 0 &&
                                modalSelectedIds.length === filteredCatalog.length
                              }
                              onChange={handleToggleAllModal}
                              className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] border-slate-300 cursor-pointer"
                            />
                          </th>
                          <th className="py-2.5 px-3 w-12 text-center">No.</th>
                          <th className="py-2.5 px-3">Business Unit (BU)</th>
                          <th className="py-2.5 px-3">Category &amp; Type</th>
                          <th className="py-2.5 px-3">Asset Name &amp; Tag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredCatalog.map((item, idx) => (
                          <tr
                            key={item.id}
                            onClick={() => handleToggleModalAsset(item.id)}
                            className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                              modalSelectedIds.includes(item.id) ? "bg-blue-50/50" : ""
                            }`}
                          >
                            <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={modalSelectedIds.includes(item.id)}
                                onChange={() => handleToggleModalAsset(item.id)}
                                className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] border-slate-300 cursor-pointer"
                              />
                            </td>
                            <td className="py-3 px-3 text-center text-slate-500 font-semibold">{idx + 1}</td>
                            <td className="py-3 px-3">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[10px] font-extrabold border border-blue-200/80">
                                <i className="ri-building-line text-xs" />
                                <span>{item.branch_name || employeeBuName || "Head Office"}</span>
                                {item.branch_code && (
                                  <span className="font-mono text-[9px] bg-blue-200/60 px-1 rounded text-blue-900 ml-0.5">
                                    {item.branch_code}
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-slate-800 text-xs leading-tight mb-1">
                                {item.category}
                              </p>
                              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                                {item.typeBadge || "Electronic Hardware"}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-semibold text-slate-700 text-xs">{item.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono font-bold mt-0.5">
                                Tag: <span className="text-[#253C7D]">{item.tag}</span>
                              </p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-14 text-center text-slate-400 text-xs font-medium space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-2xl shadow-2xs">
                      <i className="ri-archive-line text-slate-400" />
                    </div>
                    <div>
                      <p className="text-slate-800 font-bold text-sm">
                        No Assets Found in {employeeBuName || "this Business Unit"}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5 max-w-sm mx-auto">
                        There are currently no real IT assets registered for this BU in inventory.
                      </p>
                    </div>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setInventoryForm({
                            ...INITIAL_ASSET_FORM,
                            branch_id: employeeBuId || "",
                            site: employeeBuName || "",
                          });
                          setShowCreateInventoryModal(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-95"
                      >
                        <i className="ri-add-line" />
                        <span>+ Create Asset for {employeeBuName || "this BU"}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 px-6 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/60">
                <div className="text-xs text-slate-500 font-medium">
                  {modalSelectedIds.length > 0 ? (
                    <span className="text-[#253C7D] font-bold">
                      {modalSelectedIds.length} asset{modalSelectedIds.length === 1 ? "" : "s"} selected
                    </span>
                  ) : (
                    <span>Tick checkboxes above to assign assets</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAssetModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Discard
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAssetSelection}
                    disabled={modalSelectedIds.length === 0}
                    className="px-5 py-2 rounded-xl bg-[#253C7D] hover:bg-[#1E3066] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                  >
                    <i className="ri-check-line text-sm" />
                    <span>Assign Selected ({modalSelectedIds.length})</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CREATE ASSET INVENTORY Form Modal */}
        <AssetModal
          isOpen={showCreateInventoryModal}
          onClose={() => setShowCreateInventoryModal(false)}
          editingAsset={null}
          assetForm={inventoryForm}
          setAssetForm={setInventoryForm}
          saving={savingInventory}
          employees={[]}
          branches={allBranches}
          onSubmit={handleSaveNewInventory}
        />
      </div>
    );
  }
);

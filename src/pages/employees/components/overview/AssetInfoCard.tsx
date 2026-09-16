import React, { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee, EmployeeAssetBookingItem, EmployeeAssetAttachment } from "../../types";

interface DBAssetRecord {
  id: string;
  name: string;
  asset_tag: string;
  type: string;
  serial_number?: string;
  status: string;
  created_at?: string;
  branch_name?: string;
  category?: string;
}

interface AssetInfoCardProps {
  employee: Employee;
  onCountLoaded?: (count: number) => void;
}

export const AssetInfoCard: React.FC<AssetInfoCardProps> = ({ employee, onCountLoaded }) => {
  const [dbAssets, setDbAssets] = useState<DBAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const onCountLoadedRef = useRef(onCountLoaded);

  useEffect(() => {
    onCountLoadedRef.current = onCountLoaded;
  }, [onCountLoaded]);

  // Booked assets saved directly on the employee record from Step 5
  const bookedAssets: EmployeeAssetBookingItem[] = useMemo(() => {
    return (employee?.asset_bookings as EmployeeAssetBookingItem[]) || [];
  }, [employee?.asset_bookings]);

  // Attachments saved directly on employee record from Step 5
  const assetAttachments: EmployeeAssetAttachment[] = useMemo(() => {
    return (employee?.asset_attachments as EmployeeAssetAttachment[]) || [];
  }, [employee?.asset_attachments]);

  useEffect(() => {
    if (!employee?.id) {
      setLoading(false);
      return;
    }
    let isCancelled = false;

    const fetchAssets = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("it_assets")
          .select("id, name, asset_tag, type, serial_number, status, created_at, category, branches(name)")
          .eq("employee_id", employee.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (isCancelled) return;

        if (!error && data) {
          const mapped: DBAssetRecord[] = data.map((d: any) => ({
            id: d.id,
            name: d.name,
            asset_tag: d.asset_tag,
            type: d.type,
            serial_number: d.serial_number,
            status: d.status,
            created_at: d.created_at,
            category: d.category,
            branch_name: Array.isArray(d.branches) ? d.branches[0]?.name : d.branches?.name,
          }));
          setDbAssets(mapped);
        } else {
          setDbAssets([]);
        }
      } catch (err) {
        console.warn("Could not load assigned assets:", err);
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchAssets();

    return () => {
      isCancelled = true;
    };
  }, [employee.id]);

  // Merge bookedAssets and dbAssets (deduplicating by tag)
  const combinedAssets = useMemo(() => {
    const list: Array<{
      id: string;
      name: string;
      tag: string;
      category?: string;
      typeBadge?: string;
      serial?: string;
      bu_name?: string;
      bu_code?: string;
      assign_for?: string;
      from_date?: string;
      to_date?: string;
      to_date_never?: boolean;
      remark?: string;
      status?: string;
    }> = [];

    // 1. Add form booked assets
    bookedAssets.forEach((b) => {
      list.push({
        id: b.id,
        name: b.name,
        tag: b.tag,
        category: b.category,
        typeBadge: b.category?.split(":")[0] || "Hardware",
        bu_name: b.bu_name || (employee as any)?.bu_full_name || employee?.branches?.name || undefined,
        bu_code: b.bu_code || (employee as any)?.code_bu || undefined,
        assign_for: b.assign_for || "Full Day",
        from_date: b.from_date,
        to_date: b.to_date,
        to_date_never: b.to_date_never,
        remark: b.remark,
        status: b.status || "Assigned",
      });
    });

    // 2. Add DB assets if not already included
    dbAssets.forEach((d) => {
      if (!list.some((existing) => existing.tag?.toLowerCase() === d.asset_tag?.toLowerCase())) {
        list.push({
          id: d.id,
          name: d.name,
          tag: d.asset_tag,
          category: d.category || d.type,
          typeBadge: d.type,
          serial: d.serial_number,
          bu_name: d.branch_name,
          status: d.status || "Assigned",
        });
      }
    });

    return list;
  }, [bookedAssets, dbAssets, employee]);

  useEffect(() => {
    onCountLoadedRef.current?.(combinedAssets.length);
  }, [combinedAssets.length]);

  return (
    <div className="space-y-6">
      {/* Main Assets Registry Card */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#253C7D] shadow-2xs">
              <i className="ri-macbook-line text-xl" />
            </div>
            <div>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-wide">
                IT Equipment &amp; Assigned Assets
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Hardware, mobile devices, accessories, and tools assigned to {employee.first_name} {employee.last_name}
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-[#253C7D]">
            Total Allocated: {combinedAssets.length}
          </span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2 text-center text-xs text-gray-400">
            <div className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
            <span>Loading asset registry...</span>
          </div>
        ) : combinedAssets.length === 0 ? (
          <div className="py-12 text-center bg-gray-50/70 border border-dashed border-gray-200 rounded-2xl">
            <i className="ri-computer-line text-3xl text-gray-400 block mb-2" />
            <span className="text-xs font-bold text-gray-700 block">No Assets Assigned</span>
            <p className="text-[11px] text-gray-500 mt-0.5 max-w-sm mx-auto">
              No hardware, workstation bundles, or equipment currently booked under this employee.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {combinedAssets.map((ast, idx) => (
              <div
                key={ast.id || idx}
                className="p-4 border border-slate-200 rounded-2xl bg-white hover:border-[#253C7D]/60 hover:shadow-xs transition-all relative overflow-hidden group"
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-black text-slate-900">{ast.name}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-mono font-bold border border-slate-200">
                        {ast.tag}
                      </span>
                    </div>
                    {ast.category && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{ast.category}</p>
                    )}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                    {ast.status || "Assigned"}
                  </span>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100 text-[11px]">
                  {/* Business Unit */}
                  {ast.bu_name && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Business Unit:</span>
                      <span className="inline-flex items-center gap-1 font-bold text-[#253C7D]">
                        <i className="ri-building-line text-xs" />
                        <span>{ast.bu_name}</span>
                        {ast.bu_code && (
                          <span className="text-[9px] font-mono px-1 rounded bg-blue-100/80 text-blue-900">
                            [{ast.bu_code}]
                          </span>
                        )}
                      </span>
                    </div>
                  )}

                  {/* Serial Number if available */}
                  {ast.serial && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Serial No:</span>
                      <span className="font-mono text-slate-700 font-semibold">{ast.serial}</span>
                    </div>
                  )}

                  {/* Assignment Timeline */}
                  {ast.from_date && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-medium">Booking Period:</span>
                      <span className="text-slate-700 font-semibold">
                        {ast.from_date}{" "}
                        {ast.to_date_never ? "(Permanent)" : ast.to_date ? `to ${ast.to_date}` : ""}
                        {ast.assign_for ? ` · ${ast.assign_for}` : ""}
                      </span>
                    </div>
                  )}

                  {/* Remarks */}
                  {ast.remark && (
                    <div className="flex items-start justify-between gap-2 pt-1 text-slate-500">
                      <span className="text-slate-400 font-medium shrink-0">Remark:</span>
                      <span className="text-right truncate italic">{ast.remark}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Asset Attachments (AWS S3) Section */}
      {assetAttachments.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h4 className="text-xs font-black text-[#253C7D] uppercase tracking-wider flex items-center gap-2">
              <i className="ri-file-shield-2-line text-sm" />
              <span>Asset Handover Documents &amp; Agreements</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                AWS S3
              </span>
            </h4>
            <span className="text-[11px] font-bold text-slate-500">
              {assetAttachments.length} document{assetAttachments.length > 1 ? "s" : ""} attached
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
            {assetAttachments.map((att, idx) => (
              <a
                key={idx}
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-blue-50/40 hover:border-blue-300 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#253C7D] shrink-0 shadow-2xs">
                    <i className="ri-file-text-line text-sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate group-hover:text-[#253C7D]">
                      {att.name}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {att.size ? `${(att.size / 1024).toFixed(1)} KB` : "Document"}
                    </p>
                  </div>
                </div>
                <i className="ri-external-link-line text-slate-400 group-hover:text-[#253C7D] text-sm shrink-0 ml-2" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

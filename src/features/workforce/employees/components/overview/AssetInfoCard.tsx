import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee, EmployeeAssetBookingItem } from "../../types";
import { EmployeeMovementAttachmentSection } from "./movements/EmployeeMovementAttachmentSection";

interface DBAssetRecord {
  id: string;
  name: string;
  asset_tag: string;
  type?: string;
  serial_number?: string;
  status: string;
  created_at?: string;
  assigned_date?: string;
  remark?: string;
}

interface AssetInfoCardProps {
  employee: Employee;
  onCountLoaded?: (count: number) => void;
}

interface DisplayAssetItem {
  id: string;
  assetName: string;
  assignedDate: string;
  remark: string;
  status: string;
}

export const AssetInfoCard: React.FC<AssetInfoCardProps> = ({ employee, onCountLoaded }) => {
  const [dbAssets, setDbAssets] = useState<DBAssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Assets booked directly on employee record
  const bookedAssets = useMemo(() => {
    return (
      (employee?.asset_bookings as (EmployeeAssetBookingItem & {
        assigned_date?: string;
        item_description?: string;
        issue_date?: string;
      })[]) || []
    );
  }, [employee?.asset_bookings]);

  // 2. Fetch IT assets from database
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
          .select("id, name, asset_tag, type, serial_number, status, created_at, remark")
          .eq("employee_id", employee.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (isCancelled) return;

        if (!error && data) {
          setDbAssets(data as DBAssetRecord[]);
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

  // Combine and deduplicate
  const assetList: DisplayAssetItem[] = useMemo(() => {
    const list: DisplayAssetItem[] = [];

    // Add booked assets
    bookedAssets.forEach((b, idx) => {
      list.push({
        id: b.id || `booked-${idx}`,
        assetName: b.name || b.tag || b.item_description || "-",
        assignedDate: b.assigned_date || b.from_date || b.issue_date || "",
        remark: b.remark || "",
        status: b.status || "Assigned",
      });
    });

    // Add DB assets if not duplicate
    dbAssets.forEach((d) => {
      const isDuplicate = list.some(
        (existing) =>
          (d.asset_tag && existing.assetName.toLowerCase().includes(d.asset_tag.toLowerCase())) ||
          (d.name && existing.assetName.toLowerCase().includes(d.name.toLowerCase()))
      );
      if (!isDuplicate) {
        list.push({
          id: d.id,
          assetName: d.name ? `${d.name}${d.asset_tag ? ` (${d.asset_tag})` : ""}` : d.asset_tag || "-",
          assignedDate: d.assigned_date || d.created_at ? (d.assigned_date || d.created_at?.split("T")[0] || "") : "",
          remark: d.remark || "",
          status: d.status || "Assigned",
        });
      }
    });

    return list;
  }, [bookedAssets, dbAssets]);

  useEffect(() => {
    onCountLoaded?.(assetList.length);
  }, [assetList.length, onCountLoaded]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-gray-200/90 dark:border-slate-800 rounded-sm sm:rounded-md p-5 sm:p-6 shadow-xs">
      <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-4">
        ASSET INFO
      </h3>

      <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xs">
        <table className="w-full text-left text-[13px] border-collapse">
          <thead>
            <tr className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold">
              <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 w-16">
                No.
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                Asset
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800 w-44">
                Assigned Date
              </th>
              <th className="py-2.5 px-3 border-r border-slate-200 dark:border-slate-800">
                Remark
              </th>
              <th className="py-2.5 px-3 w-32">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="py-6 text-center text-slate-500 dark:text-slate-400">
                  <div className="inline-flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                    <span>Loading assets...</span>
                  </div>
                </td>
              </tr>
            ) : assetList.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-5 text-center font-bold text-slate-900 dark:text-slate-100 text-[13px] tracking-tight"
                >
                  No records found
                </td>
              </tr>
            ) : (
              assetList.map((item, idx) => (
                <tr
                  key={item.id || idx}
                  className="border-b last:border-b-0 border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                >
                  <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium">
                    {item.assetName}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                    {item.assignedDate || ""}
                  </td>
                  <td className="py-2 px-3 border-r border-slate-200 dark:border-slate-800">
                    {item.remark || ""}
                  </td>
                  <td className="py-2 px-3">
                    {item.status}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 2. Attachment Info */}
      <EmployeeMovementAttachmentSection employee={employee} categoryKey="asset" />
    </div>
  );
};

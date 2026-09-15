import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Employee } from "../../types";

interface AssetRecord {
  id: string;
  name: string;
  asset_tag: string;
  type: string;
  serial_number?: string;
  status: string;
  created_at: string;
}

interface AssetInfoCardProps {
  employee: Employee;
  onCountLoaded?: (count: number) => void;
}

export const AssetInfoCard: React.FC<AssetInfoCardProps> = ({ employee, onCountLoaded }) => {
  const [assets, setAssets] = useState<AssetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employee?.id) return;
    const fetchAssets = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("it_assets")
          .select("id, name, asset_tag, type, serial_number, status, created_at")
          .eq("employee_id", employee.id)
          .is("deleted_at", null)
          .order("created_at", { ascending: false });

        if (!error && data) {
          setAssets(data as AssetRecord[]);
          onCountLoaded?.(data.length);
        }
      } catch (err) {
        console.warn("Could not load assigned assets:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssets();
  }, [employee.id, onCountLoaded]);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <i className="ri-macbook-line text-lg" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">IT Equipment &amp; Assigned Assets</h3>
            <p className="text-xs text-gray-500">Hardware, laptops, tools, and company devices assigned to staff</p>
          </div>
        </div>
        <span className="text-xs font-bold px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-full text-gray-700">
          Total Assigned: {assets.length}
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400">Loading asset registry...</div>
      ) : assets.length === 0 ? (
        <div className="py-8 text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl">
          <i className="ri-computer-line text-3xl text-gray-400 block mb-1" />
          <span className="text-xs font-bold text-gray-700">No Assets Assigned</span>
          <p className="text-[11px] text-gray-500 mt-0.5">No laptops, workstation devices, or equipment currently registered under this user.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {assets.map((ast) => (
            <div key={ast.id} className="p-3.5 border border-gray-200 rounded-xl bg-gray-50/40 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-900 block">{ast.name}</span>
                  <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold inline-block mt-1">
                    Tag: {ast.asset_tag || "—"}
                  </span>
                </div>
                <span className="text-[10px] px-2 py-0.5 bg-white border border-gray-200 rounded-full font-bold uppercase text-gray-600">
                  {ast.type || "Device"}
                </span>
              </div>
              <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                <span>S/N: <strong className="font-mono text-gray-700">{ast.serial_number || "N/A"}</strong></span>
                <span className="text-emerald-600 font-semibold capitalize">{ast.status || "In Use"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

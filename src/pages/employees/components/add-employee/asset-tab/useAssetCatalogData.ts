import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { STANDARD_ASSET_CATEGORIES } from "@/pages/it/constants";
import type { AvailableAssetItem } from "./types";

const CACHE_KEY = "hrm_cached_it_assets_catalog";

function getDefaultITAssetCatalog(): AvailableAssetItem[] {
  const items: AvailableAssetItem[] = [];
  let count = 1;

  STANDARD_ASSET_CATEGORIES.forEach((cat) => {
    // Standard Desktop bundle template
    if (cat.id === "desktop_bundle") {
      items.push({
        id: `it-template-${count++}`,
        name: "Desktop + Mouse + Keyboard + Monitor + System Unit + Extension Cord",
        category: cat.name,
        subType: cat.subType,
        tag: `AST-DSK-${String(count).padStart(3, "0")}`,
        status: "inventory",
      });
      items.push({
        id: `it-template-${count++}`,
        name: "Desktop + Mouse + Pad + Keyboard + Monitor + System Unit + Extension Cord",
        category: cat.name,
        subType: cat.subType,
        tag: `AST-DSK-${String(count).padStart(3, "0")}`,
        status: "inventory",
      });
    } else if (cat.id === "laptop_bundle") {
      items.push({
        id: `it-template-${count++}`,
        name: "Laptop + Mouse + Pad + Charger + Bag + Extension",
        category: cat.name,
        subType: cat.subType,
        tag: `AST-LPT-${String(count).padStart(3, "0")}`,
        status: "inventory",
      });
    } else if (cat.id === "contact_phone_sim") {
      items.push({
        id: `it-template-${count++}`,
        name: "Smartphone (Corporate SIM & Dedicated Data Plan)",
        category: cat.name,
        subType: cat.subType,
        tag: `AST-PHN-${String(count).padStart(3, "0")}`,
        status: "inventory",
      });
    } else if (cat.id === "peripherals") {
      items.push({
        id: `it-template-${count++}`,
        name: "Wireless Headset + Ergonomic Mouse + Full-size Keyboard",
        category: cat.name,
        subType: cat.subType,
        tag: `AST-ACC-${String(count).padStart(3, "0")}`,
        status: "inventory",
      });
    } else if (cat.id === "displays") {
      items.push({
        id: `it-template-${count++}`,
        name: "24-inch IPS Dual Display Setup with HDMI Cables",
        category: cat.name,
        subType: cat.subType,
        tag: `AST-DSP-${String(count).padStart(3, "0")}`,
        status: "inventory",
      });
    } else {
      items.push({
        id: `it-template-${count++}`,
        name: cat.name,
        category: cat.name,
        subType: cat.subType,
        tag: `AST-${cat.id.slice(0, 3).toUpperCase()}-${String(count).padStart(3, "0")}`,
        status: "inventory",
      });
    }
  });

  return items;
}

export function useAssetCatalogData(branchId?: string | null) {
  const [assets, setAssets] = useState<AvailableAssetItem[]>(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // Ignore parse error
    }
    return getDefaultITAssetCatalog();
  });
  const [loading, setLoading] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("it_assets")
        .select("id, name, asset_tag, type, category, status, serial_number, branch_id, branches(id, name)")
        .is("deleted_at", null);

      if (branchId) {
        query = query.or(`branch_id.eq.${branchId},branch_id.is.null`);
      }

      const { data, error } = await query.order("name", { ascending: true });

      const catalog: AvailableAssetItem[] = [];

      if (!error && data && data.length > 0) {
        data.forEach((a: any) => {
          const bObj = Array.isArray(a.branches) ? a.branches[0] : a.branches;
          const matchingCat = STANDARD_ASSET_CATEGORIES.find(
            (sc) => sc.name === a.category || sc.id === a.category || sc.keywords.some((k) => (a.name || "").toLowerCase().includes(k))
          );

          catalog.push({
            id: a.id,
            name: a.name,
            category: a.category || matchingCat?.name || "Desktop: Mouse, Pad, Keyboard, Monitor, System Unit, Extension Cord",
            subType: matchingCat?.subType || "Electronic Hardware",
            tag: a.asset_tag || "N/A",
            serial: a.serial_number || undefined,
            branch_id: a.branch_id,
            branch_name: bObj?.name || null,
            status: a.status || "inventory",
          });
        });
      }

      // Merge with default templates so user always has full IT categories
      const defaults = getDefaultITAssetCatalog();
      defaults.forEach((def) => {
        if (!catalog.some((c) => c.name === def.name || c.tag === def.tag)) {
          catalog.push(def);
        }
      });

      setAssets(catalog);
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(catalog));
      } catch {
        // Ignore storage error
      }
    } catch (err) {
      console.warn("Could not load it_assets from DB:", err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  return {
    assets,
    loading,
    refreshAssets: fetchAssets,
  };
}

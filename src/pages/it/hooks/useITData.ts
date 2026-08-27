import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { ITAsset, ITTicket, Employee, Branch } from "../types";

export function useITData() {
  const [assets, setAssets] = useState<ITAsset[]>([]);
  const [tickets, setTickets] = useState<ITTicket[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [{ data: a }, { data: t }, { data: e }, { data: b }] = await Promise.all([
      supabase
        .from("it_assets")
        .select(
          "id, name, asset_tag, type, employee_id, branch_id, status, serial_number, created_at, employees(id, first_name, last_name, department, avatar_url), branches(id, name)"
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("it_tickets")
        .select("id, title, requester_name, priority, status, category, description, created_at, resolved_at")
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("employees")
        .select("id, first_name, last_name, department, role, avatar_url")
        .is("deleted_at", null)
        .order("first_name"),
      supabase.from("branches").select("id, name").order("name"),
    ]);

    setAssets((a as ITAsset[]) || []);
    setTickets((t as ITTicket[]) || []);
    setEmployees((e as Employee[]) || []);
    setBranches((b as Branch[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
    const ch = supabase
      .channel("it-management-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "it_assets" }, () => loadData())
      .on("postgres_changes", { event: "*", schema: "public", table: "it_tickets" }, () => loadData())
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [loadData]);

  return {
    assets,
    setAssets,
    tickets,
    setTickets,
    employees,
    branches,
    loading,
    loadData,
  };
}

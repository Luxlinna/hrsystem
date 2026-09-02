import { useState, useEffect } from "react";
import type { StationeryItem, StationeryRequest } from "../../types";
import { SAMPLE_STATIONERY_ITEMS } from "../../constants";

export const ITEMS_STORAGE_KEY = "hr_nexus_stationery_items";
export const REQUESTS_STORAGE_KEY = "hr_nexus_stationery_requests";

const INITIAL_REQUESTS: StationeryRequest[] = [
  {
    id: "req-1",
    item_id: "stat-1",
    item_name: "Double A A4 Copier Paper (80gsm)",
    requested_by_name: "Sokha Mean",
    department: "Finance",
    quantity: 2,
    purpose: "Monthly payroll statement printing",
    status: "pending",
    urgency: "normal",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "req-2",
    item_id: "stat-3",
    item_name: "Pilot G2 Gel Pen 0.7mm (Blue)",
    requested_by_name: "Dara Chen",
    department: "Operations",
    quantity: 5,
    purpose: "New branch opening documentation",
    status: "approved",
    urgency: "urgent",
    created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
    approved_by: "HR Admin",
    approved_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export function useStationeryState() {
  const [items, setItems] = useState<StationeryItem[]>(() => {
    try {
      const saved = localStorage.getItem(ITEMS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return SAMPLE_STATIONERY_ITEMS;
  });

  const [requests, setRequests] = useState<StationeryRequest[]>(() => {
    try {
      const saved = localStorage.getItem(REQUESTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_REQUESTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    } catch {}
  }, [requests]);

  return { items, setItems, requests, setRequests };
}

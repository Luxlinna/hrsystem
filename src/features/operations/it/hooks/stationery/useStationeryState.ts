import { useState, useEffect } from "react";
import type { StationeryItem, StationeryRequest } from "../../types";

export const ITEMS_STORAGE_KEY = "hr_nexus_stationery_items";
export const REQUESTS_STORAGE_KEY = "hr_nexus_stationery_requests";


export function useStationeryState() {
  const [items, setItems] = useState<StationeryItem[]>(() => {
    try {
      const saved = localStorage.getItem(ITEMS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore JSON parse error
    }
    return [];
  });

  const [requests, setRequests] = useState<StationeryRequest[]>(() => {
    try {
      const saved = localStorage.getItem(REQUESTS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore JSON parse error
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(ITEMS_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore localStorage write error
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests));
    } catch {
      // Ignore localStorage write error
    }
  }, [requests]);

  return { items, setItems, requests, setRequests };
}

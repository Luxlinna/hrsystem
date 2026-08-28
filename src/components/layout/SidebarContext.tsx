/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, type ReactNode } from "react";

interface SidebarContextType {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
}

const SidebarContext = createContext<SidebarContextType>({
  collapsed: true,
  setCollapsed: () => {},
  toggle: () => {},
});

const STORAGE_KEY = "hrsystem-sidebar-collapsed";

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return true;
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return saved === null ? true : saved === "1";
}

export function useSidebar() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  // Remembers the user's expand/collapse choice across reloads instead of
  // always resetting to collapsed — one less click every session.
  const [collapsed, setCollapsedState] = useState(getInitialCollapsed);

  const setCollapsed = (v: boolean) => {
    setCollapsedState(v);
    window.localStorage.setItem(STORAGE_KEY, v ? "1" : "0");
  };
  const toggle = () => setCollapsed(!collapsed);

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggle }}>
      {children}
    </SidebarContext.Provider>
  );
}
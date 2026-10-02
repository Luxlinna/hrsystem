import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "remixicon/fonts/remixicon.css";
import "./index.css";
import App from "./App";
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .catch((err) => console.error("Service worker registration failed:", err));
}

// Ensure clean widget position without conflicting overrides
if (typeof window !== "undefined") {
  try {
    localStorage.removeItem("chat_widget_assistive_pos");
  } catch {
    // Ignore storage errors
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
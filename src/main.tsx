import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "remixicon/fonts/remixicon.css";
import "./index.css";
import App from "./App";
import { initAssistiveTouchChat } from "./lib/assistiveTouchChat";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .catch((err) => console.error("Service worker registration failed:", err));
}

// Initialize AssistiveTouch-style draggable live chat widget
if (typeof window !== "undefined") {
  initAssistiveTouchChat();
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
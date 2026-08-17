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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
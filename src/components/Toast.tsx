import { useState, useEffect, useCallback } from "react";

interface Toast {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function emit() {
  toastListeners.forEach((fn) => fn([...toasts]));
}

export function toast(title: string, message: string, type: Toast["type"] = "info") {
  const id = Math.random().toString(36).slice(2);
  toasts = [...toasts, { id, title, message, type }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 4000);
}

export function useToasts() {
  const [state, setState] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (t: Toast[]) => setState(t);
    toastListeners.push(listener);
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener);
    };
  }, []);

  return state;
}

const typeStyles = {
  info: "bg-[#0D7377] text-white",
  success: "bg-emerald-600 text-white",
  warning: "bg-amber-500 text-white",
  error: "bg-red-500 text-white",
};

const typeIcons = {
  info: "ri-information-line",
  success: "ri-check-line",
  warning: "ri-alert-line",
  error: "ri-close-circle-line",
};

export function ToastContainer() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg max-w-sm animate-in slide-in-from-right ${typeStyles[t.type]}`}
          style={{ animation: "slideIn 0.3s ease" }}
        >
          <div className="flex items-start gap-3">
            <i className={`${typeIcons[t.type]} text-lg flex-shrink-0 mt-0.5`} />
            <div>
              <p className="text-[13px] font-semibold">{t.title}</p>
              <p className="text-[11px] opacity-90 mt-0.5">{t.message}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
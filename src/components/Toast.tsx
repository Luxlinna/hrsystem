/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from "react";

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
  }, 5000);
}

export function dismissToast(id: string) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
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

const typeConfig = {
  info: {
    border: "border-l-[#253C7D]",
    iconBg: "bg-[#253C7D]/10",
    iconColor: "text-[#253C7D]",
    icon: "ri-information-fill",
    progress: "bg-[#253C7D]",
  },
  success: {
    border: "border-l-emerald-500",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-500",
    icon: "ri-checkbox-circle-fill",
    progress: "bg-emerald-500",
  },
  warning: {
    border: "border-l-amber-500",
    iconBg: "bg-amber-50",
    iconColor: "text-amber-500",
    icon: "ri-alert-fill",
    progress: "bg-amber-500",
  },
  error: {
    border: "border-l-red-500",
    iconBg: "bg-red-50",
    iconColor: "text-red-500",
    icon: "ri-error-warning-fill",
    progress: "bg-red-500",
  },
};

export function ToastContainer() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none" style={{ maxWidth: "380px" }}>
      {toasts.map((t) => {
        const cfg = typeConfig[t.type];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto bg-white border border-gray-100 border-l-4 ${cfg.border} rounded-2xl shadow-2xl overflow-hidden`}
            style={{ animation: "toastSlideIn 0.4s cubic-bezier(0.16,1,0.3,1)" }}
          >
            <div className="flex items-start gap-3 p-4">
              <div className={`w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
                <i className={`${cfg.icon} text-xl ${cfg.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-bold text-gray-900 leading-tight">{t.title}</p>
                <p className="text-[12px] text-gray-500 mt-1 leading-relaxed">{t.message}</p>
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-all flex-shrink-0 cursor-pointer"
              >
                <i className="ri-close-line text-sm" />
              </button>
            </div>
            <div className="h-1 bg-gray-100">
              <div
                className={`h-full ${cfg.progress} rounded-full`}
                style={{ animation: "toastProgress 5s linear forwards" }}
              />
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(100%) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}
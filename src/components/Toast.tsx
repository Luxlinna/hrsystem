/* eslint-disable react-refresh/only-export-components */
import { useState, useEffect } from "react";
import { stripEmojis } from "@/pages/notifications/notificationUtils";

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

export function toast(
  titleOrMessage: string,
  messageOrType?: string,
  type: Toast["type"] = "info"
) {
  let finalTitle = stripEmojis(titleOrMessage);
  let finalMessage = stripEmojis(messageOrType || "");
  let finalType = type;

  // If only one argument is provided: toast("Item saved successfully")
  if (messageOrType === undefined) {
    finalTitle = "";
    finalMessage = stripEmojis(titleOrMessage);
    finalType = "info";
  } else if (
    messageOrType === "info" ||
    messageOrType === "success" ||
    messageOrType === "warning" ||
    messageOrType === "error"
  ) {
    finalTitle = "";
    finalMessage = stripEmojis(titleOrMessage);
    finalType = messageOrType as Toast["type"];
  }

  const id = Math.random().toString(36).slice(2);
  toasts = [
    ...toasts,
    { id, title: finalTitle, message: finalMessage, type: finalType },
  ];
  emit();

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 3500);
}

toast.success = (message: string, title: string = "") => {
  toast(title || message, title ? message : "success", "success");
};

toast.error = (message: string, title: string = "") => {
  toast(title || message, title ? message : "error", "error");
};

toast.info = (message: string, title: string = "") => {
  toast(title || message, title ? message : "info", "info");
};

toast.warning = (message: string, title: string = "") => {
  toast(title || message, title ? message : "warning", "warning");
};

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
    iconColor: "text-[#0088cc]",
    icon: "ri-information-fill",
  },
  success: {
    iconColor: "text-emerald-600 dark:text-emerald-400",
    icon: "ri-checkbox-circle-fill",
  },
  warning: {
    iconColor: "text-amber-500",
    icon: "ri-alert-fill",
  },
  error: {
    iconColor: "text-rose-500",
    icon: "ri-close-circle-fill",
  },
};

export function ToastContainer() {
  const toasts = useToasts();

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-5 right-5 z-[9999] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: "340px", width: "100%" }}
    >
      {toasts.map((t) => {
        const cfg = typeConfig[t.type];
        const hasTitle = Boolean(t.title && t.title !== t.message && t.title !== "Notification" && t.title !== "Success" && t.title !== "Info" && t.title !== "Warning" && t.title !== "Error");

        return (
          <div
            key={t.id}
            className="pointer-events-auto bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-lg shadow-lg py-2.5 px-3.5 flex items-start gap-2.5 transition-all"
            style={{
              animation: "toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Status Icon */}
            <i className={`${cfg.icon} ${cfg.iconColor} text-base shrink-0 mt-0.5`} />

            {/* Content */}
            <div className="flex-1 min-w-0 pr-1">
              {hasTitle && (
                <p className="text-[12.5px] font-semibold text-slate-900 dark:text-slate-100 leading-tight mb-0.5">
                  {t.title}
                </p>
              )}
              <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-relaxed break-words">
                {t.message || t.title}
              </p>
            </div>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 -mr-1 shrink-0 cursor-pointer"
              title="Close"
            >
              <i className="ri-close-line text-sm" />
            </button>
          </div>
        );
      })}

      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
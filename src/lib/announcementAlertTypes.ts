import type { AlertSoundType } from "./alertSounds";

export type AnnouncementPriorityTier = "normal" | "priority" | "urgent";
export type AlertDeliveryType = "banner" | "modal" | "compact_toast";

export interface PriorityTierConfig {
  id: AnnouncementPriorityTier;
  label: string;
  badge: string;
  badgeBg: string;
  badgeColor: string;
  dotColor: string;
  description: string;
  defaultDelivery: AlertDeliveryType;
  defaultSound: AlertSoundType;
  mandatoryAck: boolean;
  canRepeat: boolean;
}

export const ANNOUNCEMENT_PRIORITY_TIERS: PriorityTierConfig[] = [
  {
    id: "normal",
    label: "Normal / General",
    badge: "Normal",
    badgeBg: "bg-slate-100 dark:bg-slate-800",
    badgeColor: "text-slate-700 dark:text-slate-300",
    dotColor: "bg-slate-400",
    description: "Standard news and everyday updates. Appears in feed and notification inbox silently without popups or audio interrupts.",
    defaultDelivery: "compact_toast",
    defaultSound: "mute",
    mandatoryAck: false,
    canRepeat: false,
  },
  {
    id: "priority",
    label: "High Priority",
    badge: "Priority",
    badgeBg: "bg-amber-50 dark:bg-amber-950/50",
    badgeColor: "text-amber-700 dark:text-amber-300",
    dotColor: "bg-amber-500",
    description: "Important operational updates and policy changes. Displays a non-blocking toast or banner with an optional chime upon publish.",
    defaultDelivery: "compact_toast",
    defaultSound: "bell",
    mandatoryAck: false,
    canRepeat: false,
  },
  {
    id: "urgent",
    label: "Urgent & Mandatory",
    badge: "Urgent",
    badgeBg: "bg-rose-50 dark:bg-rose-950/50",
    badgeColor: "text-rose-700 dark:text-rose-300",
    dotColor: "bg-rose-500",
    description: "Critical safety, compliance, or system maintenance notices requiring mandatory acknowledgment with periodic reminders.",
    defaultDelivery: "banner",
    defaultSound: "chime",
    mandatoryAck: true,
    canRepeat: true,
  },
];

export interface AlertDeliveryOption {
  id: AlertDeliveryType;
  label: string;
  description: string;
  icon: string;
}

export const ALERT_DELIVERY_OPTIONS: AlertDeliveryOption[] = [
  {
    id: "banner",
    label: "Dynamic Island Banner",
    description: "Top floating glass bar with 1-click acknowledge button (Clean & non-blocking)",
    icon: "ri-layout-top-line",
  },
  {
    id: "modal",
    label: "Centered Modal Dialog",
    description: "High-urgency dialog takeover demanding confirmation before proceeding",
    icon: "ri-window-line",
  },
  {
    id: "compact_toast",
    label: "Corner Toast Alert",
    description: "Neat floating toast notification in the upper corner",
    icon: "ri-notification-badge-line",
  },
];

export const getStoredAlertDeliveryType = (): AlertDeliveryType => {
  try {
    const val = localStorage.getItem("hrm_announcement_alert_type");
    if (val && ["banner", "modal", "compact_toast"].includes(val)) {
      return val as AlertDeliveryType;
    }
  } catch {
    // fallback
  }
  return "banner";
};

export const setStoredAlertDeliveryType = (type: AlertDeliveryType) => {
  try {
    localStorage.setItem("hrm_announcement_alert_type", type);
  } catch {
    // ignore
  }
};

/**
 * Returns alert interval in seconds. 0 represents once only on publish.
 */
export const getStoredAlertIntervalSeconds = (): number => {
  try {
    const val = localStorage.getItem("hrm_announcement_alert_interval_sec");
    if (val !== null) {
      const num = Number(val);
      if (!Number.isNaN(num) && num >= 0) return num;
    }
    // Backward compatibility with legacy string frequency keys
    const legacy = localStorage.getItem("hrm_announcement_alert_frequency");
    if (legacy === "once") return 0;
    if (legacy === "1m") return 60;
    if (legacy === "5m") return 300;
    if (legacy === "30s") return 30;
  } catch {
    // fallback
  }
  return 30; // default 30 seconds
};

export const setStoredAlertIntervalSeconds = (seconds: number) => {
  try {
    const sanitized = Math.max(0, Math.min(3600, Math.round(seconds)));
    localStorage.setItem("hrm_announcement_alert_interval_sec", String(sanitized));
    localStorage.setItem(
      "hrm_announcement_alert_frequency",
      sanitized === 0 ? "once" : sanitized === 60 ? "1m" : sanitized === 300 ? "5m" : `${sanitized}s`
    );
  } catch {
    // ignore
  }
};

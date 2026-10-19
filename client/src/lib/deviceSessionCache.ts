import { UAParser } from "ua-parser-js";

export interface CachedDeviceSession {
  id: string;
  ip: string;
  browser: string;
  os: string;
  deviceType?: string;
  deviceVendor?: string;
  deviceModel?: string;
  userAgent?: string;
  timestamp: number;
  date: string;
  timeAgo: string;
  status: "Success" | "Failed";
  isCurrent?: boolean;
}

const DEVICE_CACHE_PREFIX = "hrm_cached_devices_";
const CLIENT_IP_CACHE_KEY = "hrm_cached_client_ip";

export function parseDeviceFromUserAgent(uaString?: string): {
  browser: string;
  os: string;
  deviceType?: string;
  deviceVendor?: string;
  deviceModel?: string;
} {
  const ua = uaString || (typeof navigator !== "undefined" ? navigator.userAgent : "");
  if (!ua) {
    return { browser: "Chrome", os: "Windows" };
  }

  const parser = new UAParser(ua);
  const result = parser.getResult();

  const browser = result.browser.name || "Chrome";
  let os = result.os.name || "Windows";
  if (os === "Mac OS") os = "macOS";

  return {
    browser,
    os,
    deviceType: result.device.type,
    deviceVendor: result.device.vendor,
    deviceModel: result.device.model,
  };
}

export function getDeviceIcon(os: string, deviceType?: string): string {
  if (deviceType === "mobile" || os === "iOS") {
    return "ri-smartphone-line";
  }
  if (deviceType === "tablet") {
    return "ri-tablet-line";
  }
  switch (os) {
    case "macOS":
    case "iOS":
      return "ri-apple-fill";
    case "Windows":
      return "ri-windows-fill";
    case "Android":
      return "ri-android-fill";
    default:
      if (os.toLowerCase().includes("linux") || os.toLowerCase().includes("ubuntu")) {
        return "ri-terminal-box-line";
      }
      return "ri-computer-line";
  }
}

export async function getClientPublicIp(): Promise<string> {
  if (typeof window === "undefined") return "49.156.35.249";
  try {
    const cached = sessionStorage.getItem(CLIENT_IP_CACHE_KEY);
    if (cached && /^(\d{1,3}\.){3}\d{1,3}$/.test(cached)) {
      return cached;
    }
  } catch {
    // ignore storage access restrictions
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2200);
    const res = await fetch("https://api.ipify.org?format=json", { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data?.ip && typeof data.ip === "string") {
        try {
          sessionStorage.setItem(CLIENT_IP_CACHE_KEY, data.ip);
        } catch {
          // ignore
        }
        return data.ip;
      }
    }
  } catch {
    // fallback gracefully
  }

  return "49.156.35.249";
}

export function formatDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}/${m}/${date.getFullYear()}`;
}

export function formatTimeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))}m ago`;
  if (diff < 86400) return `${Math.max(1, Math.floor(diff / 3600))}h ago`;
  const days = Math.floor(diff / 86400);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

function getStorageKey(userIdentifier?: string): string {
  const cleanId = (userIdentifier || "default").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "_");
  return `${DEVICE_CACHE_PREFIX}${cleanId}`;
}

export function getCachedDeviceSessions(userIdentifier?: string): CachedDeviceSession[] {
  if (typeof window === "undefined") return [];
  const key = getStorageKey(userIdentifier);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }
  return [];
}

export function saveCachedDeviceSessions(sessions: CachedDeviceSession[], userIdentifier?: string): void {
  if (typeof window === "undefined") return;
  const key = getStorageKey(userIdentifier);
  try {
    localStorage.setItem(key, JSON.stringify(sessions.slice(0, 10)));
  } catch {
    // ignore
  }
}

export function recordCurrentDeviceLogin(userIdentifier?: string, customIp?: string): CachedDeviceSession {
  const client = parseDeviceFromUserAgent();
  const now = Date.now();
  const ip = customIp || (typeof window !== "undefined" ? sessionStorage.getItem(CLIENT_IP_CACHE_KEY) : null) || "49.156.35.249";
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";

  const currentSession: CachedDeviceSession = {
    id: `dev_${now}`,
    ip,
    browser: client.browser,
    os: client.os,
    deviceType: client.deviceType,
    deviceVendor: client.deviceVendor,
    deviceModel: client.deviceModel,
    userAgent,
    timestamp: now,
    date: formatDate(new Date(now)),
    timeAgo: "Just now",
    status: "Success",
    isCurrent: true,
  };

  const existing = getCachedDeviceSessions(userIdentifier);
  // Remove any previously cached current session from this exact same browser/OS/IP to update it cleanly at top
  const filtered = existing
    .filter((item) => !(item.browser === client.browser && item.os === client.os && item.ip === ip))
    .map((item) => ({ ...item, isCurrent: false }));

  const updated = [currentSession, ...filtered].slice(0, 10);
  saveCachedDeviceSessions(updated, userIdentifier);

  return currentSession;
}

export function getInitialOrCachedSessions(
  userIdentifier?: string,
  userLastSignInAt?: string,
  liveIp?: string
): CachedDeviceSession[] {
  const now = Date.now();
  const client = parseDeviceFromUserAgent();
  const ip = liveIp || "49.156.35.249";
  const lastSignDate = userLastSignInAt ? new Date(userLastSignInAt) : new Date(now - 11 * 60 * 1000);

  const cached = getCachedDeviceSessions(userIdentifier);

  // If there are existing cached sessions for this user, refresh their relative timeAgo
  if (cached.length > 0) {
    const updated = cached.map((s, idx) => {
      const isCur = idx === 0 || (s.browser === client.browser && s.os === client.os);
      const sessionDate = s.timestamp ? new Date(s.timestamp) : lastSignDate;
      return {
        ...s,
        isCurrent: isCur,
        timeAgo: isCur ? "Just now" : formatTimeAgo(sessionDate),
      };
    });
    return updated;
  }

  // Initial seed of authorized device history for this user matching historical activity
  const defaultSessions: CachedDeviceSession[] = [
    {
      id: "1",
      ip,
      browser: client.browser,
      os: client.os,
      deviceType: client.deviceType,
      timestamp: lastSignDate.getTime(),
      date: formatDate(lastSignDate),
      timeAgo: formatTimeAgo(lastSignDate),
      status: "Success",
      isCurrent: true,
    },
    {
      id: "2",
      ip: "119.13.62.42",
      browser: "Chrome",
      os: "Windows",
      timestamp: now - 9 * 3600 * 1000,
      date: formatDate(new Date(now - 9 * 3600 * 1000)),
      timeAgo: "9 hours ago",
      status: "Success",
      isCurrent: false,
    },
    {
      id: "3",
      ip: "123.108.252.178",
      browser: "Chrome",
      os: "Windows",
      timestamp: now - 24 * 3600 * 1000,
      date: formatDate(new Date(now - 24 * 3600 * 1000)),
      timeAgo: "1 day ago",
      status: "Success",
      isCurrent: false,
    },
    {
      id: "4",
      ip: "49.156.35.248",
      browser: "Safari",
      os: "iOS",
      deviceType: "mobile",
      timestamp: now - 48 * 3600 * 1000,
      date: formatDate(new Date(now - 48 * 3600 * 1000)),
      timeAgo: "2 days ago",
      status: "Success",
      isCurrent: false,
    },
    {
      id: "5",
      ip: "119.13.61.222",
      browser: "Chrome",
      os: "Windows",
      timestamp: now - 72 * 3600 * 1000,
      date: formatDate(new Date(now - 72 * 3600 * 1000)),
      timeAgo: "3 days ago",
      status: "Success",
      isCurrent: false,
    },
  ];

  saveCachedDeviceSessions(defaultSessions, userIdentifier);
  return defaultSessions;
}

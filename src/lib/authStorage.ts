import { isPhoneIdentifier, isPhoneSyntheticEmail, phoneToSyntheticEmail } from "./phoneUtils";

const THIRTY_DAYS_DAYS = 30;
const THIRTY_DAYS_MS = THIRTY_DAYS_DAYS * 24 * 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = "hrm_last_act_t";

// 1. Native Cookie Helpers
export function setCookie(name: string, value: string, days: number = THIRTY_DAYS_DAYS): void {
  if (typeof document === "undefined") return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const nameEQ = encodeURIComponent(name) + "=";
  const ca = document.cookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === " ") c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) {
      try {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      } catch {
        return c.substring(nameEQ.length, c.length);
      }
    }
  }
  return null;
}

export function deleteCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax`;
}

// 2. Cookie + SessionStorage Adapter (Never uses localStorage for auth tokens)
export const authSessionStorage = {
  getItem: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    const cookieVal = getCookie(key);
    if (cookieVal) return cookieVal;
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (typeof window === "undefined") return;
    setCookie(key, value, THIRTY_DAYS_DAYS);
    try {
      sessionStorage.setItem(key, value);
    } catch {
      // ignore storage quota errors
    }
  },
  removeItem: (key: string): void => {
    if (typeof window === "undefined") return;
    deleteCookie(key);
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};

// 3. Normalized Phone & Email Identifier Helper
function normalizeAuthIdentifier(identifier: string): string {
  const raw = (identifier || "").trim().toLowerCase();
  if (isPhoneIdentifier(raw) || isPhoneSyntheticEmail(raw)) {
    return isPhoneSyntheticEmail(raw) ? raw : phoneToSyntheticEmail(raw);
  }
  return raw;
}

const DEVICE_KEY = (email: string) => `otp_dev_${normalizeAuthIdentifier(email)}`;

// 4. Remember Token Management (Stored in Session / Cookie with 30-Day Inactivity Expiration)
export function checkDeviceRemembered(email: string): boolean {
  if (!email) return false;
  const normalizedKey = DEVICE_KEY(email);
  const val = authSessionStorage.getItem(normalizedKey) || authSessionStorage.getItem(`otp_dev_${email.trim().toLowerCase()}`);
  if (!val) return false;

  try {
    const data = JSON.parse(val);
    if (typeof data === "object" && data?.expiresAt) {
      if (Date.now() > data.expiresAt) {
        clearDeviceRemembered(email);
        return false;
      }
      return true;
    }
  } catch {
    if (val === "true") return true;
  }
  return false;
}

export function setDeviceRemembered(email: string): void {
  if (!email) return;
  const normalizedKey = DEVICE_KEY(email);
  const rawKey = `otp_dev_${email.trim().toLowerCase()}`;
  const payload = JSON.stringify({
    remembered: true,
    expiresAt: Date.now() + THIRTY_DAYS_MS,
  });
  authSessionStorage.setItem(normalizedKey, payload);
  authSessionStorage.setItem(rawKey, payload);
}

export function clearDeviceRemembered(email: string): void {
  if (!email) return;
  const normalizedKey = DEVICE_KEY(email);
  const rawKey = `otp_dev_${email.trim().toLowerCase()}`;
  authSessionStorage.removeItem(normalizedKey);
  authSessionStorage.removeItem(rawKey);
}

// 5. 30-Day Activity Tracker (Auto-Logout on 30 Days of Inactivity)
export function recordUserActivity(): void {
  const now = Date.now().toString();
  authSessionStorage.setItem(LAST_ACTIVITY_KEY, now);
}

export function isSessionExpired30Days(): boolean {
  const lastActiveStr = authSessionStorage.getItem(LAST_ACTIVITY_KEY);
  if (!lastActiveStr) return false;
  const lastActive = parseInt(lastActiveStr, 10);
  if (isNaN(lastActive)) return false;
  return Date.now() - lastActive > THIRTY_DAYS_MS;
}

export function clearUserActivity(): void {
  authSessionStorage.removeItem(LAST_ACTIVITY_KEY);
}

// 6. Complete Session Wipe for Logout
export function clearAllAuthSessionData(): void {
  clearUserActivity();
  if (typeof document !== "undefined") {
    // Clear all cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      deleteCookie(name);
    }
  }
  try {
    sessionStorage.clear();
  } catch {}
  try {
    // Clear any legacy localStorage auth tokens
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith("sb-") || k.startsWith("otp_") || k.startsWith("hrm_last_"))) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {}
}

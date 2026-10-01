import type { User } from "@supabase/supabase-js";

import { isPhoneIdentifier, isPhoneSyntheticEmail, phoneToSyntheticEmail } from "@/lib/phoneUtils";

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ otpRequired: boolean }>;
  sendOTP: (email: string) => Promise<void>;
  verifyOTP: (email: string, otp: string, password: string, rememberDevice: boolean) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: { display_name?: string; avatar_url?: string }) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  isDeviceRemembered: (email: string) => boolean;
  forgetDevice: (email: string) => void;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = "hrm_last_activity_timestamp";

function normalizeAuthIdentifier(identifier: string): string {
  const raw = (identifier || "").trim().toLowerCase();
  if (isPhoneIdentifier(raw) || isPhoneSyntheticEmail(raw)) {
    return isPhoneSyntheticEmail(raw) ? raw : phoneToSyntheticEmail(raw);
  }
  return raw;
}

const DEVICE_KEY = (email: string) => `otp_device_${normalizeAuthIdentifier(email)}`;

export function checkDeviceRemembered(email: string): boolean {
  if (!email) return false;
  const normalizedKey = DEVICE_KEY(email);
  const item = localStorage.getItem(normalizedKey);
  if (!item) return false;

  try {
    const data = JSON.parse(item);
    if (typeof data === "object" && data?.expiresAt) {
      if (Date.now() > data.expiresAt) {
        clearDeviceRemembered(email);
        return false;
      }
      return true;
    }
  } catch {
    // Backward compatibility with legacy "true" string
    if (item === "true") return true;
  }
  return false;
}

export function setDeviceRemembered(email: string): void {
  if (!email) return;
  const normalizedKey = DEVICE_KEY(email);
  const rawKey = `otp_device_${email.trim().toLowerCase()}`;
  const payload = JSON.stringify({
    remembered: true,
    expiresAt: Date.now() + THIRTY_DAYS_MS,
  });
  localStorage.setItem(normalizedKey, payload);
  localStorage.removeItem(rawKey);
}

export function clearDeviceRemembered(email: string): void {
  if (!email) return;
  const normalizedKey = DEVICE_KEY(email);
  const rawKey = `otp_device_${email.trim().toLowerCase()}`;
  localStorage.removeItem(normalizedKey);
  localStorage.removeItem(rawKey);
}

export function recordUserActivity(): void {
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
}

export function isSessionExpired30Days(): boolean {
  const lastActiveStr = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!lastActiveStr) return false;
  const lastActive = parseInt(lastActiveStr, 10);
  if (isNaN(lastActive)) return false;
  return Date.now() - lastActive > THIRTY_DAYS_MS;
}

export function clearUserActivity(): void {
  localStorage.removeItem(LAST_ACTIVITY_KEY);
}

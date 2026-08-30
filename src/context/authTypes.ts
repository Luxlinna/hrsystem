import type { User } from "@supabase/supabase-js";

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

const DEVICE_KEY = (email: string) => `otp_device_${email}`;

export function checkDeviceRemembered(email: string): boolean {
  return localStorage.getItem(DEVICE_KEY(email)) === "true";
}

export function setDeviceRemembered(email: string): void {
  localStorage.setItem(DEVICE_KEY(email), "true");
}

export function clearDeviceRemembered(email: string): void {
  localStorage.removeItem(DEVICE_KEY(email));
}

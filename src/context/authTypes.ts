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

export {
  checkDeviceRemembered,
  setDeviceRemembered,
  clearDeviceRemembered,
  recordUserActivity,
  isSessionExpired30Days,
  clearUserActivity,
  clearAllAuthSessionData,
  authSessionStorage,
  getCookie,
  setCookie,
  deleteCookie,
} from "@/lib/authStorage";

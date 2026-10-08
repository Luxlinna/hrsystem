/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { type User } from "@supabase/supabase-js";
import { supabase, markSessionAlive } from "@/lib/supabase";
import type { AuthContextType } from "./authTypes";
import {
  checkDeviceRemembered,
  setDeviceRemembered,
  clearDeviceRemembered,
  recordUserActivity,
  isSessionExpired30Days,
  clearUserActivity,
  clearAllAuthSessionData,
} from "./authTypes";
import { isPhoneIdentifier } from "@/lib/phoneUtils";
import { resolveAuthEmail, sendOTPService, verifyOTPService } from "./authOtpService";
import { api } from "@/shared/lib/apiClient";

export type { AuthContextType };

interface BackendLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
  telegramOtpEnabled?: boolean;
  user: {
    id: string;
    email: string;
    role: string;
  };
  employee: any;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => ({ otpRequired: false }),
  sendOTP: async () => {},
  verifyOTP: async () => {},
  logout: async () => {},
  resetPassword: async () => {},
  updateProfile: async () => {},
  updatePassword: async () => {},
  isDeviceRemembered: () => false,
  forgetDevice: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isSessionExpired30Days()) {
      clearAllAuthSessionData();
      supabase.auth.signOut().catch(() => {});
      setUser(null);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && isSessionExpired30Days()) {
        clearAllAuthSessionData();
        supabase.auth.signOut().catch(() => {});
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      setLoading(false);
      supabase.realtime.setAuth(session?.access_token ?? null);
      if (session) {
        markSessionAlive();
        recordUserActivity();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      supabase.realtime.setAuth(session?.access_token ?? null);
      if (session) {
        markSessionAlive();
        recordUserActivity();
      }
    });

    let lastRecorded = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastRecorded > 60000) {
        lastRecorded = now;
        recordUserActivity();
      }
    };

    window.addEventListener("pointerdown", handleActivity, { passive: true });
    window.addEventListener("keydown", handleActivity, { passive: true });
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("pointerdown", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, []);

  const sendOTP = useCallback(async (id: string) => { await sendOTPService(id); }, []);

  /**
   * Backend-First Login Flow with rate limiting & Supabase resilience fallback
   */
  const login = async (identifier: string, password: string): Promise<{ otpRequired: boolean }> => {
    const isPhone = isPhoneIdentifier((identifier || "").trim());
    const resolvedEmail = resolveAuthEmail(identifier);

    let accessToken = "";
    let refreshToken = "";
    let authUserEmail = "";
    let employeeEmail = "";
    let employeePhone = "";
    let backendTelegramOtpEnabled: boolean | undefined = undefined;

    try {
      // 1. Call Express Backend first (checks brute-force rate limiter & credentials)
      const res = await api.post<BackendLoginResponse>('/auth/login', {
        email: resolvedEmail,
        password,
      });
      accessToken = res.accessToken;
      refreshToken = res.refreshToken;
      authUserEmail = res.user?.email || "";
      employeeEmail = res.employee?.email || "";
      employeePhone = res.employee?.phone || "";
      if (typeof res.telegramOtpEnabled === "boolean") {
        backendTelegramOtpEnabled = res.telegramOtpEnabled;
      }
    } catch (apiErr: any) {
      if (
        apiErr?.status === 429 ||
        apiErr?.statusCode === 429 ||
        apiErr?.message?.includes('Too many') ||
        apiErr?.message?.includes('wait')
      ) {
        const customErr: any = new Error(
          apiErr.message || 'Too many failed login attempts. Please wait before trying again.'
        );
        customErr.status = 429;
        customErr.statusCode = 429;
        customErr.retryAfterSeconds = apiErr.retryAfterSeconds || apiErr.details?.retryAfterSeconds;
        customErr.stage = apiErr.stage || apiErr.details?.stage;
        throw customErr;
      }
      if (apiErr?.status === 401 || apiErr?.message?.includes('Invalid') || apiErr?.message?.includes('password')) {
        const errMsg = apiErr?.message || 'Invalid login credentials';
        throw new Error(isPhone ? 'Invalid phone number or password' : errMsg);
      }
      // Direct Supabase fallback for resilience
      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });
      if (error || !data.session) {
        throw new Error(isPhone ? 'Invalid phone number or password' : error?.message || 'Invalid email or password');
      }
      accessToken = data.session.access_token;
      refreshToken = data.session.refresh_token;
      authUserEmail = data.user?.email || "";
    }

    const isTrusted =
      checkDeviceRemembered(resolvedEmail) ||
      checkDeviceRemembered(identifier) ||
      (authUserEmail ? checkDeviceRemembered(authUserEmail) : false) ||
      (employeeEmail ? checkDeviceRemembered(employeeEmail) : false) ||
      (employeePhone ? checkDeviceRemembered(employeePhone) : false);

    const isPhoneUser = isPhone || isPhoneSyntheticEmail(resolvedEmail);
    let skipOtpForPhone = false;

    if (isPhoneUser) {
      if (backendTelegramOtpEnabled !== undefined) {
        skipOtpForPhone = !backendTelegramOtpEnabled;
      } else {
        // Direct Supabase fallback check from system_settings
        const { data: otpSetting } = await supabase
          .from("system_settings")
          .select("value")
          .eq("key", "telegram_otp_enabled")
          .maybeSingle();

        if (otpSetting?.value === "false") {
          skipOtpForPhone = true;
        }
      }
    }

    if (isTrusted || skipOtpForPhone) {
      // Device is trusted OR Phone OTP is disabled: set Supabase session in browser immediately
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        throw new Error(sessionError.message);
      }

      recordUserActivity();
      // Keep existing 3-day window from OTP verification intact; do not reset countdown on routine login
      return { otpRequired: false };
    }

    // Untrusted device and OTP enabled: Send 2FA/OTP code
    await sendOTP(resolvedEmail);
    return { otpRequired: true };
  };

  /**
   * Backend-First OTP Verification Flow
   */
  const verifyOTP = useCallback(async (identifier: string, otp: string, password: string, rememberDevice: boolean) => {
    const resolvedEmail = await verifyOTPService(identifier, otp);

    let accessToken = "";
    let refreshToken = "";
    let authUserEmail = "";
    let employeeEmail = "";
    let employeePhone = "";

    try {
      // Call Backend to verify and get new session tokens
      const res = await api.post<BackendLoginResponse>('/auth/login', {
        email: resolvedEmail,
        password,
      });
      accessToken = res.accessToken;
      refreshToken = res.refreshToken;
      authUserEmail = res.user?.email || "";
      employeeEmail = res.employee?.email || "";
      employeePhone = res.employee?.phone || "";
    } catch {
      // Fallback directly to Supabase signInWithPassword for resilience
      const { data, error } = await supabase.auth.signInWithPassword({
        email: resolvedEmail,
        password,
      });
      if (error || !data.session) {
        throw new Error(error?.message || 'Failed to authenticate session');
      }
      accessToken = data.session.access_token;
      refreshToken = data.session.refresh_token;
      authUserEmail = data.user?.email || "";
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (sessionError) throw new Error(sessionError.message);

    recordUserActivity();
    if (rememberDevice !== false) {
      setDeviceRemembered(resolvedEmail);
      if (identifier) setDeviceRemembered(identifier);
      if (authUserEmail) setDeviceRemembered(authUserEmail);
      if (employeeEmail) setDeviceRemembered(employeeEmail);
      if (employeePhone) setDeviceRemembered(employeePhone);
    } else {
      clearDeviceRemembered(resolvedEmail);
      if (identifier) clearDeviceRemembered(identifier);
      if (authUserEmail) clearDeviceRemembered(authUserEmail);
      if (employeeEmail) clearDeviceRemembered(employeeEmail);
      if (employeePhone) clearDeviceRemembered(employeePhone);
    }
  }, []);

  const logout = async () => {
    clearAllAuthSessionData();
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
  };

  /**
   * Backend-First Password Reset with rate limiter
   */
  const resetPassword = async (email: string) => {
    try {
      await api.post('/auth/forgot-password', { email });
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to request password reset');
    }
  };

  const updateProfile = async (updates: { display_name?: string; avatar_url?: string }) => {
    const { data, error } = await supabase.auth.updateUser({ data: updates });
    if (error) throw error;
    if (data.user) setUser(data.user);
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, sendOTP, verifyOTP, logout,
      resetPassword, updateProfile, updatePassword,
      isDeviceRemembered: checkDeviceRemembered,
      forgetDevice: clearDeviceRemembered,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

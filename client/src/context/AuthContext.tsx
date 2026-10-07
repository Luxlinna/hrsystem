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

    try {
      // 1. Call Express Backend first (checks brute-force rate limiter & credentials)
      const res = await api.post<BackendLoginResponse>('/auth/login', {
        email: resolvedEmail,
        password,
      });
      accessToken = res.accessToken;
      refreshToken = res.refreshToken;
    } catch (apiErr: any) {
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
    }

    if (checkDeviceRemembered(resolvedEmail) || checkDeviceRemembered(identifier)) {
      // Device is trusted: set Supabase session in browser immediately
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

    // Untrusted device: Send 2FA/OTP code
    await sendOTP(resolvedEmail);
    return { otpRequired: true };
  };

  /**
   * Backend-First OTP Verification Flow
   */
  const verifyOTP = useCallback(async (identifier: string, otp: string, password: string, rememberDevice: boolean) => {
    const resolvedEmail = await verifyOTPService(identifier, otp);

    // Call Backend to verify and get new session tokens
    const res = await api.post<BackendLoginResponse>('/auth/login', {
      email: resolvedEmail,
      password,
    });

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: res.accessToken,
      refresh_token: res.refreshToken,
    });

    if (sessionError) throw new Error(sessionError.message);

    recordUserActivity();
    if (rememberDevice) {
      setDeviceRemembered(resolvedEmail);
      if (identifier) setDeviceRemembered(identifier);
    } else {
      clearDeviceRemembered(resolvedEmail);
      if (identifier) clearDeviceRemembered(identifier);
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

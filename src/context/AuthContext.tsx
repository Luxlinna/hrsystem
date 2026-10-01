/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { createClient, type User } from "@supabase/supabase-js";
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

export type { AuthContextType };

const supabaseUrl = import.meta.env.VITE_PUBLIC_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || "";

const authVerifierClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  },
});

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

  const login = async (identifier: string, password: string): Promise<{ otpRequired: boolean }> => {
    const isPhone = isPhoneIdentifier((identifier || "").trim());
    const resolvedEmail = resolveAuthEmail(identifier);

    if (checkDeviceRemembered(resolvedEmail) || checkDeviceRemembered(identifier)) {
      const { error } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
      if (error) {
        throw new Error(isPhone && (error.message.includes("Invalid login credentials") || error.status === 400) ? "Invalid phone number or password" : error.message);
      }
      recordUserActivity();
      setDeviceRemembered(resolvedEmail);
      setDeviceRemembered(identifier);
      return { otpRequired: false };
    }

    const { error } = await authVerifierClient.auth.signInWithPassword({ email: resolvedEmail, password });
    if (error) {
      throw new Error(isPhone && (error.message.includes("Invalid login credentials") || error.status === 400) ? "Invalid phone number or password" : error.message);
    }

    await sendOTP(resolvedEmail);
    return { otpRequired: true };
  };

  const verifyOTP = useCallback(async (identifier: string, otp: string, password: string, rememberDevice: boolean) => {
    const resolvedEmail = await verifyOTPService(identifier, otp);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
    if (signInError) throw new Error(signInError.message);

    recordUserActivity();
    // Cache and persist session until the user explicitly logs out
    setDeviceRemembered(resolvedEmail);
    if (identifier) setDeviceRemembered(identifier);
    if (!rememberDevice) {
      // If user unchecks remember, will require OTP next time on different device
    }
  }, []);

  const logout = async () => {
    clearAllAuthSessionData();
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.functions.invoke("request-password-reset", { body: { email } });
    if (error) throw new Error((data as any)?.error || error.message || "Failed to request password reset");
    if ((data as any)?.error) throw new Error((data as any).error);
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

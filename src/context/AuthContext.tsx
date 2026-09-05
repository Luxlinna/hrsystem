/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, markSessionAlive } from "@/lib/supabase";
import type { AuthContextType } from "./authTypes";
import { checkDeviceRemembered, setDeviceRemembered, clearDeviceRemembered } from "./authTypes";
import { isPhoneIdentifier, isPhoneSyntheticEmail, phoneToSyntheticEmail } from "@/lib/phoneUtils";

export type { AuthContextType };

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
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      supabase.realtime.setAuth(session?.access_token ?? null);
      if (session) markSessionAlive();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      supabase.realtime.setAuth(session?.access_token ?? null);
      if (session) markSessionAlive();
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOTP = useCallback(async (identifier: string) => {
    const raw = (identifier || "").trim();
    const isPhone = isPhoneIdentifier(raw) || isPhoneSyntheticEmail(raw);
    const resolvedEmail = isPhone
      ? (isPhoneSyntheticEmail(raw) ? raw.toLowerCase() : phoneToSyntheticEmail(raw))
      : raw.toLowerCase();

    const { data, error } = await supabase.functions.invoke("send-otp", {
      body: { email: resolvedEmail },
    });
    if (error) {
      let detail = data?.error;
      let botUrl = data?.bot_url;
      let msg = data?.message;
      if (error.context instanceof Response) {
        try {
          const body = await error.context.json();
          detail = body?.error || detail;
          botUrl = body?.bot_url || botUrl;
          msg = body?.message || msg;
        } catch { /* non-JSON */ }
      }
      const errObj: any = new Error(msg || detail || error.message || "Failed to send OTP");
      if (detail === "telegram_not_connected" || msg?.includes("Telegram is not connected")) {
        errObj.telegramNotConnected = true;
        errObj.botUrl = botUrl || "https://t.me/HRM_OPS_bot?start=connect";
      }
      throw errObj;
    }
    if (data?.error) {
      const errObj: any = new Error(data.message || data.error);
      if (data.error === "telegram_not_connected" || data.message?.includes("Telegram is not connected")) {
        errObj.telegramNotConnected = true;
        errObj.botUrl = data.bot_url || "https://t.me/HRM_OPS_bot?start=connect";
      }
      throw errObj;
    }
  }, []);

  const login = async (identifier: string, password: string): Promise<{ otpRequired: boolean }> => {
    const raw = (identifier || "").trim();
    const isPhone = isPhoneIdentifier(raw) || isPhoneSyntheticEmail(raw);
    const resolvedEmail = isPhone
      ? (isPhoneSyntheticEmail(raw) ? raw.toLowerCase() : phoneToSyntheticEmail(raw))
      : raw.toLowerCase();

    if (checkDeviceRemembered(resolvedEmail)) {
      const { error } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
      if (error) {
        if (isPhone && (error.message.includes("Invalid login credentials") || error.status === 400)) {
          throw new Error("Invalid phone number or password");
        }
        throw error;
      }
      return { otpRequired: false };
    }

    const { error } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
    if (error) {
      if (isPhone && (error.message.includes("Invalid login credentials") || error.status === 400)) {
        throw new Error("Invalid phone number or password");
      }
      throw error;
    }

    try {
      await sendOTP(resolvedEmail);
    } catch (otpErr) {
      await supabase.auth.signOut().catch(() => {});
      throw otpErr;
    }

    await supabase.auth.signOut();
    return { otpRequired: true };
  };

  const verifyOTP = useCallback(async (identifier: string, otp: string, password: string, rememberDevice: boolean) => {
    const raw = (identifier || "").trim();
    const isPhone = isPhoneIdentifier(raw) || isPhoneSyntheticEmail(raw);
    const resolvedEmail = isPhone
      ? (isPhoneSyntheticEmail(raw) ? raw.toLowerCase() : phoneToSyntheticEmail(raw))
      : raw.toLowerCase();

    const { data, error } = await supabase.functions.invoke("verify-otp", {
      body: { email: resolvedEmail, otp },
    });
    if (error) {
      let detail = data?.error;
      if (!detail && error.context instanceof Response) {
        try {
          const body = await error.context.json();
          detail = body?.error;
        } catch { /* non-JSON */ }
      }
      throw new Error(detail || error.message || "Failed to verify OTP");
    }
    if (data?.error) throw new Error(data.error);

    await supabase.auth.signOut().catch(() => {});
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
    if (signInError) throw new Error(signInError.message);

    if (rememberDevice) {
      setDeviceRemembered(resolvedEmail);
    }
  }, []);

  const logout = async () => {
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
  };

  const resetPassword = async (email: string) => {
    const { data, error } = await supabase.functions.invoke("request-password-reset", {
      body: { email },
    });
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
      user,
      loading,
      login,
      sendOTP,
      verifyOTP,
      logout,
      resetPassword,
      updateProfile,
      updatePassword,
      isDeviceRemembered: checkDeviceRemembered,
      forgetDevice: clearDeviceRemembered,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

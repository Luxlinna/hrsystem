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
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.access_token) {
        supabase.realtime.setAuth(data.session.access_token);
        markSessionAlive();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      supabase.realtime.setAuth(session?.access_token ?? null);
      if (session) markSessionAlive();
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOTP = useCallback(async (email: string) => {
    const { data, error } = await supabase.functions.invoke("send-otp", {
      body: { email },
    });
    if (error) {
      let detail = data?.error;
      if (!detail && error.context instanceof Response) {
        try {
          const body = await error.context.json();
          detail = body?.error;
        } catch { /* non-JSON */ }
      }
      const msg = detail || error.message || "Failed to send OTP";
      throw new Error(msg);
    }
    if (data?.error) throw new Error(data.error);
  }, []);

  const login = async (email: string, password: string): Promise<{ otpRequired: boolean }> => {
    if (checkDeviceRemembered(email)) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { otpRequired: false };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    await sendOTP(email);
    await supabase.auth.signOut();
    return { otpRequired: true };
  };

  const verifyOTP = useCallback(async (email: string, otp: string, password: string, rememberDevice: boolean) => {
    const { data, error } = await supabase.functions.invoke("verify-otp", {
      body: { email, otp },
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
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) throw new Error(signInError.message);

    if (rememberDevice) {
      setDeviceRemembered(email);
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

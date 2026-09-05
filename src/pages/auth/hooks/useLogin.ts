import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export type LoginStep = "password" | "otp";

export function useLogin() {
  const [step, setStep] = useState<LoginStep>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpInputRef = useRef<(HTMLInputElement | null)[]>([]);
  const { login, sendOTP, verifyOTP } = useAuth();
  const navigate = useNavigate();

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Auto-focus OTP input when step changes
  useEffect(() => {
    if (step === "otp") {
      setTimeout(() => otpInputRef.current[0]?.focus(), 100);
    }
  }, [step]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.otpRequired) {
        setStep("otp");
        setResendCooldown(30);
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Invalid email, phone number, or password");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = useCallback(async (otpValue?: string) => {
    const code = otpValue || otp.join("");
    if (code.length !== 6) return;
    setError("");
    setLoading(true);
    try {
      await verifyOTP(email, code, password, rememberDevice);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Invalid verification code");
      setOtp(["", "", "", "", "", ""]);
      otpInputRef.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }, [email, otp, password, rememberDevice, verifyOTP, navigate]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");

    if (value && index < 5) {
      otpInputRef.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== "")) {
      handleOtpSubmit(newOtp.join(""));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputRef.current[index - 1]?.focus();
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError("");
    try {
      await sendOTP(email);
      setResendCooldown(30);
      setOtp(["", "", "", "", "", ""]);
      otpInputRef.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleBackToLogin = () => {
    setStep("password");
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setPassword("");
  };

  return {
    step,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    otp,
    error,
    loading,
    rememberDevice,
    setRememberDevice,
    resendCooldown,
    otpInputRef,
    handlePasswordSubmit,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpSubmit,
    handleResend,
    handleBackToLogin,
  };
}

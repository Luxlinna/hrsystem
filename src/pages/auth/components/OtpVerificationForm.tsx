import React, { memo } from "react";
import { isPhoneIdentifier, isPhoneSyntheticEmail, syntheticEmailToPhone, formatDisplayPhone } from "@/lib/phoneUtils";

interface OtpVerificationFormProps {
  email: string;
  otp: string[];
  otpInputRef: React.MutableRefObject<(HTMLInputElement | null)[]>;
  loading: boolean;
  rememberDevice: boolean;
  setRememberDevice: (remember: boolean) => void;
  resendCooldown: number;
  onOtpChange: (index: number, value: string) => void;
  onOtpKeyDown: (index: number, e: React.KeyboardEvent) => void;
  onSubmit: (otpValue?: string) => void;
  onResend: () => void;
  onBackToLogin: () => void;
}

export const OtpVerificationForm = memo(function OtpVerificationForm({
  email,
  otp,
  otpInputRef,
  loading,
  rememberDevice,
  setRememberDevice,
  resendCooldown,
  onOtpChange,
  onOtpKeyDown,
  onSubmit,
  onResend,
  onBackToLogin,
}: OtpVerificationFormProps) {
  const isPhone = isPhoneIdentifier(email) || isPhoneSyntheticEmail(email);
  const displayTarget = isPhone
    ? formatDisplayPhone(syntheticEmailToPhone(email))
    : email;

  return (
    <div className="space-y-5">
      <div className="text-center">
        {isPhone ? (
          <>
            <div className="w-14 h-14 bg-[#229ED9]/10 rounded-full flex items-center justify-center mx-auto mb-3 text-[#229ED9]">
              <i className="ri-telegram-fill text-3xl" />
            </div>
            <p className="text-[13px] text-gray-600">We sent a 6-digit verification code to Telegram</p>
            <p className="text-[15px] font-semibold text-gray-900 mt-1 flex items-center justify-center gap-1.5">
              <i className="ri-telegram-line text-[#229ED9]" />
              <span>{displayTarget}</span>
            </p>
            <p className="text-[11px] text-gray-400 mt-1">Check your Telegram app or group messages</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <i className="ri-shield-check-line text-2xl text-[#253C7D]" />
            </div>
            <p className="text-[13px] text-gray-600">We sent a 6-digit code to</p>
            <p className="text-[13px] font-semibold text-gray-900">{email}</p>
          </>
        )}
      </div>

      <div className="flex justify-center gap-2.5">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { otpInputRef.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => onOtpChange(i, e.target.value)}
            onKeyDown={(e) => onOtpKeyDown(i, e)}
            className="w-11 h-12 text-center text-[18px] font-semibold text-gray-900 border border-gray-200 rounded-lg focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
          />
        ))}
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={rememberDevice}
          onChange={(e) => setRememberDevice(e.target.checked)}
          className="w-4 h-4 rounded border-gray-300 text-[#253C7D] focus:ring-[#253C7D]/20"
        />
        <span className="text-[12px] text-gray-600">Remember this device for 30 days</span>
      </label>

      <button
        type="button"
        onClick={() => onSubmit()}
        disabled={loading || otp.some((d) => !d)}
        className="w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] active:scale-[0.98] transition-all disabled:opacity-60 cursor-pointer"
      >
        {loading ? "Verifying..." : "Verify"}
      </button>

      <div className="text-center space-y-2">
        <p className="text-[12px] text-gray-500">
          Didn't receive the code?{" "}
          {resendCooldown > 0 ? (
            <span className="text-gray-400">Resend in {resendCooldown}s</span>
          ) : (
            <button
              type="button"
              onClick={onResend}
              className="text-[#253C7D] font-semibold hover:underline cursor-pointer"
            >
              Resend Code
            </button>
          )}
        </p>
        <button
          type="button"
          onClick={onBackToLogin}
          className="text-[12px] text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        >
          <i className="ri-arrow-left-line mr-1" />
          Back to Sign In
        </button>
      </div>
    </div>
  );
});

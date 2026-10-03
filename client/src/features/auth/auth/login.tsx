import { useLogin } from "./hooks/useLogin";
import { PasswordLoginForm } from "./components/PasswordLoginForm";
import { OtpVerificationForm } from "./components/OtpVerificationForm";

export default function LoginPage() {
  const {
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
    telegramBotUrl,
    setTelegramBotUrl,
    otpInputRef,
    handlePasswordSubmit,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpSubmit,
    handleResend,
    handleBackToLogin,
  } = useLogin();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F5F0]">
      <div className="w-full max-w-md bg-white rounded-2xl p-8 md:p-10 border border-gray-100 shadow-xs">
        <div className="text-center mb-8">
          <img src="/logo-mark.png" alt="HRM_OPS Logo" className="w-14 h-14 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#1A1A1A]">HRM_OPS</h1>
          <p className="text-[13px] text-gray-500 mt-1">
            {telegramBotUrl
              ? "Connect Telegram to continue"
              : step === "password"
              ? "Sign in to your account"
              : "Enter verification code"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-[12px] text-red-600">
            {error}
          </div>
        )}

        {telegramBotUrl ? (
          <div className="space-y-4">
            <div className="p-4 bg-sky-50/80 border border-sky-200/80 rounded-xl text-center space-y-2">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-xs text-[#229ED9]">
                <i className="ri-telegram-fill text-2xl" />
              </div>
              <h3 className="text-[14px] font-bold text-gray-900">Connect Your Telegram</h3>
              <p className="text-[12px] text-gray-600 leading-relaxed">
                To receive your login verification codes directly on Telegram for free, link your phone number with <strong>@HRM_OPS_bot</strong>.
              </p>
            </div>

            <div className="space-y-2.5">
              <a
                href={telegramBotUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-[#229ED9] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1C8EC4] transition-all active:scale-[0.98] shadow-xs cursor-pointer"
              >
                <i className="ri-telegram-line text-lg" />
                <span>1. Open @HRM_OPS_bot &amp; Tap Start</span>
              </a>

              <button
                type="button"
                onClick={() => handlePasswordSubmit()}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#253C7D] text-white rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                <i className="ri-check-line text-lg" />
                <span>{loading ? "Verifying..." : "2. I've Connected, Send My Code"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setTelegramBotUrl(null)}
              className="w-full text-center text-[12px] text-gray-500 hover:text-gray-700 transition-colors cursor-pointer pt-1"
            >
              <i className="ri-arrow-left-line mr-1" />
              Back to Sign In
            </button>
          </div>
        ) : step === "password" ? (
          <PasswordLoginForm
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            showPassword={showPassword}
            setShowPassword={setShowPassword}
            loading={loading}
            onSubmit={handlePasswordSubmit}
          />
        ) : (
          <OtpVerificationForm
            email={email}
            otp={otp}
            otpInputRef={otpInputRef}
            loading={loading}
            rememberDevice={rememberDevice}
            setRememberDevice={setRememberDevice}
            resendCooldown={resendCooldown}
            onOtpChange={handleOtpChange}
            onOtpKeyDown={handleOtpKeyDown}
            onSubmit={handleOtpSubmit}
            onResend={handleResend}
            onBackToLogin={handleBackToLogin}
          />
        )}
      </div>
    </div>
  );
}

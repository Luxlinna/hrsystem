import { useState, useRef, useEffect, memo } from "react";
import { verifyPrivacyPin } from "@/lib/privacyPin";

interface PrivacyPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userEmail?: string | null;
  title?: string;
  description?: string;
}

export const PrivacyPinModal = memo(function PrivacyPinModal({
  isOpen,
  onClose,
  onSuccess,
  userEmail,
  title = "Privacy PIN Verification",
  description = "Enter your 4-digit security PIN to unmask confidential salary data.",
}: PrivacyPinModalProps) {
  const PIN_LENGTH = 4;
  const [digits, setDigits] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setDigits(Array(PIN_LENGTH).fill(""));
      setError(false);
      setShake(false);
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    // Only accept numbers
    const clean = val.replace(/\D/g, "");
    if (!clean) {
      const next = [...digits];
      next[index] = "";
      setDigits(next);
      return;
    }

    const next = [...digits];
    // If pasted multiple digits
    if (clean.length > 1) {
      const pasted = clean.slice(0, PIN_LENGTH).split("");
      pasted.forEach((d, i) => {
        next[i] = d;
      });
      setDigits(next);
      const focusIndex = Math.min(pasted.length, PIN_LENGTH - 1);
      inputRefs.current[focusIndex]?.focus();
      checkPin(next.join(""));
      return;
    }

    next[index] = clean[clean.length - 1];
    setDigits(next);
    setError(false);

    // Auto advance to next input
    if (index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else {
      // Completed last digit
      checkPin(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        const next = [...digits];
        next[index - 1] = "";
        setDigits(next);
        inputRefs.current[index - 1]?.focus();
      } else {
        const next = [...digits];
        next[index] = "";
        setDigits(next);
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    } else if (e.key === "Escape") {
      onClose();
    } else if (e.key === "Enter") {
      checkPin(digits.join(""));
    }
  };

  const handleKeypadPress = (num: string) => {
    const firstEmptyIndex = digits.findIndex((d) => d === "");
    if (firstEmptyIndex !== -1) {
      handleDigitChange(firstEmptyIndex, num);
    }
  };

  const handleKeypadBackspace = () => {
    for (let i = PIN_LENGTH - 1; i >= 0; i--) {
      if (digits[i] !== "") {
        const next = [...digits];
        next[i] = "";
        setDigits(next);
        inputRefs.current[i]?.focus();
        break;
      }
    }
  };

  const checkPin = (enteredPin: string) => {
    if (enteredPin.length < PIN_LENGTH) return;
    const isValid = verifyPrivacyPin(enteredPin, userEmail);
    if (isValid) {
      onSuccess();
      onClose();
    } else {
      setError(true);
      setShake(true);
      setTimeout(() => {
        setDigits(Array(PIN_LENGTH).fill(""));
        setShake(false);
        inputRefs.current[0]?.focus();
      }, 400);
    }
  };

  const isComplete = digits.every((d) => d !== "");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div
        className={`bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-xl w-full max-w-[360px] overflow-hidden ${
          shake ? "animate-shake" : ""
        }`}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#253C7D]/10 text-[#253C7D] dark:bg-sky-950 dark:text-sky-400 flex items-center justify-center text-xs">
              <i className="ri-shield-keyhole-line" />
            </div>
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-base leading-none cursor-pointer"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-5">
            {description}
          </p>

          {/* 4 Digit Slots */}
          <div className="flex items-center justify-center gap-2.5 mb-4">
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-11 h-12 text-center text-lg font-bold font-mono rounded border transition-all focus:outline-none ${
                  error
                    ? "border-rose-400 bg-rose-50/40 text-rose-600 dark:bg-rose-950/30 dark:border-rose-600"
                    : digit
                    ? "border-[#253C7D] bg-slate-50 dark:bg-slate-800 text-[#253C7D] dark:text-sky-400 font-bold"
                    : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]"
                }`}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-[11px] text-rose-500 font-medium text-center mb-3 flex items-center justify-center gap-1">
              <i className="ri-error-warning-fill text-xs" />
              <span>Incorrect PIN. Please try again.</span>
            </div>
          )}

          {/* Numeric Keypad for fast input */}
          <div className="grid grid-cols-3 gap-1.5 max-w-[220px] mx-auto my-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleKeypadPress(String(n))}
                className="h-10 rounded border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/80 active:bg-slate-200 transition-colors cursor-pointer select-none"
              >
                {n}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setDigits(Array(PIN_LENGTH).fill(""))}
              className="h-10 rounded border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800 text-[10px] font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer select-none uppercase"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleKeypadPress("0")}
              className="h-10 rounded border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer select-none"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleKeypadBackspace}
              className="h-10 rounded border border-slate-200 dark:border-slate-700/80 bg-slate-50/80 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 active:bg-slate-200 transition-colors flex items-center justify-center cursor-pointer select-none"
            >
              <i className="ri-delete-back-2-line" />
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-slate-300 dark:border-slate-600 text-xs font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => checkPin(digits.join(""))}
            disabled={!isComplete}
            className="px-3.5 py-1.5 rounded bg-[#253C7D] hover:bg-[#1b2d5e] text-white text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
          >
            Unlock
          </button>
        </div>
      </div>
    </div>
  );
});

import React from "react";

interface FormRowProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  alignTop?: boolean;
}

export function FormRow({
  label,
  required = false,
  children,
  className = "",
  alignTop = false,
}: FormRowProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row py-2 text-[13px] gap-1 sm:gap-2 ${
        alignTop ? "sm:items-start" : "sm:items-center"
      } ${className}`}
    >
      <div
        className={`w-full sm:w-48 lg:w-56 shrink-0 sm:text-right pr-0 sm:pr-4 text-slate-600 dark:text-slate-300 font-normal ${
          alignTop ? "pt-1.5" : ""
        }`}
      >
        <span>{label}</span>
        {required && <span className="text-rose-500 ml-1 font-bold">*</span>}
      </div>
      <div className="flex-1 max-w-xl">{children}</div>
    </div>
  );
}

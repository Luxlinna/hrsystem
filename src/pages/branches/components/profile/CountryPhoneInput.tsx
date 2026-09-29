import React, { useState, useRef, useEffect, useMemo } from "react";
import { COUNTRIES, CountryDialCode } from "./countriesData";

interface CountryPhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CountryPhoneInput({
  value,
  onChange,
  placeholder = "+855987654321",
  className = "",
}: CountryPhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Detect current country from value or default to Cambodia (KH)
  const selectedCountry = useMemo(() => {
    if (!value) return COUNTRIES[0]; // Cambodia default
    const clean = value.trim();
    // Sort countries by dialCode length descending to match longest prefix first (e.g. +1684 before +1)
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    const found = sorted.find((c) => clean.startsWith(c.dialCode));
    return found || COUNTRIES[0];
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto focus search input
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Filter countries by search term
  const filteredCountries = useMemo(() => {
    if (!search.trim()) return COUNTRIES;
    const q = search.toLowerCase().trim();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.nativeName && c.nativeName.toLowerCase().includes(q)) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [search]);

  const handleSelectCountry = (country: CountryDialCode) => {
    // If value already starts with previous dialCode, swap it
    let nationalNumber = value;
    if (selectedCountry && value.startsWith(selectedCountry.dialCode)) {
      nationalNumber = value.slice(selectedCountry.dialCode.length);
    } else if (value.startsWith("+")) {
      // Find and strip any existing dial code
      const match = COUNTRIES.find((c) => value.startsWith(c.dialCode));
      if (match) {
        nationalNumber = value.slice(match.dialCode.length);
      }
    }
    nationalNumber = nationalNumber.replace(/^\s+/, "");
    onChange(`${country.dialCode}${nationalNumber}`);
    setIsOpen(false);
    setSearch("");
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="flex items-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden text-xs focus-within:border-[#2b8de3] focus-within:ring-1 focus-within:ring-[#2b8de3]/20 transition-all">
        {/* Country Selector Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border-r border-slate-300 dark:border-slate-700 flex items-center gap-1.5 shrink-0 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer select-none transition-colors"
          title={`${selectedCountry.name} (${selectedCountry.dialCode})`}
        >
          <span className="text-base leading-none">{selectedCountry.flag}</span>
          <i className={`ri-arrow-down-s-fill text-[11px] text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {/* Text Input */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-1.5 bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {/* Country Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 top-full left-0 mt-1 w-72 sm:w-80 max-h-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Box */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/70">
            <div className="relative">
              <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <i className="ri-close-circle-fill" />
                </button>
              )}
            </div>
          </div>

          {/* Countries List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100/60 dark:divide-slate-800/60 max-h-56">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No country found
              </div>
            ) : (
              filteredCountries.map((country) => {
                const isSelected = selectedCountry.code === country.code && selectedCountry.dialCode === country.dialCode;
                return (
                  <button
                    key={`${country.code}-${country.dialCode}`}
                    type="button"
                    onClick={() => handleSelectCountry(country)}
                    className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors ${
                      isSelected ? "bg-sky-50/70 dark:bg-sky-950/40 text-[#0088cc] font-medium" : "text-slate-700 dark:text-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="text-base leading-none shrink-0">{country.flag}</span>
                      <span className="truncate">
                        {country.name}
                        {country.nativeName && country.nativeName !== country.name && (
                          <span className="text-slate-400 font-normal ml-1">
                            ({country.nativeName})
                          </span>
                        )}
                      </span>
                    </div>
                    <span className="text-slate-400 dark:text-slate-400 text-[11px] font-mono shrink-0">
                      {country.dialCode}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

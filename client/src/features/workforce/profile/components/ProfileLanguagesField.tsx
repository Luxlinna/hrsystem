import React, { useState } from "react";

interface ProfileLanguagesFieldProps {
  languages: string[];
  setLanguages: React.Dispatch<React.SetStateAction<string[]>>;
}

const COMMON_LANG_SUGGESTIONS = [
  "English (Fluent)",
  "Khmer (Native)",
  "Chinese (Mandarin)",
  "French",
  "Vietnamese",
  "Thai",
];

export function ProfileLanguagesField({
  languages,
  setLanguages,
}: ProfileLanguagesFieldProps) {
  const [langInput, setLangInput] = useState("");

  const handleAddLanguage = (text?: string) => {
    const val = (text || langInput).trim().replace(/,/g, "");
    if (val && !languages.includes(val)) {
      setLanguages([...languages, val]);
      if (!text) setLangInput("");
    }
  };

  const handleKeyDownLanguage = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddLanguage();
    }
  };

  const handleRemoveLanguage = (langToRemove: string) => {
    setLanguages(languages.filter((l) => l !== langToRemove));
  };

  return (
    <div className="pt-5 border-t border-gray-100">
      <label className="text-[12px] font-bold text-gray-700 block mb-2">
        Languages Spoken & Fluency
      </label>

      <div className="flex flex-wrap gap-2 mb-3">
        {languages.map((lang) => (
          <span
            key={lang}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs transition-all hover:bg-emerald-100"
          >
            <i className="ri-translate-2 text-[12px]"></i>
            <span>{lang}</span>
            <button
              type="button"
              onClick={() => handleRemoveLanguage(lang)}
              className="hover:text-rose-600 transition-colors cursor-pointer text-[13px]"
            >
              <i className="ri-close-line"></i>
            </button>
          </span>
        ))}
        {languages.length === 0 && (
          <span className="text-[12px] text-gray-400 italic py-1">
            No languages added yet.
          </span>
        )}
      </div>

      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={langInput}
          onChange={(e) => setLangInput(e.target.value)}
          onKeyDown={handleKeyDownLanguage}
          placeholder="e.g. English (Fluent), Khmer (Native)..."
          className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-800 focus:outline-none focus:border-[#253C7D] focus:bg-white"
        />
        <button
          type="button"
          onClick={() => handleAddLanguage()}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-[12px] cursor-pointer transition-colors"
        >
          + Add
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] text-gray-400 font-medium mr-1">Quick Add:</span>
        {COMMON_LANG_SUGGESTIONS.filter((l) => !languages.includes(l)).slice(0, 4).map((suggested) => (
          <button
            key={suggested}
            type="button"
            onClick={() => handleAddLanguage(suggested)}
            className="px-2 py-0.5 rounded-lg bg-gray-100/80 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 text-gray-600 text-[11px] border border-gray-200/60 transition-colors cursor-pointer"
          >
            + {suggested}
          </button>
        ))}
      </div>
    </div>
  );
}

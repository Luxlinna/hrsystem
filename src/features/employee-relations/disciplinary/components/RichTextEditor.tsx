import React, { useRef, useEffect, useCallback, memo } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor = memo(function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  minHeight = "150px",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  // Sync value from prop into editor without resetting cursor during typing
  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const exec = useCallback((command: string, val: string | undefined = undefined) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const toolbarButton = (
    label: string | React.ReactNode,
    title: string,
    onClick: () => void,
    extraClass = ""
  ) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => {
        e.preventDefault(); // prevents losing focus from editor
        onClick();
      }}
      className={`w-7 h-7 flex items-center justify-center text-slate-700 hover:bg-slate-200/80 rounded transition-colors text-xs font-semibold cursor-pointer select-none ${extraClass}`}
    >
      {label}
    </button>
  );

  return (
    <div className="w-full border border-slate-300 rounded-md overflow-hidden bg-white shadow-2xs focus-within:border-[#253C7D] transition-colors">
      {/* Toolbar */}
      <div className="bg-slate-100/90 border-b border-slate-200 px-2 py-1 flex items-center gap-1 flex-wrap">
        {/* Basic formatting */}
        {toolbarButton(<span className="font-serif font-bold text-sm">B</span>, "Bold", () => exec("bold"))}
        {toolbarButton(<span className="font-serif italic text-sm">I</span>, "Italic", () => exec("italic"))}
        {toolbarButton(<span className="font-serif underline text-sm">U</span>, "Underline", () => exec("underline"))}
        {toolbarButton(<span className="font-serif line-through text-sm">S</span>, "Strikethrough", () => exec("strikeThrough"))}

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* Lists */}
        {toolbarButton(<i className="ri-list-unordered text-sm" />, "Bullet List", () => exec("insertUnorderedList"))}
        {toolbarButton(<i className="ri-list-ordered text-sm" />, "Numbered List", () => exec("insertOrderedList"))}

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* Undo / Redo */}
        {toolbarButton(<i className="ri-arrow-go-back-line text-sm" />, "Undo", () => exec("undo"))}
        {toolbarButton(<i className="ri-arrow-go-forward-line text-sm" />, "Redo", () => exec("redo"))}

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* Alignments */}
        {toolbarButton(<i className="ri-align-left text-sm" />, "Align Left", () => exec("justifyLeft"))}
        {toolbarButton(<i className="ri-align-center text-sm" />, "Align Center", () => exec("justifyCenter"))}
        {toolbarButton(<i className="ri-align-right text-sm" />, "Align Right", () => exec("justifyRight"))}
        {toolbarButton(<i className="ri-align-justify text-sm" />, "Justify", () => exec("justifyFull"))}

        <div className="h-4 w-px bg-slate-300 mx-1" />

        {/* Indent / Outdent */}
        {toolbarButton(<i className="ri-indent-decrease text-sm" />, "Outdent", () => exec("outdent"))}
        {toolbarButton(<i className="ri-indent-increase text-sm" />, "Indent", () => exec("indent"))}
      </div>

      {/* Editable Area */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        style={{ minHeight }}
        data-placeholder={placeholder}
        className="p-3 text-xs text-slate-800 leading-relaxed focus:outline-none overflow-y-auto max-h-[360px] empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none"
      />
    </div>
  );
});

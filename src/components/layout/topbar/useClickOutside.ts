import { useEffect, useRef } from "react";

/**
 * Calls `handler` when a mousedown event fires outside all provided refs.
 * Replaces the two duplicate addEventListener patterns in the old TopBar.tsx.
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null);
 *   useClickOutside([ref], () => setOpen(false));
 */
export function useClickOutside(
  refs: React.RefObject<HTMLElement | null>[],
  handler: () => void
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const listener = (e: MouseEvent) => {
      const clickedOutsideAll = refs.every(
        (ref) => !ref.current || !ref.current.contains(e.target as Node)
      );
      if (clickedOutsideAll) handlerRef.current();
    };
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
    // refs array identity is stable (created at component mount), so this is safe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

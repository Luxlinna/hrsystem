/**
 * AssistiveTouch Draggable Controller for Floating Live Chat Widget
 * Enables free dragging, touch support, edge-snapping, and viewport boundary protection.
 */

const STORAGE_KEY = "chat_widget_assistive_pos";
const MARGIN = 12;
const BOTTOM_NAV_HEIGHT = 76; // Mobile bottom navigation buffer

interface Position {
  x: number;
  y: number;
}

export function initAssistiveTouchChat(): () => void {
  let isDragging = false;
  let hasMoved = false;
  let startX = 0;
  let startY = 0;
  let initialX = 0;
  let initialY = 0;
  let targetEl: HTMLElement | null = null;
  let attached = false;

  // Load saved position
  const getSavedPosition = (): Position | null => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // Ignore storage errors
    }
    return null;
  };

  const savePosition = (pos: Position) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pos));
    } catch {
      // Ignore storage errors
    }
  };

  const getSafeBounds = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const width = rect.width || 56;
    const height = rect.height || 56;
    const isMobile = window.innerWidth < 1024;
    const bottomBuffer = isMobile ? BOTTOM_NAV_HEIGHT : 20;

    return {
      minX: MARGIN,
      maxX: Math.max(MARGIN, window.innerWidth - width - MARGIN),
      minY: 60, // Safe distance from top bar / notch
      maxY: Math.max(80, window.innerHeight - height - bottomBuffer),
      width,
      height,
    };
  };

  const applyPosition = (el: HTMLElement, x: number, y: number, animate = false) => {
    const bounds = getSafeBounds(el);
    const clampedX = Math.min(Math.max(x, bounds.minX), bounds.maxX);
    const clampedY = Math.min(Math.max(y, bounds.minY), bounds.maxY);

    el.style.position = "fixed";
    el.style.bottom = "auto";
    el.style.right = "auto";
    el.style.left = `${clampedX}px`;
    el.style.top = `${clampedY}px`;
    el.style.zIndex = "99999";
    el.style.touchAction = "none";
    el.style.cursor = isDragging ? "grabbing" : "grab";
    el.style.transition = animate
      ? "left 0.35s cubic-bezier(0.25, 1, 0.5, 1), top 0.35s cubic-bezier(0.25, 1, 0.5, 1)"
      : "none";

    return { x: clampedX, y: clampedY };
  };

  const snapToEdge = (el: HTMLElement, currentX: number, currentY: number) => {
    const bounds = getSafeBounds(el);
    const midX = window.innerWidth / 2;
    // Snap to nearest left or right edge like iOS AssistiveTouch
    const targetX = currentX + bounds.width / 2 < midX ? bounds.minX : bounds.maxX;
    const finalPos = applyPosition(el, targetX, currentY, true);
    savePosition(finalPos);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!targetEl) return;
    // Only drag primary pointer (touch or left mouse)
    if (e.button !== 0 && e.pointerType === "mouse") return;

    // Check if clicking inside an expanded chat dialog or close button
    const isInsideDialog = (e.target as HTMLElement)?.closest(
      '#_ocw_panel, #_ocw_hdr, #_ocw_body, #_ocw_main, iframe, [role="dialog"], [class*="modal"], [class*="window"], [class*="chat-box"]'
    );
    if (isInsideDialog) return;

    const rect = targetEl.getBoundingClientRect();
    isDragging = true;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    initialX = rect.left;
    initialY = rect.top;

    targetEl.style.transition = "none";
    targetEl.style.cursor = "grab";

    let captureAcquired = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isDragging || !targetEl) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (!hasMoved && Math.hypot(dx, dy) > 6) {
        hasMoved = true;
        targetEl.style.cursor = "grabbing";
        if (!captureAcquired) {
          try {
            targetEl.setPointerCapture(moveEvent.pointerId);
            captureAcquired = true;
          } catch {
            // Fallback
          }
        }
      }

      if (hasMoved) {
        moveEvent.preventDefault();
        applyPosition(targetEl, initialX + dx, initialY + dy, false);
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      if (!targetEl) return;
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);

      if (captureAcquired) {
        try {
          targetEl.releasePointerCapture(upEvent.pointerId);
        } catch {
          // Fallback
        }
      }

      if (hasMoved) {
        // Suppress the click only if the user actually dragged the bubble
        const suppressClick = (clickEvent: MouseEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
        };
        targetEl.addEventListener("click", suppressClick, { capture: true, once: true });
        setTimeout(() => targetEl?.removeEventListener("click", suppressClick, { capture: true }), 200);

        const currentRect = targetEl.getBoundingClientRect();
        snapToEdge(targetEl, currentRect.left, currentRect.top);
      } else {
        // Direct tap: ensure click triggers the widget button
        const btn = (upEvent.target as HTMLElement)?.closest('#_ocw_btn, #_ocw_close, #_ocw_tab_ai, #_ocw_tab_lv, #_ocw_hdr_lang, button, a') as HTMLElement | null;
        if (btn && typeof btn.click === "function") {
          // Let native event bubble normally
        }
      }

      isDragging = false;
      targetEl.style.cursor = "grab";
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const attachToElement = (el: HTMLElement) => {
    if (attached && targetEl === el) return;
    targetEl = el;
    attached = true;

    // Restore saved position or position nicely above mobile bottom navigation
    const saved = getSavedPosition();
    if (saved) {
      applyPosition(targetEl, saved.x, saved.y, false);
    } else {
      const bounds = getSafeBounds(targetEl);
      applyPosition(targetEl, bounds.maxX, bounds.maxY - 10, false);
    }

    targetEl.addEventListener("pointerdown", onPointerDown);

    // Handle window resize/orientation change
    window.addEventListener("resize", handleResize);
  };

  const handleResize = () => {
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    snapToEdge(targetEl, rect.left, rect.top);
  };

  // Find widget element in DOM
  const findWidgetElement = (): HTMLElement | null => {
    // Look for common widget container identifiers or floating elements
    const selectors = [
      "#chat-widget-button",
      "#chat-widget-container",
      "#chat-button",
      '[class*="chat-widget-button"]',
      '[class*="chat-widget-launcher"]',
      '[class*="chat_widget"]',
      '[id*="chat-widget"]',
      'div[style*="position: fixed"][style*="z-index"]',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el instanceof HTMLElement && !el.closest("#root")) {
        // Verify it looks like the launcher button
        const rect = el.getBoundingClientRect();
        if (rect.width > 30 && rect.width < 120 && rect.height > 30 && rect.height < 120) {
          return el;
        }
      }
    }

    // Generic fallback: check all fixed elements in body not inside #root
    const fixedEls = Array.from(document.body.children).filter(
      (c): c is HTMLElement =>
        c instanceof HTMLElement &&
        c.id !== "root" &&
        window.getComputedStyle(c).position === "fixed"
    );

    for (const el of fixedEls) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 30 && rect.width < 120 && rect.height > 30 && rect.height < 120) {
        return el;
      }
    }

    return null;
  };

  // Observe DOM for widget injection
  const observer = new MutationObserver(() => {
    const el = findWidgetElement();
    if (el) {
      attachToElement(el);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Initial check and periodic poll during first 10 seconds of script load
  const initialEl = findWidgetElement();
  if (initialEl) attachToElement(initialEl);

  const intervalId = setInterval(() => {
    const el = findWidgetElement();
    if (el) {
      attachToElement(el);
      clearInterval(intervalId);
    }
  }, 500);

  setTimeout(() => clearInterval(intervalId), 15000);

  // Return cleanup function
  return () => {
    observer.disconnect();
    clearInterval(intervalId);
    window.removeEventListener("resize", handleResize);
    if (targetEl) {
      targetEl.removeEventListener("pointerdown", onPointerDown);
    }
  };
}

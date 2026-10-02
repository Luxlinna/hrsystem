/**
 * Android Messenger-style Floating Draggable Chat Head Controller
 * Supports smooth touch/mouse drag, edge-snapping, and viewport boundary protection.
 */

const STORAGE_KEY = "chat_head_position";
const MARGIN = 12;
const BOTTOM_NAV_BUFFER = 78;

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
    const bottomBuffer = isMobile ? BOTTOM_NAV_BUFFER : 20;

    return {
      minX: MARGIN,
      maxX: Math.max(MARGIN, window.innerWidth - width - MARGIN),
      minY: 60,
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
    el.style.zIndex = "45";
    el.style.touchAction = "none";
    el.style.userSelect = "none";
    el.style.transition = animate
      ? "left 0.35s cubic-bezier(0.22, 1, 0.36, 1), top 0.35s cubic-bezier(0.22, 1, 0.36, 1), transform 0.2s ease"
      : "none";

    return { x: clampedX, y: clampedY };
  };

  const snapToEdge = (el: HTMLElement, currentX: number, currentY: number) => {
    const bounds = getSafeBounds(el);
    const midX = window.innerWidth / 2;
    // Snap to nearest left or right edge like Android Messenger Chat Heads
    const targetX = currentX + bounds.width / 2 < midX ? bounds.minX : bounds.maxX;
    const finalPos = applyPosition(el, targetX, currentY, true);
    el.style.transform = "scale(1)";
    savePosition(finalPos);
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!targetEl) return;
    if (e.button !== 0 && e.pointerType === "mouse") return;

    // Do not drag if user is interacting with an expanded chat dialog or text input
    const isDialog = (e.target as HTMLElement)?.closest(
      '#_ocw_panel, #_ocw_body, #_ocw_main, iframe, [role="dialog"], input, textarea'
    );
    if (isDialog) return;

    const rect = targetEl.getBoundingClientRect();
    isDragging = true;
    hasMoved = false;
    startX = e.clientX;
    startY = e.clientY;
    initialX = rect.left;
    initialY = rect.top;

    targetEl.style.transition = "none";
    let captureAcquired = false;

    const onPointerMove = (moveEvent: PointerEvent) => {
      if (!isDragging || !targetEl) return;
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;

      if (!hasMoved && Math.hypot(dx, dy) > 5) {
        hasMoved = true;
        targetEl.style.transform = "scale(1.08)";
        if (!captureAcquired) {
          try {
            targetEl.setPointerCapture(moveEvent.pointerId);
            captureAcquired = true;
          } catch {
            // Ignore capture error
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
          // Ignore
        }
      }

      if (hasMoved) {
        const suppressClick = (clickEvent: MouseEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
        };
        targetEl.addEventListener("click", suppressClick, { capture: true, once: true });
        setTimeout(() => targetEl?.removeEventListener("click", suppressClick, { capture: true }), 250);

        const currentRect = targetEl.getBoundingClientRect();
        snapToEdge(targetEl, currentRect.left, currentRect.top);
      } else {
        targetEl.style.transform = "scale(1)";
      }

      isDragging = false;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const attachToElement = (el: HTMLElement) => {
    if (attached && targetEl === el) return;
    targetEl = el;
    attached = true;

    const saved = getSavedPosition();
    if (saved) {
      applyPosition(targetEl, saved.x, saved.y, false);
    } else {
      const bounds = getSafeBounds(targetEl);
      applyPosition(targetEl, bounds.maxX, bounds.maxY - 10, false);
    }

    targetEl.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", handleResize);
  };

  const handleResize = () => {
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    snapToEdge(targetEl, rect.left, rect.top);
  };

  const findWidgetElement = (): HTMLElement | null => {
    const selectors = [
      "#_ocw_btn",
      "#_ocw_container",
      "#chat-widget-button",
      '[class*="chat-widget-button"]',
      '[class*="chat-widget-launcher"]',
      'div[style*="position: fixed"][style*="z-index"]',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el instanceof HTMLElement && !el.closest("#root")) {
        const rect = el.getBoundingClientRect();
        if (rect.width > 28 && rect.width < 140 && rect.height > 28 && rect.height < 140) {
          return el;
        }
      }
    }
    return null;
  };

  const observer = new MutationObserver(() => {
    const el = findWidgetElement();
    if (el) attachToElement(el);
  });

  observer.observe(document.body, { childList: true, subtree: true });

  const initialEl = findWidgetElement();
  if (initialEl) attachToElement(initialEl);

  const pollInterval = setInterval(() => {
    const el = findWidgetElement();
    if (el) {
      attachToElement(el);
      clearInterval(pollInterval);
    }
  }, 400);

  setTimeout(() => clearInterval(pollInterval), 12000);

  return () => {
    observer.disconnect();
    clearInterval(pollInterval);
    window.removeEventListener("resize", handleResize);
    if (targetEl) targetEl.removeEventListener("pointerdown", onPointerDown);
  };
}

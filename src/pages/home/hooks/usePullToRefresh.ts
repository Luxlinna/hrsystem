import { useState, useCallback } from "react";

const PULL_THRESHOLD = 64;

export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [pullStartY, setPullStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setPullStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling) return;
      const currentY = e.touches[0].clientY;
      const diff = currentY - pullStartY;
      if (diff > 0 && window.scrollY === 0) {
        setPullDistance(Math.min(diff * 0.4, PULL_THRESHOLD * 1.5));
      } else {
        setPullDistance(0);
      }
    },
    [isPulling, pullStartY]
  );

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);
    if (pullDistance >= PULL_THRESHOLD) {
      setPullDistance(PULL_THRESHOLD);
      await onRefresh();
    }
    setPullDistance(0);
  }, [isPulling, pullDistance, onRefresh]);

  return {
    pullDistance,
    isPulling,
    PULL_THRESHOLD,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}

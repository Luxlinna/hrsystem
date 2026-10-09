import { useState, useEffect, useCallback } from "react";

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  const toggleVisible = useCallback(() => {
    const scrolled =
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;
    setVisible(scrolled > 200);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", toggleVisible, { passive: true });
    toggleVisible();
    return () => window.removeEventListener("scroll", toggleVisible);
  }, [toggleVisible]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    document.documentElement.scrollTo({
      top: 0,
      behavior: "smooth",
    });
    document.body.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className={`fixed z-40 p-2.5 rounded-full border border-slate-300 dark:border-slate-600 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm shadow-md hover:shadow-lg hover:border-slate-400 dark:hover:border-slate-500 text-slate-500 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-all duration-300 transform cursor-pointer flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 right-5 bottom-20 lg:bottom-7 lg:right-7 group ${
        visible
          ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
          : "opacity-0 translate-y-4 scale-90 pointer-events-none"
      }`}
      title="Back to top"
    >
      <i className="ri-arrow-up-line text-lg sm:text-xl transition-transform group-hover:-translate-y-0.5" />
    </button>
  );
}

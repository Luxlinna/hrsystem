/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Kantumruy Pro"', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      keyframes: {
        coverSlideRight: {
          "0%": { transform: "translate3d(100%, 0, 0)", opacity: "0.9", boxShadow: "-25px 0 45px -5px rgba(0, 0, 0, 0.2)" },
          "100%": { transform: "translate3d(0, 0, 0)", opacity: "1", boxShadow: "none" },
        },
        coverSlideLeft: {
          "0%": { transform: "translate3d(-100%, 0, 0)", opacity: "0.9", boxShadow: "25px 0 45px -5px rgba(0, 0, 0, 0.2)" },
          "100%": { transform: "translate3d(0, 0, 0)", opacity: "1", boxShadow: "none" },
        },
      },
      animation: {
        "cover-slide-right": "coverSlideRight 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "cover-slide-left": "coverSlideLeft 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
    },
  },
  plugins: [],
};

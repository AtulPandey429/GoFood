/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#ef4444",
          dark: "#dc2626",
          light: "#fef2f2",
        },
        surface: {
          DEFAULT: "#0f172a",
          card: "#1e293b",
          muted: "#334155",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

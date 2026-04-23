/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#F59E0B", light: "#FCD34D", dark: "#D97706" },
        /** Marka koyu — spec #111827 */
        brand: { dark: "#111827" },
        primaryDark: "#111827",
        surface: { DEFAULT: "#111827", soft: "#1E293B" },
        app: { bg: "#F8FAFC", card: "#FFFFFF" },
      },
      fontFamily: { sans: ["Inter", "system-ui", "sans-serif"] },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        float: "0 10px 40px -10px rgba(245, 158, 11, 0.25)",
      },
    },
  },
  plugins: [],
};

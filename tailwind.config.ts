import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#040d1a",
          900: "#071428",
          800: "#0d2144",
          700: "#143060",
          600: "#1a3f7c",
        },
        gold: {
          300: "#eab667",
          400: "#e0a955",
          500: "#c49a2a",
          600: "#a07d1a",
        },
        // Secondary accent — used for success/info/positive states (complements gold)
        teal: {
          400: "#3db4a6",
          500: "#2e9e90",
          600: "#1f7d72",
        },
        surface: {
          900: "#0a0f1e",
          800: "#111827",
          700: "#1a2235",
          600: "#242d42",
          500: "#2e3a52",
        },
      },
      boxShadow: {
        // 3-level elevation scale for depth
        "elev-1": "0 1px 2px rgba(0,0,0,0.25)",
        "elev-2": "0 4px 12px rgba(0,0,0,0.35)",
        "elev-3": "0 12px 32px rgba(0,0,0,0.45)",
        "gold-glow": "0 8px 24px -8px rgba(224,169,85,0.5)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Playfair Display", "Georgia", "serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

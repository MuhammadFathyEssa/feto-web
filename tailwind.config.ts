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
          400: "#d4a843",
          500: "#c49a2a",
          600: "#a07d1a",
        },
        surface: {
          900: "#0a0f1e",
          800: "#111827",
          700: "#1a2235",
          600: "#242d42",
          500: "#2e3a52",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;

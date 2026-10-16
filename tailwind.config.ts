import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        crimson: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48", // primary accent
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
          950: "#4c0519",
        },
        ivory: {
          50: "#ffffff",
          100: "#fcfbf7",
          200: "#f8f6f0",
          300: "#f3efe6",
        },
        charcoal: {
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      boxShadow: {
        "liquid-glass": "0 8px 32px 0 rgba(225, 29, 72, 0.08), 0 2px 10px 0 rgba(0, 0, 0, 0.04)",
        "liquid-hover": "0 14px 40px 0 rgba(225, 29, 72, 0.14), 0 4px 16px 0 rgba(0, 0, 0, 0.06)",
        "glass-inner": "inset 0 1px 1px 0 rgba(255, 255, 255, 0.8), inset 0 -1px 2px 0 rgba(225, 29, 72, 0.05)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;

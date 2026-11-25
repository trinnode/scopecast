import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#0B1016",
        surface: "#121A24",
        "surface-2": "#1A2531",
        elevated: "#22303F",
        line: "#2C3A48",
        "line-strong": "#3C4C5C",
        "line-input": "#6B7F94",
        ink: "#F2F6FA",
        "ink-2": "#B8C4D0",
        "ink-3": "#8A99A8",
        inverse: "#0B1016",
        cyan: "#22D3EE",
        amber: "#F5B544",
        vermilion: "#F86B4F",
        fog: "#94A3B8",
        "tint-active": "#0E3B45",
        "tint-pending": "#3A2C12",
        "tint-revoked": "#3A1A16",
        "tint-unknown": "#24313D",
      },
      fontFamily: {
        display: ["Space Grotesk", "Arial Narrow", "sans-serif"],
        sans: ["Satoshi", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "Courier New", "monospace"],
      },
      borderRadius: {
        xs: "2px",
        sm: "6px",
        md: "10px",
        lg: "14px",
        pill: "999px",
      },
      transitionTimingFunction: {
        enter: "cubic-bezier(0.16, 1, 0.3, 1)",
        exit: "cubic-bezier(0.7, 0, 0.84, 0)",
      },
      keyframes: {
        "signal-travel": {
          "0%": { transform: "translateX(0)", opacity: "0" },
          "12%": { opacity: "1" },
          "88%": { opacity: "1" },
          "100%": { transform: "translateX(var(--signal-distance, 0px))", opacity: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "signal-travel": "signal-travel 1.6s cubic-bezier(0.16, 1, 0.3, 1) 1",
        "fade-up": "fade-up 320ms cubic-bezier(0.16, 1, 0.3, 1) 1",
      },
    },
  },
  plugins: [],
};

export default config;

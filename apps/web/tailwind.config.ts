import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#050506",
        surface: "#0B0B0D",
        "surface-2": "#131316",
        elevated: "#1C1C21",
        line: "#26262C",
        "line-strong": "#46464F",
        "line-input": "#7B7B86",
        ink: "#FFFFFF",
        "ink-2": "#D3D3D8",
        "ink-3": "#8C8C96",
        inverse: "#050506",
        flare: "#00F0FF",
        iris: "#8B5CF6",
        blush: "#FF3D81",
        amber: "#FFC53D",
        vermilion: "#FF3D81",
        fog: "#A1A1AA",
        cyan: "#00F0FF",
        "tint-active": "#06272B",
        "tint-pending": "#2B2108",
        "tint-revoked": "#2C0D17",
        "tint-unknown": "#1B1B20",
      },
      fontFamily: {
        display: ["Unbounded", "Arial Black", "sans-serif"],
        sans: ["Archivo", "Arial", "sans-serif"],
        mono: ["Space Mono", "Courier New", "monospace"],
      },
      borderRadius: {
        xs: "2px",
        sm: "4px",
        md: "8px",
        lg: "12px",
        pill: "999px",
      },
      transitionTimingFunction: {
        enter: "cubic-bezier(0.16, 1, 0.3, 1)",
        exit: "cubic-bezier(0.7, 0, 0.84, 0)",
      },
      keyframes: {
        "beam-drift": {
          "0%": { transform: "translate3d(-30%,0,0) rotate(12deg)", opacity: "0" },
          "20%": { opacity: "0.55" },
          "80%": { opacity: "0.55" },
          "100%": { transform: "translate3d(140%,0,0) rotate(12deg)", opacity: "0" },
        },
        "border-spin": {
          to: { transform: "rotate(360deg)" },
        },
        "text-shimmer": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        "signal-travel": {
          "0%": { transform: "translateX(0)", opacity: "0" },
          "15%": { opacity: "1" },
          "85%": { opacity: "1" },
          "100%": { transform: "translateX(var(--signal-distance, 0px))", opacity: "0" },
        },
        "reveal-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "beam-drift": "beam-drift 9s linear infinite",
        "border-spin": "border-spin 3.5s linear infinite",
        "text-shimmer": "text-shimmer 6s linear infinite",
        "signal-travel": "signal-travel 1.6s cubic-bezier(0.16, 1, 0.3, 1) 1",
        "reveal-up": "reveal-up 420ms cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};

export default config;

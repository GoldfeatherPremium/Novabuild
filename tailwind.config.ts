import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: "#05060F",
        surface: "#0A0D1C",
        ink: "#ECEFF7",
        muted: "#8E97B5",
        violet: {
          DEFAULT: "#7568FF",
          bright: "#8E7CFF",
          deep: "#4A3FD6",
          soft: "#C9C2FF",
        },
        electric: {
          DEFAULT: "#41A6FF",
          bright: "#63BCFF",
        },
        lavender: "#C9C2FF",
      },
      fontFamily: {
        sans: ["var(--font-sora)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-instrument)", "Georgia", "serif"],
      },
      boxShadow: {
        glow: "0 0 90px -24px rgba(117, 104, 255, 0.55)",
        "glow-blue": "0 0 90px -24px rgba(65, 166, 255, 0.45)",
        card: "0 24px 60px -24px rgba(0, 0, 0, 0.6)",
      },
      maxWidth: {
        shell: "1200px",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        marquee: "marquee 42s linear infinite",
        shimmer: "shimmer 3.5s linear infinite",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

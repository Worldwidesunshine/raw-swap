import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: "#0a0a0f",
          50: "#0d0d14",
          100: "#111118",
          200: "#16161f",
          300: "#1c1c28",
          400: "#252533",
        },
        neon: {
          green: "#39ff14",
          pink: "#ff2eea",
          purple: "#b026ff",
          cyan: "#00f0ff",
          orange: "#ff6a00",
          yellow: "#ffe600",
        },
        sol: {
          green: "#14f195",
          purple: "#9945ff",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        display: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      animation: {
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "gradient-x": "gradient-x 6s ease infinite",
        "float": "float 3s ease-in-out infinite",
        "scanline": "scanline 4s linear infinite",
        "flicker": "flicker 0.15s infinite",
        "slide-up": "slide-up 0.4s cubic-bezier(0.16,1,0.3,1)",
        "slide-down": "slide-down 0.3s cubic-bezier(0.16,1,0.3,1)",
        "shake": "shake 0.5s cubic-bezier(.36,.07,.19,.97)",
        "pulse-fast": "pulse 1s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "scanline": {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        "flicker": {
          "0%": { opacity: "1" },
          "50%": { opacity: "0.8" },
          "100%": { opacity: "1" },
        },
        "slide-up": {
          "0%": { transform: "translateY(16px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "slide-down": {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "shake": {
          "10%, 90%": { transform: "translateX(-1px)" },
          "20%, 80%": { transform: "translateX(2px)" },
          "30%, 50%, 70%": { transform: "translateX(-3px)" },
          "40%, 60%": { transform: "translateX(3px)" },
        },
      },
      boxShadow: {
        "neon-green": "0 0 20px rgba(57,255,20,0.3), 0 0 60px rgba(57,255,20,0.1)",
        "neon-pink": "0 0 20px rgba(255,46,234,0.3), 0 0 60px rgba(255,46,234,0.1)",
        "neon-purple": "0 0 20px rgba(176,38,255,0.3), 0 0 60px rgba(176,38,255,0.1)",
        "neon-cyan": "0 0 20px rgba(0,240,255,0.3), 0 0 60px rgba(0,240,255,0.1)",
        "glass": "0 8px 32px rgba(0,0,0,0.4)",
        "inner-glow": "inset 0 1px 1px rgba(255,255,255,0.05)",
      },
      backgroundImage: {
        "gradient-degen": "linear-gradient(135deg, #39ff14 0%, #00f0ff 50%, #b026ff 100%)",
        "gradient-fire": "linear-gradient(135deg, #ff6a00 0%, #ff2eea 100%)",
        "gradient-sol": "linear-gradient(135deg, #9945ff 0%, #14f195 100%)",
      },
    },
  },
  plugins: [],
};

export default config;

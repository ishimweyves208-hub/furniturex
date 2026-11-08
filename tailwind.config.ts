import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: { DEFAULT: "1rem", sm: "1.5rem", lg: "2rem" },
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: "#347DF2",
          hover: "#2465D6",
          light: "#EFF5FF",
          soft: "#F5F8FF",
        },
        text: {
          primary: "#111111",
          secondary: "#666666",
          muted: "#999999",
        },
        background: {
          DEFAULT: "#FFFFFF",
          alternate: "#F7F7F8",
          hover: "#F0F0F1",
        },
        bg: {
          DEFAULT: "#FFFFFF",
          alternate: "#F7F7F8",
          hover: "#F0F0F1",
        },
        border: {
          DEFAULT: "#E5E7EB",
          light: "#F0F0F1",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        // Compatibility aliases from the previous editorial theme.
        // They now resolve to the white/blue design system so every screen
        // shares the same palette while older class names are phased out.
        charcoal: "#111111",
        ink: "#111111",
        ivory: "#FFFFFF",
        cream: "#FFFFFF",
        sand: "#F7F7F8",
        line: "#E5E7EB",
        gold: "#347DF2",
        muted: "#666666",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      fontSize: {
        display: ["clamp(2rem, 4vw, 3.5rem)", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        heading: ["clamp(1.5rem, 3vw, 2.25rem)", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      },
      letterSpacing: {
        tight: "-0.02em",
        normal: "0",
        wide: "0.02em",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 4px 8px -4px rgba(0,0,0,0.06)",
        elevated: "0 4px 12px rgba(0,0,0,0.08)",
      },
      borderRadius: {
        DEFAULT: "8px",
        lg: "12px",
        xl: "16px",
        full: "9999px",
      },
      spacing: {
        "18": "4.5rem",
        "22": "5.5rem",
      },
    },
  },
  plugins: [],
};

export default config;

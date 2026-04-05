import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
        wave: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(12deg)" },
          "75%": { transform: "rotate(-12deg)" },
        },
        /* Rusti personality animations */
        "rusti-breathe": {
          "0%, 100%": { transform: "scale(1) translateY(0)" },
          "50%": { transform: "scale(1.03) translateY(-2px)" },
        },
        "rusti-float": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "25%": { transform: "translateY(-6px) rotate(1deg)" },
          "75%": { transform: "translateY(-3px) rotate(-1deg)" },
        },
        "rusti-wiggle": {
          "0%, 100%": { transform: "rotate(0deg)" },
          "15%": { transform: "rotate(-6deg)" },
          "30%": { transform: "rotate(5deg)" },
          "45%": { transform: "rotate(-4deg)" },
          "60%": { transform: "rotate(2deg)" },
          "75%": { transform: "rotate(-1deg)" },
        },
        "rusti-peek": {
          "0%": { transform: "translateY(20px) scale(0.8)", opacity: "0" },
          "50%": { transform: "translateY(-4px) scale(1.05)", opacity: "1" },
          "70%": { transform: "translateY(2px) scale(0.98)" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        "rusti-nod": {
          "0%, 100%": { transform: "rotate(0deg) translateY(0)" },
          "20%": { transform: "rotate(0deg) translateY(3px)" },
          "40%": { transform: "rotate(0deg) translateY(-1px)" },
          "60%": { transform: "rotate(0deg) translateY(2px)" },
        },
        "rusti-celebrate": {
          "0%": { transform: "scale(1) rotate(0deg)" },
          "10%": { transform: "scale(1.15) rotate(-3deg)" },
          "20%": { transform: "scale(1.15) rotate(3deg)" },
          "30%": { transform: "scale(1.1) rotate(-2deg)" },
          "40%": { transform: "scale(1.1) rotate(2deg)" },
          "50%": { transform: "scale(1.05) rotate(0deg)" },
          "60%": { transform: "scale(1.08) translateY(-8px)" },
          "80%": { transform: "scale(1.02) translateY(-2px)" },
          "100%": { transform: "scale(1) translateY(0) rotate(0deg)" },
        },
        "rusti-sad-droop": {
          "0%, 100%": { transform: "rotate(0deg) translateY(0)" },
          "30%": { transform: "rotate(-3deg) translateY(4px)" },
          "70%": { transform: "rotate(-2deg) translateY(3px)" },
        },
        "rusti-curious-tilt": {
          "0%, 100%": { transform: "rotate(0deg) scale(1)" },
          "30%": { transform: "rotate(-8deg) scale(1.05)" },
          "60%": { transform: "rotate(-6deg) scale(1.03)" },
        },
        "rusti-heartbeat": {
          "0%, 100%": { transform: "scale(1)" },
          "14%": { transform: "scale(1.12)" },
          "28%": { transform: "scale(1)" },
          "42%": { transform: "scale(1.08)" },
          "56%": { transform: "scale(1)" },
        },
        "rusti-entrance": {
          "0%": { transform: "scale(0) rotate(-180deg)", opacity: "0" },
          "60%": { transform: "scale(1.1) rotate(10deg)", opacity: "1" },
          "80%": { transform: "scale(0.95) rotate(-5deg)" },
          "100%": { transform: "scale(1) rotate(0deg)" },
        },
        "rusti-blink-glow": {
          "0%, 90%, 100%": { filter: "drop-shadow(0 0 0px transparent)" },
          "95%": { filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.4))" },
        },
        "rusti-wobble-settle": {
          "0%": { transform: "translateX(-30px) rotate(-5deg)", opacity: "0" },
          "40%": { transform: "translateX(8px) rotate(3deg)", opacity: "1" },
          "60%": { transform: "translateX(-4px) rotate(-1deg)" },
          "80%": { transform: "translateX(2px) rotate(0.5deg)" },
          "100%": { transform: "translateX(0) rotate(0deg)" },
        },
        "rusti-squish": {
          "0%, 100%": { transform: "scaleX(1) scaleY(1)" },
          "30%": { transform: "scaleX(1.1) scaleY(0.9)" },
          "60%": { transform: "scaleX(0.95) scaleY(1.05)" },
        },
        "rusti-spin-pop": {
          "0%": { transform: "scale(0) rotate(0deg)", opacity: "0" },
          "50%": { transform: "scale(1.2) rotate(180deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(360deg)", opacity: "1" },
        },
        "float-up": {
          "0%": { transform: "translateY(0) scale(1)", opacity: "1" },
          "100%": { transform: "translateY(-60px) scale(1.3)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "rusti-breathe": "rusti-breathe 3s ease-in-out infinite",
        "rusti-float": "rusti-float 4s ease-in-out infinite",
        "rusti-wiggle": "rusti-wiggle 0.8s ease-in-out",
        "rusti-peek": "rusti-peek 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "rusti-nod": "rusti-nod 0.6s ease-in-out 2",
        "rusti-celebrate": "rusti-celebrate 1s ease-in-out",
        "rusti-sad-droop": "rusti-sad-droop 2.5s ease-in-out infinite",
        "rusti-curious-tilt": "rusti-curious-tilt 2s ease-in-out infinite",
        "rusti-heartbeat": "rusti-heartbeat 1.5s ease-in-out infinite",
        "rusti-entrance": "rusti-entrance 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "rusti-blink-glow": "rusti-blink-glow 4s ease-in-out infinite",
        "rusti-wobble-settle": "rusti-wobble-settle 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "rusti-squish": "rusti-squish 0.5s ease-in-out",
        "rusti-spin-pop": "rusti-spin-pop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
        "float-up": "float-up 1.2s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

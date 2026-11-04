/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-mono)"],
        sans: ["var(--font-sans)"],
        heading: ["var(--font-sans)"],
      },
      colors: {
        "bg-ground": "var(--bg-ground)",
        "bg-card": "var(--bg-card)",
        "border-hairline": "var(--border-hairline)",
        "border-control": "var(--border-control)",
        "surface-active": "var(--surface-active)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-tertiary": "var(--text-tertiary)",
        gain: "var(--gain)",
        open: "var(--open)",
        neutral: "var(--neutral)",
        "chart-neutral": "var(--chart-neutral)",
        "chart-grid": "var(--chart-grid)",
        ...Object.fromEntries(
          Object.entries({
            emerald: "--gain-rgb",
            green: "--gain-rgb",
            teal: "--gain-rgb",
            cyan: "--gain-rgb",
            blue: "--gain-rgb",
            red: "--loss-rgb",
            rose: "--loss-rgb",
            amber: "--open-rgb",
            yellow: "--open-rgb",
          }).map(([name, rgb]) => [
            name,
            Object.fromEntries(
              [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [
                shade,
                shade === 950 ? "rgb(0 0 0 / <alpha-value>)" : `rgb(var(${rgb}) / <alpha-value>)`,
              ]),
            ),
          ]),
        ),
        white: "rgb(244 244 245 / <alpha-value>)",
        black: "rgb(0 0 0 / <alpha-value>)",
        zinc: Object.fromEntries(
          [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [
            shade,
            `hsl(var(--neutral-${shade}) / <alpha-value>)`,
          ]),
        ),
        gray: Object.fromEntries(
          [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => [
            shade,
            `hsl(var(--neutral-${shade}) / <alpha-value>)`,
          ]),
        ),
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        surface: {
          page: "var(--surface-page)",
          card: "var(--surface-card)",
          raised: "var(--surface-raised)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          secondary: "var(--ink-secondary)",
          muted: "var(--ink-muted)",
        },
        hairline: "var(--hairline)",
        "hairline-strong": "var(--hairline-strong)",
        profit: "var(--profit)",
        loss: "var(--loss)",

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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
};

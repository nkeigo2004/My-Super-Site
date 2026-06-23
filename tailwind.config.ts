import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        line: "var(--line)",
        fg: "var(--fg)",
        muted: "var(--muted)",
        accent: "var(--accent)",
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "IBM Plex Sans JP",
          "system-ui",
          "sans-serif",
        ],
        display: [
          "var(--font-display)",
          "IBM Plex Sans JP",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "var(--font-mono)",
          "IBM Plex Sans JP",
          "ui-monospace",
          "monospace",
        ],
      },
      maxWidth: {
        content: "62rem",
      },
    },
  },
  plugins: [],
};
export default config;

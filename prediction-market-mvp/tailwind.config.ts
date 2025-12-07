// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 12px 30px rgba(0, 0, 0, 0.25)",
        subtle: "0 4px 12px rgba(0, 0, 0, 0.18)",
      },
      borderRadius: {
        card: "12px",
        modal: "16px",
        input: "8px",
        button: "9999px",
      },
    },
  },
  plugins: [],
};

export default config;
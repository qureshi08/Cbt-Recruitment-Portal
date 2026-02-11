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
        primary: {
          DEFAULT: "#009245",
          foreground: "#ffffff",
          50: "#e6f9ed",
          100: "#ccefd7",
          200: "#99dfb0",
          300: "#66cf88",
          400: "#33bf61",
          500: "#009245",
          600: "#007a3a",
          700: "#00612e",
          800: "#004922",
          900: "#003117",
        },
        surface: "#FFFFFF",
        border: "#E0E0E0",
        text: {
          DEFAULT: "#333333",
          light: "#666666",
        }
      },
      borderRadius: {
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
};
export default config;

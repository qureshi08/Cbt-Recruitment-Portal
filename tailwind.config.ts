import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Playfair Display"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary: {
          DEFAULT: "#00994D", // Botanical Green
          foreground: "#ffffff",
          soft: "rgba(0, 153, 77, 0.05)",
          muted: "rgba(0, 153, 77, 0.12)",
        },
        heading: "#0C1A10", // Ink
        surface: "#F7F8F7", // Bone
        border: "#E2E8E4", // Muted Grey
        text: {
          DEFAULT: "#374151", // Graphite
          muted: "#6B7280",  // Steel
        }
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '16': '64px',
        '20': '80px',
        '24': '96px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '12px',
      },
    },
  },
  plugins: [],
};
export default config;

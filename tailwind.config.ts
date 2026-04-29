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
        heading: ['var(--font-heading)', 'serif'],
        sans: ['var(--font-body)', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: "#00994D", // CBT Botanical Green
          hover: "#007a3d",
          light: "rgba(0, 153, 77, 0.05)",
        },
        heading: "#0C1A10", // Ink
        body: "#374151", // Graphite
        muted: "#6B7280", // Steel
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F7F8F7", // Bone
        },
        border: "#E2E8E4", // Muted Grey
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '8px',
        'lg': '10px',
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'premium': '0 8px 24px rgba(0, 153, 77, 0.12)',
        'elevated': '0 20px 60px -12px rgba(12, 26, 16, 0.12)',
        'soft': '0 4px 12px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
};
export default config;

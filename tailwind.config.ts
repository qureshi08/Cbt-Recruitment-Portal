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
          DEFAULT: "#009245",
          hover: "#007a3a",
          light: "rgba(0, 146, 69, 0.08)",
        },
        heading: "#0f172a",
        body: "#475569",
        muted: "#94a3b8",
        surface: {
          DEFAULT: "#ffffff",
          alt: "#f8fafc",
        },
        border: "#e2e8f0",
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'premium': '0 10px 40px -10px rgba(0, 146, 69, 0.12)',
        'elevated': '0 20px 60px -12px rgba(15, 23, 42, 0.12)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;

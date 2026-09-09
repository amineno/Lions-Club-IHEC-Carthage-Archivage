import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A2E52",
          light: "#0D3D6E",
          mid: "#1A4F85",
        },
        gold: {
          DEFAULT: "#C9A227",
          light: "#E8C547",
          pale: "#FDF4D8",
          muted: "#F5E6A3",
        },
        offwhite: "#F8F7F4",
        surface2: "#F4F2EE",
        danger: "#C0392B",
        success: "#1A7A4A",
        "text-muted": "#6B7A8D",
        "text-light": "#9DAAB8",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "serif"],
        sans: ['"DM Sans"', "sans-serif"],
      },
      boxShadow: {
        "sm-lions": "0 1px 4px rgba(10,46,82,0.08)",
        "md-lions": "0 4px 16px rgba(10,46,82,0.10)",
        "lg-lions": "0 8px 32px rgba(10,46,82,0.13)",
      },
      borderRadius: {
        lions: "10px",
        "lions-lg": "16px",
      },
    },
  },
  plugins: [],
};

export default config;

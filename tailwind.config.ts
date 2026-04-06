import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#ea7c4b",
          "orange-dark": "#d75418",
          "orange-light": "#f1a685",
          "orange-pale": "#f7cfbd",
        },
        teal: {
          DEFAULT: "#0f88ad",
          dark: "#094e64",
          medium: "#0c6a87",
          light: "#209ed8",
          bright: "#41c6ee",
          pale: "#9ce1f6",
        },
        navy: "#173f64",
        surface: {
          DEFAULT: "#fcfaf8",
          card: "#ffffff",
          muted: "#f2f2f7",
          divider: "#d1d1d6",
        },
        text: {
          primary: "#1c1c1e",
          secondary: "#333333",
          muted: "#666666",
          light: "#8e8e93",
        },
        error: "#ff383c",
        success: "#34c759",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        display: ['"Inter"', "system-ui", "sans-serif"],
        label: ['"Inter"', "system-ui", "sans-serif"],
      },
      borderRadius: {
        pill: "100px",
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(0,0,0,0.08)",
        card: "0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        elevated:
          "0 0.6px 1.8px -1px rgba(0,0,0,0.03), 0 2.3px 6.9px -2px rgba(0,0,0,0.03), 0 10px 30px -3px rgba(0,0,0,0.02)",
      },
    },
  },
  plugins: [],
};
export default config;

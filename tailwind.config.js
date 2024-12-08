import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    "./src/**/**/*.{html,js,svelte,ts}",
  ],
  safelist: ["dark"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "#28641C",
        foreground: "#2F260C",
        sidebarBackground: "#FAF3E0",
        sidebarText: "#2C3E50",
        popupBackground: "#DFD9C6",
        accentText: "#fff",
        foregroundDark: "#272316",
        accent: "#D08C60",
        border: "#5A6E63",
        textHappy: "#0F9866",
        textDanger: "#E63946",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: [...fontFamily.sans],
      },
    },
  },
};

export default config;

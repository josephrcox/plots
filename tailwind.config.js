/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ["class"],
  content: [
    "./src/**/*.{html,js,svelte,ts}",
    "./src/**/**/*.{html,js,svelte,ts}",
  ],
  safelist: ["dark"],
  theme: {
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      sm: "0.8rem",
      base: "0.625rem",
      xl: "1.25rem",
      "2xl": "1.563rem",
      "3xl": "1.953rem",
      "4xl": "2.441rem",
      "5xl": "3.052rem",
    },
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        background: "rgba(40, 100, 28, 1)", // Darker green, slightly muted
        foreground: "rgba(54, 43, 15, 1)", // Rich, deep brown for text areas
        sidebarBackground: "rgba(250, 243, 224, 1)", // Light cream (unchanged)
        sidebarText: "rgba(47, 65, 80, 1)", // Slate blue-gray for sidebar text
        popupBackground: "rgba(45, 51, 39, 0.98)", // Deep forest green with slight transparency
        accentText: "rgba(255, 255, 255, 1)", // Bright white (unchanged)
        foregroundDark: "rgba(39, 35, 22, 1)", // Very deep brown
        accent: "rgba(168, 115, 75, 1)", // Deeper, more muted terracotta that complements the greens and browns
        darkerAccent: "rgba(130, 80, 50, 1)", // Darker version of accent
        border: "rgba(106, 126, 115, 1)", // Lighter green-gray for borders
        textHappy: "rgba(20, 152, 102, 1)", // Brighter green for success
        textDanger: "rgba(230, 90, 100, 1)", // Slightly softened red
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg) scale(1)" },
          "50%": { transform: "rotate(3deg) scale(1.2)" },
        },
      },
      animation: {
        wiggle: "wiggle 1s ease-in-out infinite",
      },
    },
  },
};

export default config;

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
        colors: {
            "primary": "#C5A37F",
            "accent": "#D4A574",
            "background": "#FCFAFA",
            "secondary": "#F3EDE2",
            "tertiary": "#97ABC1",
            "quaternary": "#E8DED2",
            "carbon": "#2D2D2D",
            "ink": "#2D2D2D",
            "muted": "#757575",
            "success": "#A8B69F",
            "warning": "#D9B99B",
            "line": "#E9E1D8",
            "sidebar": "#1A1A1A",
            "sidebar-hover": "#2A2A2A",
        },
        fontFamily: {
            "sans": ["Inter", "sans-serif"],
            "serif": ["Newsreader", "serif"],
            "headline": ["Newsreader", "serif"],
            "body": ["Inter", "sans-serif"],
        },
        borderRadius: {"DEFAULT": "0.25rem", "lg": "0.25rem", "xl": "0.5rem", "full": "9999px"},
        boxShadow: {
          subtle: "0 8px 24px rgba(45, 45, 45, 0.04)",
        },
        keyframes: {
          "slide-up": {
            from: { transform: "translateY(100%)", opacity: "0" },
            to: { transform: "translateY(0)", opacity: "1" }
          }
        },
        animation: {
          "slide-up": "slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards"
        }
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
    require('@tailwindcss/forms'),
  ],
}


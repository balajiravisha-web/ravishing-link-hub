/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        lemon: {
          50: "#FFFDEA",
          100: "#FFF7B3",
          200: "#FFF089",
          300: "#FFE55E"
        },
        pastel: {
          pink: "#ffd6e7",
          yellow: "#fff3b0",
          mint: "#d9fff5"
        }
      },
      boxShadow: { soft: "0 8px 30px rgba(0,0,0,0.06)" }
    },
  },
  plugins: [],
};
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        parchment: "#FAF5ED",
        charcoal: "#1A1A1A",
        gold: {
          400: "#D4AF37",
          500: "#C5A017",
          600: "#997A00"
        },
        burgundy: "#800020",
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'serif'],
        sans: ['"Inter"', '"DM Sans"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'ruby-red': '#9b111e',
        'rose-gold': '#b76e79',
      },
    },
  },
  plugins: [],
}

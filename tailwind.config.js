/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#4F7CFF',
        dark: {
          100: '#1A1D29',
          200: '#141824',
          300: '#0F1219',
        },
      },
    },
  },
  plugins: [],
}

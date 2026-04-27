/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nature: {
          50: '#f1f8f3',
          100: '#ddeee2',
          200: '#bddbc8',
          300: '#91c1a6',
          400: '#64a280',
          500: '#438663',
          600: '#326a4d',
          700: '#2a553f',
          800: '#234434',
          900: '#1e382b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

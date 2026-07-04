/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#714B67',
          dark: '#5a3c52',
          light: '#8f6a84',
        },
      },
    },
  },
  plugins: [],
};

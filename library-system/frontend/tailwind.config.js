/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          900: '#0a1322',
          800: '#0f1b2d',
          700: '#162540',
          600: '#1d3054',
        },
        forest: {
          500: '#2f6b4f',
          400: '#3d8765',
          300: '#9cc5a1',
        },
        cream: {
          100: '#f7f1e3',
          200: '#e8dcc0',
          300: '#d9d2c2',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 6px 20px -6px rgba(0,0,0,0.5)',
        lift: '0 16px 32px -10px rgba(0,0,0,0.6)',
      },
    },
  },
  plugins: [],
};

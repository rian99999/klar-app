/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        klar: {
          50: '#F2F7FB',
          100: '#EDF6FC',
          200: '#D0E6F2',
          300: '#BFE0F2',
          400: '#8EC3DE',
          500: '#5BA8CD',
          600: '#1A7FC4',
          700: '#0E5FA8',
          800: '#0D4F8B',
          900: '#0D3B6E',
          950: '#082846',
        },
        pearl: {
          50: '#F8F5EF',
          100: '#F5F0E8',
          200: '#E2D4C0',
          300: '#CBB79B',
          400: '#B09878',
          500: '#8A7255',
        },
      },
      fontFamily: {
        sans: ['Jost', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 22px 60px rgb(13 59 110 / .10)',
        lift: '0 18px 42px rgb(91 168 205 / .18)',
      },
      letterSpacing: {
        brand: '0.22em',
      },
    },
  },
  plugins: [],
}
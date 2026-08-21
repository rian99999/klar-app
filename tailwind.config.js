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
        /* Semantic aliases — use these for text, borders and surfaces so the
           whole app stays on one palette instead of mixing slate + klar. */
        ink: {
          DEFAULT: '#0D3B6E',
          strong: '#082846',
          soft: '#436288',
          muted: '#6C87A6',
          faint: '#9DB0C4',
        },
        line: {
          DEFAULT: '#DCE9F4',
          strong: '#C3DCEE',
          soft: '#EAF2F9',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          sunken: '#F4F8FC',
          raised: '#FFFFFF',
        },
        warm: {
          50: '#FDF6EE',
          100: '#F8E9D6',
          500: '#B47B36',
          700: '#8A5A1F',
        },
        cool: {
          50: '#EEF5FD',
          100: '#D8E8F9',
          500: '#3D7FBF',
          700: '#215C96',
        },
      },
      fontFamily: {
        sans: [
          'Jost',
          'Pretendard',
          'Apple SD Gothic Neo',
          'Noto Sans KR',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
        ],
        display: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      borderRadius: {
        /* One radius scale for the whole product. */
        xs: '6px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
        '2xl': '26px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(13 59 110 / .04), 0 8px 24px -12px rgb(13 59 110 / .14)',
        lift: '0 2px 6px rgb(13 59 110 / .06), 0 16px 36px -16px rgb(13 59 110 / .26)',
        pop: '0 24px 60px -24px rgb(13 59 110 / .38)',
        inset: 'inset 0 1px 0 rgb(255 255 255 / .7)',
      },
      letterSpacing: {
        brand: '0.22em',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(.22,.61,.36,1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(14px) scale(.97)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up .32s cubic-bezier(.22,.61,.36,1) both',
        'toast-in': 'toast-in .26s cubic-bezier(.22,.61,.36,1) both',
      },
    },
  },
  plugins: [],
}

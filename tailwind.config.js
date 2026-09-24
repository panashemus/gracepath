/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f5f6f8',
          100: '#e8eaef',
          200: '#cfd4de',
          300: '#aab2c3',
          400: '#7e8499',
          500: '#5d6378',
          600: '#474c5e',
          700: '#3a3f4e',
          800: '#2a2e3a',
          900: '#1a1d26',
          950: '#101218',
        },
        champagne: {
          50: '#fdfaf3',
          100: '#f8f0d9',
          200: '#f0e0b4',
          300: '#e6cd87',
          400: '#d9b65f',
          500: '#c99f3e',
          600: '#b08532',
          700: '#8c6728',
          800: '#6f5123',
          900: '#5a4220',
        },
        sage: {
          50: '#f4f7f4',
          100: '#e4ece5',
          200: '#c9d8cc',
          300: '#a3bda8',
          400: '#7c9d83',
          500: '#5d8067',
          600: '#486651',
          700: '#3a5241',
          800: '#304236',
          900: '#28362d',
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 12px -2px rgba(26, 29, 38, 0.08), 0 1px 3px -1px rgba(26, 29, 38, 0.06)',
        card: '0 4px 24px -6px rgba(26, 29, 38, 0.10), 0 2px 6px -2px rgba(26, 29, 38, 0.05)',
        glow: '0 0 40px -8px rgba(217, 182, 95, 0.35)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.4s ease-out forwards',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B6B',
        secondary: '#7C5CFC',
        tertiary: '#FFD93D',
        success: '#6BCB77',
        background: '#FFF8F0',
        surface: '#F0EAFF',
        dark: '#2D2D3F',
        muted: '#8E8E9A',
      },
      fontFamily: {
        display: ['Fredoka One', 'cursive'],
        body: ['Nunito', 'sans-serif'],
        accent: ['Baloo 2', 'cursive'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(255, 107, 107, 0.15)',
        medium: '0 8px 30px rgba(124, 92, 252, 0.15)',
        card: '0 2px 15px rgba(45, 45, 63, 0.08)',
        glow: '0 0 20px rgba(255, 107, 107, 0.4)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-soft': 'pulse 3s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
      },
    },
  },
  plugins: [],
}

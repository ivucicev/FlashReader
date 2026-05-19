import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0A',
        surface: '#0D0D0D',
        surface2: '#111111',
        border: '#1A1A1A',
        accent: '#3B82F6',
        'accent-dim': '#1D4ED8',
        muted: '#404040',
        subtle: '#2A2A2A',
        text: '#E5E5E5',
        'text-dim': '#737373',
      },
      fontFamily: {
        display: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
        rsvp: ['Georgia', 'Charter', 'serif'],
        ui: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'fade-in': 'fadeIn 0.15s ease-out',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config

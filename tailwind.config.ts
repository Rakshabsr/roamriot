import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Sea blue palette
        sea: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Sage green palette
        sage: {
          50:  '#f2f7f2',
          100: '#e0ece0',
          200: '#c2d9c4',
          300: '#97be9a',
          400: '#6a9e6f',
          500: '#4a8050',
          600: '#3a6640',
          700: '#2f5233',
          800: '#274129',
          900: '#1f3420',
        },
        // Sand/warm accent
        sand: {
          50:  '#fef9f0',
          100: '#fef0d3',
          200: '#fcdfa7',
          300: '#f9c86a',
          400: '#f7ad35',
          500: '#f59414',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'soft':   '0 2px 15px -3px rgba(8,145,178,0.08), 0 4px 6px -4px rgba(8,145,178,0.05)',
        'card':   '0 4px 24px -4px rgba(8,145,178,0.10), 0 2px 8px -2px rgba(8,145,178,0.06)',
        'lift':   '0 12px 40px -8px rgba(8,145,178,0.20), 0 4px 12px -4px rgba(8,145,178,0.10)',
        'glow':   '0 0 30px rgba(6,182,212,0.25)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop': {
          '0%':   { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)',    opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.6' },
        },
        'bounce-dot': {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%':           { transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up':    'fade-up 0.35s ease both',
        'pop':        'pop 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'bounce-dot': 'bounce-dot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config

import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Primary: Warm Ember / Adventure Amber ──────────────────────────
        // Sunset warmth, adventure, golden hour — distinctly travel.
        sea: {
          50:  '#fff8f0',
          100: '#ffe8ca',
          200: '#ffc98a',
          300: '#ffa04e',
          400: '#f07c28',
          500: '#d9601a',   // ember amber primary
          600: '#b54814',
          700: '#8e340d',
          800: '#682508',
          900: '#451806',
        },
        // ── Secondary: Forest / Explorer Green ────────────────────────────
        // Deep nature, growth, off-the-beaten-path adventure.
        sage: {
          50:  '#f0f9f4',
          100: '#d4eddf',
          200: '#a5d4ba',
          300: '#6fb594',
          400: '#3d9470',
          500: '#1e7b55',   // forest green primary
          600: '#176342',
          700: '#104c31',
          800: '#0a3522',
          900: '#062115',
        },
        // ── Sand (accent, unchanged role) ─────────────────────────────────
        sand: {
          50:  '#fef9f0',
          100: '#fef0d3',
          200: '#fcdfa7',
          300: '#f9c86a',
          400: '#f7ad35',
          500: '#f59414',
        },
        // ── Dark mode surface colours (used in dark: classes) ─────────────
        dark: {
          bg:      '#0a0f0e',   // near-black with jade tint
          surface: '#111a18',   // card surface
          raised:  '#172420',   // elevated card
          border:  '#1e2f2b',   // borders
          muted:   '#2a3f3a',   // muted elements
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
        'soft': '0 2px 15px -3px rgba(217,96,26,0.10), 0 4px 6px -4px rgba(217,96,26,0.06)',
        'card': '0 4px 24px -4px rgba(217,96,26,0.14), 0 2px 8px -2px rgba(217,96,26,0.07)',
        'lift': '0 12px 40px -8px rgba(217,96,26,0.24), 0 4px 12px -4px rgba(217,96,26,0.12)',
        'glow': '0 0 30px rgba(217,96,26,0.30)',
        // dark mode shadows
        'soft-dark': '0 2px 15px -3px rgba(0,0,0,0.40), 0 4px 6px -4px rgba(0,0,0,0.30)',
        'card-dark': '0 4px 24px -4px rgba(0,0,0,0.50), 0 2px 8px -2px rgba(0,0,0,0.30)',
        'lift-dark': '0 12px 40px -8px rgba(0,0,0,0.60), 0 4px 12px -4px rgba(0,0,0,0.40)',
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

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
        // ── Primary: Jade / Deep Teal ──────────────────────────────────────
        // Distinctive, premium travel. No other travel app uses this.
        sea: {
          50:  '#e6faf7',
          100: '#c0f2ea',
          200: '#86e6d8',
          300: '#4dd4c0',
          400: '#1ebfaa',
          500: '#00a896',   // jade primary
          600: '#008a7b',
          700: '#006d61',
          800: '#005249',
          900: '#003b34',
        },
        // ── Secondary: Antique Gold ────────────────────────────────────────
        // Warm contrast to jade. Feels luxury, adventure.
        sage: {
          50:  '#fdf8e8',
          100: '#faefc5',
          200: '#f5da87',
          300: '#efc043',
          400: '#e6a825',
          500: '#cc8f0f',   // antique gold primary
          600: '#a37009',
          700: '#7d5308',
          800: '#5c3d09',
          900: '#3f2b08',
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
        'soft': '0 2px 15px -3px rgba(0,168,150,0.08), 0 4px 6px -4px rgba(0,168,150,0.05)',
        'card': '0 4px 24px -4px rgba(0,168,150,0.12), 0 2px 8px -2px rgba(0,168,150,0.06)',
        'lift': '0 12px 40px -8px rgba(0,168,150,0.22), 0 4px 12px -4px rgba(0,168,150,0.10)',
        'glow': '0 0 30px rgba(0,168,150,0.28)',
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

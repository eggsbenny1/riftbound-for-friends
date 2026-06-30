import type { Config } from 'tailwindcss';

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        surface: {
          1: 'hsl(var(--surface-1))',
          2: 'hsl(var(--surface-2))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        domain: {
          fury:  '#ef4444',
          calm:  '#3b82f6',
          mind:  '#a855f7',
          body:  '#22c55e',
          chaos: '#f97316',
          order: '#eab308',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      boxShadow: {
        'card':    '0 1px 3px 0 rgb(0 0 0 / 0.4), 0 4px 12px -2px rgb(0 0 0 / 0.3)',
        'card-hover': '0 4px 16px -2px rgb(0 0 0 / 0.5), 0 8px 24px -4px rgb(0 0 0 / 0.4)',
        'modal':   '0 24px 64px -8px rgb(0 0 0 / 0.7)',
        'primary': '0 4px 20px -2px rgb(99 102 241 / 0.35)',
        'fab':     '0 8px 24px -4px rgb(0 0 0 / 0.5), 0 4px 12px -2px rgb(99 102 241 / 0.3)',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backgroundImage: {
        'legend-fade': 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.55) 55%, rgba(0,0,0,0.92) 100%)',
        'hero-fade': 'linear-gradient(to bottom, transparent 30%, hsl(var(--background)) 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border:      'hsl(var(--border))',
        input:       'hsl(var(--input))',
        ring:        'hsl(var(--ring))',
        background:  'hsl(var(--background))',
        foreground:  'hsl(var(--foreground))',
        primary: {
          DEFAULT:     'hsl(var(--primary))',
          foreground:  'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:     'hsl(var(--secondary))',
          foreground:  'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:     'hsl(var(--destructive))',
          foreground:  'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:     'hsl(var(--muted))',
          foreground:  'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:     'hsl(var(--accent))',
          foreground:  'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT:     'hsl(var(--card))',
          foreground:  'hsl(var(--card-foreground))',
        },
        // Alterli brand tokens
        gold:    '#c8a245',
        'gold-dim': '#6e5520',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        serif:  ['Palatino Linotype', 'Book Antiqua', 'Palatino', 'serif'],
        sans:   ['system-ui', 'sans-serif'],
        mono:   ['Courier New', 'monospace'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in-slow': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
      },
      animation: {
        'fade-in':      'fade-in 0.5s ease forwards',
        'fade-in-slow': 'fade-in-slow 1s ease forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

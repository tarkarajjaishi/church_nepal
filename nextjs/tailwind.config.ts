import type { Config } from 'tailwindcss'

/**
 * A theme colour that still works with an opacity modifier.
 *
 * These colours are CSS variables, and their values are hex in light mode and
 * oklch in dark. Tailwind cannot inject alpha into either, so every
 * `bg-muted/50`, `bg-card/95` and `bg-primary/5` in the codebase — 160 of
 * them — generated no rule at all and rendered fully transparent. The symptom
 * was silent: table rows with no hover, sticky headers you could read the
 * content through, and selected rows that looked unselected.
 *
 * `color-mix` takes any colour format, so this needs no change to globals.css
 * and none to the theme customiser, which writes hex at runtime.
 */
const themed = (name: string) =>
  ({ opacityValue }: { opacityValue?: string }) =>
    opacityValue === undefined || opacityValue === '1'
      ? `var(${name})`
      : `color-mix(in srgb, var(${name}) calc(${opacityValue} * 100%), transparent)`

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: themed('--border'),
        input: themed('--input'),
        ring: themed('--ring'),
        background: themed('--background'),
        foreground: themed('--foreground'),
        primary: {
          DEFAULT: themed('--primary'),
          foreground: themed('--primary-foreground'),
        },
        secondary: {
          DEFAULT: themed('--secondary'),
          foreground: themed('--secondary-foreground'),
        },
        destructive: {
          DEFAULT: themed('--destructive'),
          foreground: themed('--destructive-foreground'),
        },
        muted: {
          DEFAULT: themed('--muted'),
          foreground: themed('--muted-foreground'),
        },
        accent: {
          DEFAULT: themed('--accent'),
          foreground: themed('--accent-foreground'),
        },
        popover: {
          DEFAULT: themed('--popover'),
          foreground: themed('--popover-foreground'),
        },
        card: {
          DEFAULT: themed('--card'),
          foreground: themed('--card-foreground'),
        },
        'church-blue': themed('--church-blue'),
        'sky-blue': themed('--sky-blue'),
        gold: themed('--gold'),
        'gold-text': themed('--gold-text'),
        'gold-soft': themed('--gold-soft'),
        success: themed('--success'),
        section: themed('--section-bg'),
        'section-bg': themed('--section-bg'),
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        heading: ['Poppins', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        nepali: ['Noto Sans Devanagari', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config

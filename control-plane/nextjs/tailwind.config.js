/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      keyframes: {
        marquee: {
          '0%':   { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 30s linear infinite',
      },
      colors: {
        background: 'var(--bg)',
        bg: 'var(--bg)',
        'bg-2': 'var(--bg-2)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        'panel-3': 'var(--panel-3)',
        border: 'var(--border)',
        'border-soft': 'var(--border-soft)',
        text: 'var(--text)',
        'text-strong': 'var(--text-strong)',
        muted: 'var(--muted)',
        'muted-2': 'var(--muted-2)',
        accent: 'var(--accent)',
        'accent-2': 'var(--accent-2)',
        'accent-soft': 'var(--accent-soft)',
        good: 'var(--good)',
        'good-soft': 'var(--good-soft)',
        danger: 'var(--danger)',
        'danger-soft': 'var(--danger-soft)',
        gold: 'var(--gold)',
        'gold-soft': 'var(--gold-soft)',
        success: 'var(--good)',
        warning: 'var(--gold)',
        ring: 'var(--ring)',
        overlay: 'var(--overlay)',

        // The shadcn-style names the shared primitives in app/components/ui
        // are written against. They were never in this palette, so every one
        // of these classes produced NO CSS AT ALL - silently, because an
        // unknown colour name is not an error, it simply generates nothing.
        //
        // What that cost: the default Button's `bg-primary` painted no
        // background and `text-primary-foreground` no colour; `bg-destructive`
        // meant a delete button was not red; and `hover:text-accent-foreground`
        // on the outline variant did nothing, so hovering it swapped in a solid
        // accent background under text that stayed the colour it already was.
        // On the pricing page that made "Get started free" blue-on-blue - a
        // contrast ratio of 1.0, text that disappears under the pointer - and
        // left the NPR chip near-black on accent blue at 3.44.
        //
        // Mapped onto the tokens this project already defines, so they follow
        // the light and dark themes without a second set of values to keep in
        // step. Foregrounds are chosen to contrast with their own surface,
        // which is the entire point of the -foreground suffix.
        foreground: 'var(--text)',
        card: 'var(--panel)',
        'card-foreground': 'var(--text)',
        popover: 'var(--panel)',
        'popover-foreground': 'var(--text)',
        primary: 'var(--accent)',
        'primary-foreground': 'var(--accent-contrast)',
        secondary: 'var(--panel-2)',
        'secondary-foreground': 'var(--text)',
        'muted-foreground': 'var(--muted)',
        'accent-foreground': 'var(--accent-contrast)',
        destructive: 'var(--danger)',
        'destructive-foreground': 'var(--accent-contrast)',
        input: 'var(--border)',
      },
      fontFamily: {
        sans: 'var(--font-sans)',
        mono: 'var(--font-mono)',
      },
      fontSize: {
        xs: ['var(--text-xs)', { lineHeight: 'var(--leading-snug)' }],
        sm: ['var(--text-sm)', { lineHeight: 'var(--leading-normal)' }],
        base: ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
        lg: ['var(--text-lg)', { lineHeight: 'var(--leading-snug)' }],
        xl: ['var(--text-xl)', { lineHeight: 'var(--leading-snug)' }],
        '2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-tight)' }],
        '3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }],
        '4xl': ['var(--text-4xl)', { lineHeight: 'var(--leading-tight)' }],
        '5xl': ['var(--text-5xl)', { lineHeight: 'var(--leading-tight)' }],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-2xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        DEFAULT: 'var(--shadow)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        glow: 'var(--shadow-glow)',
      },
      spacing: {
        1: 'var(--space-1)',
        2: 'var(--space-2)',
        3: 'var(--space-3)',
        4: 'var(--space-4)',
        5: 'var(--space-5)',
        6: 'var(--space-6)',
        8: 'var(--space-8)',
        10: 'var(--space-10)',
        12: 'var(--space-12)',
        16: 'var(--space-16)',
        20: 'var(--space-20)',
      },
      maxWidth: {
        max: 'var(--max)',
      },
      transitionDuration: {
        fast: 'var(--dur-fast)',
        DEFAULT: 'var(--dur)',
        slow: 'var(--dur-slow)',
      },
      transitionTimingFunction: {
        ease: 'var(--ease)',
      },
      ringColor: {
        DEFAULT: 'var(--ring)',
      },
      ringOffsetColor: {
        DEFAULT: 'var(--ring-offset)',
      },
    },
  },
  plugins: [],
}

import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  css: {
    postcss: {
      plugins: [
        (await import('tailwindcss')).default,
        (await import('autoprefixer')).default,
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client', 'motion/react'],
  },
  optimizeDeps: {
    // noDiscovery: true prevents Vite from auto-discovering new deps at
    // runtime. Without this, a concurrent page load can trigger a temporary
    // re-optimisation pass (with a different browser hash), so some pages load
    // React from the new hash while others load from the old one, causing
    // "Invalid hook call" crashes. With this flag, ONLY the explicit include
    // list below is pre-bundled; everything else is served as-is. The list
    // must be complete — use 'entries' to help esbuild scan source files too.
    noDiscovery: true,
    entries: ['./src/**/*.{tsx,ts}'],
    include: [
      // ── React core — a single shared instance is critical ──────────────
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom/client',
      // Motion (admin-only usage, but pre-bundle to prevent late-discovery)
      'motion/react',
      // ── Data / state ───────────────────────────────────────────────────
      '@tanstack/react-query',
      '@tanstack/react-table',
      'axios',
      'zod',
      // ── Routing / theming ──────────────────────────────────────────────
      'wouter',
      'next-themes',
      // ── Forms ──────────────────────────────────────────────────────────
      'react-hook-form',
      '@hookform/resolvers/zod',
      // ── General UI ─────────────────────────────────────────────────────
      'sonner',
      'embla-carousel-react',
      'lucide-react',
      'recharts',
      'cmdk',
      'clsx',
      'tailwind-merge',
      'class-variance-authority',
      'input-otp',
      'vaul',
      'nepali-date-converter',
      // ── ALL Radix UI primitives (shadcn/ui peer deps) ──────────────────
      // These all wrap React and must share the same React instance.
      // If ANY of these is missing, the first page that uses it triggers a
      // Vite dep re-optimisation, changing the React chunk hash mid-session
      // and causing "Invalid hook call" crashes on subsequently-loaded pages.
      '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-label',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-progress',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-select',
      '@radix-ui/react-separator',
      '@radix-ui/react-slider',
      '@radix-ui/react-slot',
      '@radix-ui/react-switch',
      '@radix-ui/react-tabs',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
      '@radix-ui/react-tooltip',
      // ── Rich text (Tiptap) ─────────────────────────────────────────────
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/extension-link',
      '@tiptap/extension-image',
      '@tiptap/extension-text-align',
      '@tiptap/extension-underline',
      // ── DnD ───────────────────────────────────────────────────────────
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
      // ── Other auto-discovered deps (add explicitly to prevent runtime ──
      // re-optimization which changes chunk hashes mid-session) ───────────
      '@radix-ui/react-toast',
      'react-day-picker',
      'react-resizable-panels',
      'web-vitals',
    ],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
    // Pre-transform the most-visited pages so the Replit proxy never
    // times out (504) waiting for Vite's on-demand compilation.
    // No warmup: warmup was triggering a secondary Vite optimization pass
    // (even with noDiscovery:true) by processing source files before the
    // initial dep cache was fully settled. This caused a temporary browser-hash
    // change mid-session that crashed concurrently-loading pages.
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});

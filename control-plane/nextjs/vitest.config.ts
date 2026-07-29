import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['__tests__/**/*.test.{ts,tsx}'],
  },
  resolve: {
    // Vite matches aliases in order and '@' is a prefix of '@/lib', so listing
    // '@' first made "@/lib/utils" resolve to ./app/lib/utils (nonexistent) and
    // every test file failed to collect. Most specific first, catch-all last —
    // this mirrors the "paths" order intent in tsconfig.json.
    alias: [
      { find: /^@\/lib\//, replacement: path.resolve(__dirname, './lib') + '/' },
      { find: /^@\/components\//, replacement: path.resolve(__dirname, './app/components') + '/' },
      { find: /^@\//, replacement: path.resolve(__dirname, './app') + '/' },
    ],
  },
})

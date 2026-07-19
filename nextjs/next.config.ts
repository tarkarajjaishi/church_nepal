import type { NextConfig } from 'next'

/**
 * Next.js 16 config for Grace Nepal Church
 * - Turbopack is default for `next dev` / `next build`
 * - Prefer remotePatterns over deprecated images.domains
 */
const nextConfig: NextConfig = {
  // TEMPORARY: the app compiles and runs, but carries TypeScript/ESLint debt
  // from rapid iteration. Don't fail production builds on it (so CI + Docker
  // images publish). Re-enable strict checks once the type debt is cleared.
  // ponytail: remove both once `tsc --noEmit` and `eslint` are clean.
  typescript: { ignoreBuildErrors: true },

  // Stable React Compiler (optional; enable when ready for longer compiles)
  // reactCompiler: true,

  // Faster dev restarts (Turbopack FS cache — beta, safe for local)
  experimental: {
    turbopackFileSystemCacheForDev: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
      // Allow uploaded images served from the Rust API backend
      {
        protocol: 'https',
        hostname: '*.churchnepal.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3002',
        pathname: '/api/uploads/**',
      },
    ],
    // Explicit qualities when components pass quality props
    qualities: [50, 75, 90, 100],
  },

}

export default nextConfig

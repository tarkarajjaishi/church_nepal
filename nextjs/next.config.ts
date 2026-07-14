import type { NextConfig } from 'next'

/**
 * Next.js 16 config for Grace Nepal Church
 * - Turbopack is default for `next dev` / `next build`
 * - Prefer remotePatterns over deprecated images.domains
 */
const nextConfig: NextConfig = {
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
    ],
    // Explicit qualities when components pass quality props
    qualities: [50, 75, 90, 100],
  },

}

export default nextConfig

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for Docker
  output: "standalone",
  reactStrictMode: true,

  /**
   * Paths from the SEO plan that are not their own pages.
   *
   * Two kinds, both permanent so Google consolidates rather than indexing a
   * second copy:
   *
   * 1. Aliases. /cities/kathmandu, /districts/..., /provinces/... and
   *    /church/... were in the page plan; the directory settled on /churches/*
   *    instead. The alias resolves so a link written against the plan is never
   *    a 404, and the canonical stays single.
   * 2. Cannibals. /christian-resources, /articles and /news would each have
   *    competed with an existing stronger page for the same query — /resources
   *    is already titled "Christian Resources for Churches in Nepal" and /blog
   *    is already the article index. Two pages chasing one keyword split its
   *    ranking; a 301 pools it.
   */
  async redirects() {
    return [
      { source: '/cities/:city', destination: '/churches/:city', permanent: true },
      { source: '/districts/:district', destination: '/churches/district/:district', permanent: true },
      { source: '/provinces/:province', destination: '/churches/province/:province', permanent: true },
      { source: '/church/:slug', destination: '/churches/church/:slug', permanent: true },
      { source: '/cities', destination: '/churches', permanent: true },
      { source: '/districts', destination: '/churches', permanent: true },
      { source: '/provinces', destination: '/churches', permanent: true },
      { source: '/christian-resources', destination: '/resources', permanent: true },
      { source: '/articles', destination: '/blog', permanent: true },
      { source: '/news', destination: '/blog', permanent: true },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=(), payment=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Content-Security-Policy-Report-Only',
            value: "default-src 'self'; object-src 'none'; script-src 'self'; style-src 'self'; font-src 'self' data:; img-src 'self' data: https:; connect-src 'self' wss:; base-uri 'self'; frame-ancestors 'self'",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

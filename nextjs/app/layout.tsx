import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ErrorReporter } from '@/components/ErrorReporter'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { SiteThemeApplier } from '@/components/theme/SiteThemeApplier'
import { StructuredData } from '@/components/site/StructuredData'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://churchnepal.com'

export const metadata: Metadata = {
  // Required for OG/canonical URLs to resolve absolutely; without it Next warns
  // and emits relative social URLs that most crawlers reject.
  metadataBase: new URL(SITE_URL),
  title: {
    // Per-route layouts set only their own title; this composes the brand.
    default: 'Grace Nepal Church — Faith, Hope & Love',
    template: '%s — Grace Nepal Church',
  },
  description:
    'Grace Nepal Church - A community of faith, hope and love in Nepal. Join us for worship, fellowship and service.',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'Grace Nepal Church',
    locale: 'en_US',
    alternateLocale: ['ne_NP'],
    title: 'Grace Nepal Church — Faith, Hope & Love',
    description:
      'A Christ-centred community in Nepal — worshipping Jesus, growing in faith, and serving our neighbours.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grace Nepal Church — Faith, Hope & Love',
    description:
      'A Christ-centred community in Nepal — worshipping Jesus, growing in faith, and serving our neighbours.',
  },
  // app/manifest.ts is served at /manifest.webmanifest — linking to '/manifest'
  // 404s, which silently disabled the PWA install prompt and the CMS-driven app
  // name/theme colour.
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Grace Nepal Church',
  },
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-192.png',
  },
}

// themeColor belongs on the viewport export in Next 14+; leaving it on metadata
// is ignored and warns on every single page during build.
export const viewport: Viewport = {
  themeColor: '#0b3c5d',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <StructuredData />
      </head>
      <body>
        {/* Light by default, and not following the OS. `system` meant a visitor
            whose phone was in dark mode got the dark palette without ever
            choosing it. The toggle still works and still persists. */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
          <ErrorReporter />
          <SiteThemeApplier />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

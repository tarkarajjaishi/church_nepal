import type { Metadata } from 'next'
import './globals.css'
import { ErrorReporter } from '@/components/ErrorReporter'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { SiteThemeApplier } from '@/components/theme/SiteThemeApplier'

export const metadata: Metadata = {
  title: 'Grace Nepal Church — Faith, Hope & Love',
  description: 'Grace Nepal Church - A community of faith, hope and love in Nepal. Join us for worship, fellowship and service.',
  // app/manifest.ts is served at /manifest.webmanifest — linking to '/manifest'
  // 404s, which silently disabled the PWA install prompt and the CMS-driven app
  // name/theme colour.
  manifest: '/manifest.webmanifest',
  themeColor: '#0b3c5d',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ErrorReporter />
          <SiteThemeApplier />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

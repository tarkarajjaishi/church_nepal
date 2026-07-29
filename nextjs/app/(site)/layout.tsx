'use client'

import { useEffect } from 'react'
import { Providers } from '@/lib/providers'
import { LanguageProvider } from '@/lib/i18n'
import { Navbar } from '@/components/site/Navbar'
import { Footer } from '@/components/site/Footer'
import { AnnouncementBar } from '@/components/site/AnnouncementBar'
import { FloatingButtons } from '@/components/site/FloatingButtons'
import { ThemeCustomizer } from '@/components/theme/ThemeCustomizer'
import { Toaster } from '@/components/ui/sonner'
import { PushOptIn } from './PushOptIn'

function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        if (reg.waiting) {
          reg.waiting.postMessage({ type: 'SKIP_WAITING' })
        }
      })
      .catch((err) => console.error('Service worker registration failed:', err))
  }, [])
  return null
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <LanguageProvider>
        <ServiceWorkerRegistrar />
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <AnnouncementBar />
        <Navbar />
        <main id="main-content">{children}</main>
        <Footer />
        <FloatingButtons />
        <ThemeCustomizer />
        <PushOptIn />
        <Toaster position="top-center" richColors />
      </LanguageProvider>
    </Providers>
  )
}

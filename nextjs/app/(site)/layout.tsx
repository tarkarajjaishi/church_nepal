'use client'

import { Providers } from '@/lib/providers'
import { LanguageProvider } from '@/lib/language'
import { Navbar } from '@/components/site/Navbar'
import { Footer } from '@/components/site/Footer'
import { AnnouncementBar } from '@/components/site/AnnouncementBar'
import { FloatingButtons } from '@/components/site/FloatingButtons'
import { ThemeCustomizer } from '@/components/theme/ThemeCustomizer'
import { Toaster } from '@/components/ui/sonner'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <LanguageProvider>
        <AnnouncementBar />
        <Navbar />
        <main>{children}</main>
        <Footer />
        <FloatingButtons />
        <ThemeCustomizer />
        <Toaster position="top-center" richColors />
      </LanguageProvider>
    </Providers>
  )
}

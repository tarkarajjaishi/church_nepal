import { Navbar } from './components/navbar';
import { Footer } from './components/footer';
import SiteSearch from './components/site-search';
import AnnouncementBar from './components/announcement-bar';
import SocialProof from './components/social-proof';
import { ThemeProvider } from './components/theme-provider';
import { QueryProvider } from './components/query-provider';
import RouteProgress from './components/route-progress';
import CookiePreferences from './components/cookie-preferences';
import SupportWidget from './components/support-widget';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export default function PublicLayout({ children }: Props) {
  return (
    <QueryProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <RouteProgress />
        <div className="min-h-screen flex flex-col bg-[var(--bg)]">
          <AnnouncementBar />
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          <SiteSearch />
          <SocialProof />
          <CookiePreferences />
          <SupportWidget />
        </div>
      </ThemeProvider>
    </QueryProvider>
  );
}

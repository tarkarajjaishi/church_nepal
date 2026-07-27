import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Providers } from '@/lib/providers';
import { AuthProvider, useAuth } from '@/lib/auth';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Layout } from '@/components/admin/Layout';
import AdminNav from '@/components/admin/AdminNav';
import { ThemeCustomizer } from '@/components/theme/ThemeCustomizer';
import { Toaster } from '@/components/ui/sonner';

function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      setLocation('/admin/login', { replace: true });
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const isLogin = location === '/admin/login';

  return (
    <Providers>
      <ErrorBoundary>
        <AuthProvider>
          {isLogin ? (
            <div className="min-h-screen bg-background">
              <AdminNav />
              <main className="container mx-auto py-8 px-4">
                {children}
              </main>
            </div>
          ) : (
            <AuthGuard>
              <Layout>{children}</Layout>
            </AuthGuard>
          )}
          <Toaster />
          {!isLogin && <ThemeCustomizer />}
        </AuthProvider>
      </ErrorBoundary>
    </Providers>
  );
}

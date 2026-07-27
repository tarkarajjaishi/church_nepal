import { ReactNode } from 'react';
import { Providers } from '@/lib/providers';

export default function BibleLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      {children}
    </Providers>
  );
}

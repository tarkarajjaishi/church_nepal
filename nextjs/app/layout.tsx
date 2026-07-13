import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Grace Nepal Church — Faith, Hope & Love',
  description: 'Grace Nepal Church - A community of faith, hope and love in Nepal. Join us for worship, fellowship and service.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

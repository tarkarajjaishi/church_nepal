import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Grace Nepal Church — Faith, Hope & Love',
  description: 'Grace Nepal Church - A community of faith, hope and love in Nepal. Join us for worship, fellowship and service.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com" dangerouslySetInnerHTML={{ __html: `
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  'church-blue': '#0b3c5d',
                  'sky-blue': '#1f6f8b',
                  'gold': '#d4a017',
                  'gold-soft': '#f3e2b3',
                  'success': '#2e8b57',
                  'section': '#f7f9fc',
                },
                fontFamily: {
                  heading: ['Poppins', 'Noto Sans Devanagari', 'sans-serif'],
                  body: ['Inter', 'Noto Sans Devanagari', 'sans-serif'],
                },
              }
            }
          }
        `}} />
      </head>
      <body>{children}</body>
    </html>
  )
}

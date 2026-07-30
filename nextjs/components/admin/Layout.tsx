'use client'

import { Sidebar } from './Sidebar'

/**
 * The admin shell: navigation on the left, the page on the right.
 *
 * `min-w-0` on the content column is load-bearing — without it a wide table
 * stretches the flex item and pushes the sidebar off the screen instead of
 * scrolling inside its own card.
 */
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="lg:flex lg:h-screen bg-background">
      <Sidebar />
      <main className="flex-1 min-w-0 lg:overflow-y-auto bg-background">
        <div className="p-4 sm:p-6 max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { useIsAdmin } from '@/lib/useIsAdmin'

/**
 * Wraps a single data item (a card, image, row, member, …). For a logged-in
 * admin it highlights the item on hover and overlays a small pencil that jumps
 * straight to that exact item's editor in the admin panel. For everyone else it
 * renders the item untouched.
 *
 * The pencil is a sibling of (not nested inside) the item's own link, so there
 * are no nested <a> tags — clicking the corner edits in admin, clicking the rest
 * of the card follows the normal public link.
 */
export function ItemEdit({
  href,
  children,
  className = '',
  radius = 'rounded-2xl',
}: {
  href: string
  children: React.ReactNode
  className?: string
  radius?: string
}) {
  const { isAdmin } = useIsAdmin()
  if (!isAdmin) return <>{children}</>

  return (
    <div className={`relative group/edit ${className}`}>
      {children}
      <span
        className={`pointer-events-none absolute inset-0 z-20 ${radius} ring-2 ring-inset ring-transparent transition-colors duration-200 group-hover/edit:ring-church-blue/60`}
      />
      <Link
        href={href}
        onClick={e => e.stopPropagation()}
        title="Edit this item in admin"
        className="absolute right-2 top-2 z-30 flex items-center gap-1 rounded-full bg-church-blue px-2.5 py-1 text-[11px] font-medium text-white shadow-lg opacity-0 transition-opacity duration-200 group-hover/edit:opacity-100 hover:bg-church-blue/90"
      >
        <Pencil className="size-3" /> Edit
      </Link>
    </div>
  )
}

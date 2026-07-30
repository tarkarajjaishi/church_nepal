'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Church, ChevronDown, PanelLeftClose, PanelLeftOpen, Search, LogOut,
  ExternalLink, X,
} from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useAccess } from '@/lib/roles/useAccess'
import { NAV, visibleNav, type NavGroup } from './nav'
import { CommandPalette, useCommandKey } from './CommandPalette'

/**
 * The admin sidebar.
 *
 * Three things it has to do that the old flat list did not: let you find a page
 * without scrolling past fifty, get out of the way on a laptop, and exist at all
 * on a phone.
 */

const RAIL_KEY = 'admin_nav_rail'
const OPEN_KEY = 'admin_nav_open_groups'

/** The rarely-used groups start folded away. */
const DEFAULT_CLOSED = NAV.filter((g) => !g.defaultOpen).map((g) => g.id)

/** Deepest match wins, so /admin/helpdesk/tickets highlights Help Desk and not
 *  also the dashboard it happens to be nested under. */
function activeHref(pathname: string, groups: NavGroup[]): string {
  let best = ''
  for (const g of groups) {
    for (const i of g.items) {
      if ((pathname === i.to || pathname.startsWith(`${i.to}/`)) && i.to.length > best.length) {
        best = i.to
      }
    }
  }
  return best
}

export function Sidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const { can, isLoading, unmanaged } = useAccess()

  const [rail, setRail] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [palette, setPalette] = useState(false)
  const [closed, setClosed] = useState<string[]>(DEFAULT_CLOSED)

  // Read the saved state after mount, not during render — the server has no
  // localStorage, and reading it inline makes the first paint disagree with
  // the markup React sent.
  useEffect(() => {
    setRail(localStorage.getItem(RAIL_KEY) === '1')
    const saved = localStorage.getItem(OPEN_KEY)
    if (saved) {
      try { setClosed(JSON.parse(saved)) } catch { /* corrupt: keep the defaults */ }
    }
  }, [])

  // Until the answer arrives, show only what needs no permission. Hiding a
  // link for a moment is a flicker; showing one is a promise the next click
  // breaks with a 403.
  const groups = visibleNav(can, isLoading)
  const active = activeHref(pathname, groups)

  // Whatever group you are in is open, whether or not you collapsed it — the
  // alternative is a highlighted item you cannot see.
  const activeGroup = groups.find((g) => g.items.some((i) => i.to === active))?.id

  const toggleGroup = (id: string) =>
    setClosed((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      localStorage.setItem(OPEN_KEY, JSON.stringify(next))
      return next
    })

  const toggleRail = () =>
    setRail((v) => { localStorage.setItem(RAIL_KEY, v ? '0' : '1'); return !v })

  const openPalette = useCallback(() => setPalette(true), [])
  useCommandKey(openPalette)

  // Following a link on a phone should put the menu away.
  useEffect(() => { setDrawer(false) }, [pathname])

  // With sixty links the page you are on is often below the fold, which reads
  // as "nothing is selected". Only on the first paint — scrolling the menu out
  // from under someone who is browsing it would be worse.
  const navRef = useRef<HTMLElement>(null)
  const scrolled = useRef(false)
  useEffect(() => {
    if (scrolled.current) return
    const el = navRef.current?.querySelector('[aria-current="page"]')
    if (!el) return
    scrolled.current = true
    el.scrollIntoView({ block: 'center' })
  })

  const isOpen = (g: NavGroup) => g.id === activeGroup || !closed.includes(g.id)

  return (
    <>
      {/* Phone: a bar with the menu button, because a 16rem fixed column on a
          375px screen leaves no room for the page. */}
      <div className="lg:hidden sticky top-0 z-40 flex items-center gap-2 h-14 px-3 bg-church-blue text-white">
        <button
          type="button"
          onClick={() => setDrawer(true)}
          className="inline-flex items-center justify-center size-10 rounded-xl hover:bg-white/10"
          aria-label="Open the menu"
        >
          <PanelLeftOpen className="size-5" aria-hidden />
        </button>
        <Church className="size-5 text-gold" aria-hidden />
        <span className="font-semibold text-sm truncate">Grace Nepal Church</span>
        <button
          type="button"
          onClick={openPalette}
          className="ml-auto inline-flex items-center justify-center size-10 rounded-xl hover:bg-white/10"
          aria-label="Search the admin"
        >
          <Search className="size-5" aria-hidden />
        </button>
      </div>

      {drawer && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setDrawer(false)}
          aria-hidden
        />
      )}

      <aside
        className={[
          'bg-church-blue text-white flex flex-col shrink-0 duration-200',
          'transition-[transform,width] motion-reduce:transition-none',
          'fixed inset-y-0 left-0 z-50 w-72 lg:static lg:z-auto',
          rail ? 'lg:w-[4.5rem]' : 'lg:w-64',
          drawer ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        ].join(' ')}
        aria-label="Admin navigation"
      >
        {/* Workspace */}
        <div className="flex items-center gap-2 h-16 px-3 shrink-0">
          <Link
            href="/admin/overview"
            className={`flex items-center gap-2.5 min-w-0 rounded-xl p-1.5 -m-1.5 hover:bg-white/10 transition-colors ${rail ? 'lg:mx-auto' : 'flex-1'}`}
          >
            <span className="grid place-items-center size-8 shrink-0 rounded-lg bg-white/10">
              <Church className="size-4 text-gold" aria-hidden />
            </span>
            <span className={`min-w-0 ${rail ? 'lg:hidden' : ''}`}>
              <span className="block font-semibold text-sm truncate">Grace Nepal Church</span>
              <span className="block text-[11px] text-white/60 truncate">Admin panel</span>
            </span>
          </Link>

          <button
            type="button"
            onClick={toggleRail}
            className={`hidden lg:inline-flex items-center justify-center size-8 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors ${rail ? 'lg:hidden' : ''}`}
            aria-label="Collapse the menu"
          >
            <PanelLeftClose className="size-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => setDrawer(false)}
            className="lg:hidden inline-flex items-center justify-center size-9 rounded-lg text-white/60 hover:bg-white/10"
            aria-label="Close the menu"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-3 shrink-0">
          <button
            type="button"
            onClick={openPalette}
            className={`flex items-center gap-2 w-full h-9 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 hover:text-white transition-colors ${rail ? 'lg:justify-center lg:gap-0 lg:px-0' : 'px-2.5'}`}
            aria-label="Search the admin"
          >
            <Search className="size-4 shrink-0" aria-hidden />
            <span className={`text-sm ${rail ? 'lg:hidden' : ''}`}>Search</span>
            <kbd className={`ml-auto text-[10px] font-sans border border-white/20 rounded px-1.5 py-0.5 ${rail ? 'lg:hidden' : ''}`}>
              ⌘K
            </kbd>
          </button>
        </div>

        {rail && (
          <button
            type="button"
            onClick={toggleRail}
            className="hidden lg:inline-flex items-center justify-center h-9 mx-3 mb-2 rounded-xl text-white/60 hover:bg-white/10 hover:text-white transition-colors"
            aria-label="Expand the menu"
          >
            <PanelLeftOpen className="size-4" aria-hidden />
          </button>
        )}

        <nav ref={navRef} className="flex-1 overflow-y-auto overflow-x-hidden px-3 pb-3 space-y-4">
          {groups.map((g) => {
            const open = isOpen(g)
            return (
              <div key={g.id} className={rail ? 'lg:border-t lg:border-white/10 lg:pt-2 lg:first:border-0' : ''}>
                <button
                  type="button"
                  onClick={() => toggleGroup(g.id)}
                  aria-expanded={open}
                  className={`flex items-center gap-1 w-full px-2 py-1 text-[11px] font-medium uppercase tracking-wider text-white/40 hover:text-white/70 transition-colors ${rail ? 'lg:hidden' : ''}`}
                >
                  {g.label}
                  <ChevronDown
                    className={`size-3 transition-transform ${open ? '' : '-rotate-90'}`}
                    aria-hidden
                  />
                </button>
                {/* In the rail there are no headings to collapse under, so
                    everything stays reachable. */}
                <ul className={`${open ? 'block' : 'hidden'} ${rail ? 'lg:block' : ''} mt-0.5 space-y-0.5`}>
                  {g.items.map((item) => {
                    const on = active === item.to
                    // A module's own pages, only while you are inside it.
                    const inside = !rail && item.children
                      && (pathname === item.to || pathname.startsWith(`${item.to}/`))
                    return (
                      <li key={item.to}>
                        <Link
                          href={item.to}
                          aria-current={on && !inside ? 'page' : undefined}
                          title={rail ? item.label : undefined}
                          className={[
                            'flex w-full items-center gap-3 rounded-xl px-2.5 h-9 text-sm transition-colors',
                            rail ? 'lg:justify-center lg:gap-0 lg:px-0' : '',
                            on || inside
                              ? 'bg-white/15 text-white font-medium'
                              : 'text-white/70 hover:bg-white/10 hover:text-white',
                          ].join(' ')}
                        >
                          <item.icon className="size-4 shrink-0" aria-hidden />
                          <span className={`truncate ${rail ? 'lg:hidden' : ''}`}>{item.label}</span>
                        </Link>

                        {inside && (
                          // Indented against a rule, so the nesting reads as
                          // "inside this" rather than as more top-level links.
                          <ul className="mt-0.5 mb-1 ml-[1.4rem] pl-3 border-l border-white/15 space-y-0.5">
                            {item.children!.map((c) => {
                              const cur = pathname === c.to
                              return (
                                <li key={c.to}>
                                  <Link
                                    href={c.to}
                                    aria-current={cur ? 'page' : undefined}
                                    className={`block truncate rounded-lg px-2.5 h-8 leading-8 text-[13px] transition-colors ${
                                      cur
                                        ? 'bg-white/15 text-white font-medium'
                                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                                    }`}
                                  >
                                    {c.label}
                                  </Link>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </nav>

        {/* Who you are. Laid out as a grid so a long name truncates instead of
            sliding under the avatar. */}
        <div className="shrink-0 border-t border-white/10 p-3">
          {unmanaged && !rail && (
            // Says out loud when the signed-in identity is a hand-minted token
            // with no user row, where the signed claim governs rather than any
            // role. Silent unrestricted access is the wrong kind of quiet.
            <p className="text-[11px] text-gold mb-2 px-1">Unmanaged token — full access</p>
          )}
          <div className={`flex items-center gap-2 ${rail ? 'lg:flex-col lg:gap-1' : ''}`}>
            <span className="grid place-items-center size-8 shrink-0 rounded-full bg-white/15 text-xs font-semibold">
              {(user?.name ?? '?').trim().charAt(0).toUpperCase()}
            </span>
            <span className={`min-w-0 flex-1 ${rail ? 'lg:hidden' : ''}`}>
              <span className="block text-sm truncate">{user?.name}</span>
              <span className="block text-[11px] text-white/50 truncate">{user?.email}</span>
            </span>
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className={`inline-flex items-center justify-center size-8 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors ${rail ? 'lg:hidden' : ''}`}
              aria-label="Open the church website in a new tab"
              title="View the website"
            >
              <ExternalLink className="size-4" aria-hidden />
            </a>
            <button
              type="button"
              onClick={() => { logout(); window.location.href = '/admin/login' }}
              className="inline-flex items-center justify-center size-8 shrink-0 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Log out"
              title="Log out"
            >
              <LogOut className="size-4" aria-hidden />
            </button>
          </div>
        </div>
      </aside>

      <CommandPalette groups={groups} open={palette} onClose={() => setPalette(false)} />
    </>
  )
}

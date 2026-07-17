'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import api from '@/lib/api'
import { applyPrimaryColor, applySkin, applyFonts, loadGoogleFont, THEME_SETTING_KEYS } from '@/lib/theme'

/**
 * Reads the site-wide theme the admin saved to the backend (public GET /settings)
 * and applies it for every visitor: brand/primary colour, skin, and — only if the
 * visitor hasn't picked a mode themselves — the admin's default light/dark mode.
 * Renders nothing.
 */
export function SiteThemeApplier() {
  const { setTheme } = useTheme()

  useEffect(() => {
    let cancelled = false
    api
      .get('/settings')
      .then(({ data }) => {
        if (cancelled || !Array.isArray(data)) return
        const map = new Map<string, string>(
          data.map((row: { key: string; value: string }) => [row.key, row.value]),
        )

        const primary = map.get(THEME_SETTING_KEYS.primary)
        if (primary) applyPrimaryColor(primary)

        const headingFont = map.get(THEME_SETTING_KEYS.heading_font)
        const bodyFont = map.get(THEME_SETTING_KEYS.body_font)
        if (headingFont && bodyFont) {
          applyFonts(headingFont, bodyFont)
          loadGoogleFont(headingFont)
          loadGoogleFont(bodyFont)
        }

        const skin = map.get(THEME_SETTING_KEYS.skin)
        if (skin) applySkin(skin)

        const homepageLayout = map.get(THEME_SETTING_KEYS.homepage_layout)
        if (homepageLayout) {
          document.documentElement.setAttribute('data-homepage-layout', homepageLayout)
        } else {
          document.documentElement.removeAttribute('data-homepage-layout')
        }

        // next-themes persists the visitor's own choice under localStorage 'theme'.
        // Only fall back to the admin default when they haven't chosen yet.
        const defaultMode = map.get(THEME_SETTING_KEYS.mode)
        if (
          defaultMode &&
          typeof window !== 'undefined' &&
          !localStorage.getItem('theme')
        ) {
          setTheme(defaultMode)
        }
      })
      .catch(() => {
        /* settings unavailable — keep built-in defaults */
      })
    return () => {
      cancelled = true
    }
  }, [setTheme])

  return null
}

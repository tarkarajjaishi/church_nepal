'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import type { ComponentProps } from 'react'

/**
 * Thin client wrapper around next-themes so it can be mounted from the (server)
 * root layout. Toggles the `.dark` class on <html>; the site's dark-mode CSS
 * variables live in globals.css.
 */
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

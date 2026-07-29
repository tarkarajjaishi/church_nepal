'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const

/**
 * Per-visitor light / dark / system switcher. Renders a neutral placeholder until
 * mounted to avoid a hydration mismatch (theme is only known on the client).
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const Icon = !mounted ? Sun : resolvedTheme === 'dark' ? Moon : Sun

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Toggle color theme"
        className={`grid place-items-center size-9 rounded-md text-foreground/70 hover:bg-secondary hover:text-church-blue transition-colors outline-none ${className}`}
      >
        <Icon className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {OPTIONS.map(opt => (
          <DropdownMenuItem
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className="gap-2"
          >
            <opt.icon className="size-4" />
            <span className="flex-1">{opt.label}</span>
            {mounted && theme === opt.value && <Check className="size-3.5 text-church-blue" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

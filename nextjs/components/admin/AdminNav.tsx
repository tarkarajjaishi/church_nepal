'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { LogOut, Menu, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { User } from '@/lib/types'

/**
 * AdminNav - Main navigation for admin dashboard
 *
 * Features:
 * - Mobile-responsive hamburger menu
 * - User profile dropdown
 * - Quick logout
 * - Active route highlighting
 */
export default function AdminNav() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    router.push('/admin/login')
  }

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Blog', href: '/admin/blog' },
    { label: 'Events', href: '/admin/events' },
    { label: 'Users', href: '/admin/users' },
    { label: 'Settings', href: '/admin/settings' },
  ]

  return (
    <nav className="bg-card shadow-sm border-b border-border" aria-label="Admin top navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/admin/dashboard" className="font-bold text-xl text-primary hover:text-primary/80 transition">
            Grace Admin
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted-foreground hover:text-primary transition-colors text-sm font-medium"
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* User Profile & Settings */}
          <div className="flex items-center gap-4">
            {/* Profile Dropdown */}
            <div className="relative hidden sm:block">
              <button
                onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted transition"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {user?.name?.[0]?.toUpperCase() || 'A'}
                </div>
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline">{user?.name}</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>

              {profileMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg border border-border z-50"
                >
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-medium text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Link
                    href="/admin/profile"
                    className="block px-4 py-2 text-sm text-muted-foreground hover:bg-accent"
                  >
                    Profile Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </motion.div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-muted"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-border py-4"
          >
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block px-4 py-2 text-muted-foreground hover:bg-muted rounded transition"
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-2 text-destructive hover:bg-destructive/10 rounded flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  )
}

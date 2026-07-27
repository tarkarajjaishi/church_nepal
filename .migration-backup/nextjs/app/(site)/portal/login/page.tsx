'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Church, AlertCircle, Eye, EyeOff, Mail } from 'lucide-react'
import { LoadingSpinner, ErrorState } from '@/components/LoadingStates'
import type { LoginRequest } from '@/lib/types'

export default function PortalLoginPage() {
  const router = useRouter()

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [magicEmail, setMagicEmail] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [magicLoading, setMagicLoading] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${localStorage.getItem('admin_token') || ''}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.role === 'admin') {
            router.push('/admin/dashboard')
          } else {
            router.push('/portal/profile')
          }
        }
      } catch {
        // Not logged in
      }
    }
    checkAuth()
  }, [router])

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    setLocalError(null)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target
    setTouched((prev) => ({
      ...prev,
      [name]: true,
    }))
  }

  const getFieldError = (field: 'email' | 'password'): string | null => {
    if (!touched[field]) return null

    if (field === 'email') {
      if (!formData.email) return 'Email is required'
      if (!validateEmail(formData.email)) return 'Invalid email address'
    }

    if (field === 'password') {
      if (!formData.password) return 'Password is required'
      if (formData.password.length < 6) return 'Password must be at least 6 characters'
    }

    return null
  }

  const isFormValid = formData.email && formData.password && validateEmail(formData.email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!isFormValid) {
      setTouched({ email: true, password: true })
      return
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (res.ok && data.token) {
        localStorage.setItem('admin_token', data.token)
        if (data.user?.role === 'admin') {
          router.push('/admin/dashboard')
        } else {
          router.push('/portal/profile')
        }
      } else {
        setLocalError(data.error || data.detail || 'Login failed. Please try again.')
      }
    } catch {
      setLocalError('Network error. Please try again.')
    }
  }

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setMagicLoading(true)
    try {
      const res = await fetch('/api/portal/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicEmail }),
      })
      if (res.ok) {
        setMagicSent(true)
      } else {
        const data = await res.json()
        setLocalError(data.error || 'Failed to send magic link')
      }
    } catch {
      setLocalError('Network error. Please try again.')
    } finally {
      setMagicLoading(false)
    }
  }

  const displayError = localError

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary to-muted px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden border border-border">
          <div className="bg-gradient-to-r from-primary to-primary/80 px-8 py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-white/20 backdrop-blur-md mb-4"
            >
              <Church className="w-8 h-8 text-white" />
            </motion.div>

            <h1 className="text-2xl font-bold text-white mb-2">Grace Nepal Church</h1>
            <p className="text-primary-foreground/70 text-sm">Member Portal</p>
          </div>

          <div className="p-8">
            {displayError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6"
              >
                <ErrorState
                  message={displayError}
                  action={
                    <button
                      onClick={() => setLocalError(null)}
                      className="text-sm text-destructive hover:text-destructive/80 font-medium"
                    >
                      Dismiss
                    </button>
                  }
                />
              </motion.div>
            )}

            {magicSent ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4"
              >
                <Mail className="size-12 text-church-blue mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-church-blue mb-2">Check your email</h3>
                <p className="text-sm text-muted-foreground">
                  We sent a sign-in link to <strong>{magicEmail}</strong>. Click the link in the email to sign in.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="member@gracenepal.org"
                    className={`w-full px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 bg-card text-foreground ${
                      getFieldError('email')
                        ? 'border-destructive focus:ring-destructive/50'
                        : 'border-border focus:ring-primary/50'
                    }`}
                    aria-invalid={!!getFieldError('email')}
                    aria-describedby={getFieldError('email') ? 'email-error' : undefined}
                  />
                  {getFieldError('email') && (
                    <p id="email-error" className="mt-1 text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {getFieldError('email')}
                    </p>
                  )}
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      placeholder="••••••••"
                      className={`w-full px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed pr-10 bg-card text-foreground ${
                        getFieldError('password')
                          ? 'border-destructive focus:ring-destructive/50'
                          : 'border-border focus:ring-primary/50'
                      }`}
                      aria-invalid={!!getFieldError('password')}
                      aria-describedby={getFieldError('password') ? 'password-error' : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {getFieldError('password') && (
                    <p id="password-error" className="mt-1 text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {getFieldError('password')}
                    </p>
                  )}
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  type="submit"
                  disabled={!isFormValid}
                  className="w-full py-2.5 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  Sign In
                </motion.button>
              </form>
            )}

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">Or</span>
              </div>
            </div>

            {!magicSent && (
              <form onSubmit={handleMagicLink} className="space-y-3">
                <div>
                  <label htmlFor="magic-email" className="block text-sm font-medium text-foreground mb-2">
                    Send Magic Link
                  </label>
                  <input
                    id="magic-email"
                    type="email"
                    value={magicEmail}
                    onChange={(e) => setMagicEmail(e.target.value)}
                    placeholder="member@gracenepal.org"
                    disabled={magicLoading}
                    className="w-full px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed bg-card text-foreground border-border focus:ring-primary/50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={magicLoading || !magicEmail}
                  className="w-full py-2.5 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {magicLoading ? 'Sending...' : 'Send Magic Link'}
                </button>
              </form>
            )}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-xs text-muted-foreground mt-6"
            >
              Member portal for church members only
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

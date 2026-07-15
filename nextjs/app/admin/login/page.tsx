'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'motion/react'
import { Church, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { LoadingSpinner, ErrorState } from '@/components/LoadingStates'
import type { LoginRequest } from '@/lib/types'

/**
 * Admin Login Page
 *
 * Modern, secure login with:
 * - Email/password validation
 * - Error handling and display
 * - Loading states
 * - Accessibility (labels, ARIA)
 * - Responsive design
 */
export default function LoginPage() {
  const { login, loading, error, clearError, user } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
  })

  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/admin/dashboard')
    }
  }, [user, router])

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
      await login(formData.email, formData.password)
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || 'Login failed. Please try again.'
      setLocalError(errorMessage)
    }
  }

  const displayError = localError || error

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-white/20 backdrop-blur-md mb-4"
            >
              <Church className="w-8 h-8 text-white" />
            </motion.div>

            <h1 className="text-2xl font-bold text-white mb-2">Grace Nepal Church</h1>
            <p className="text-blue-100 text-sm">Admin Dashboard</p>
          </div>

          {/* Form Container */}
          <div className="p-8">
            {/* Error State */}
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
                      onClick={() => {
                        setLocalError(null)
                        clearError()
                      }}
                      className="text-sm text-red-700 hover:text-red-800 font-medium"
                    >
                      Dismiss
                    </button>
                  }
                />
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="admin@gracenepal.org"
                  disabled={loading}
                  className={`w-full px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                    getFieldError('email')
                      ? 'border-red-500 focus:ring-red-500/50'
                      : 'border-gray-300 focus:ring-blue-500/50'
                  }`}
                  aria-invalid={!!getFieldError('email')}
                  aria-describedby={getFieldError('email') ? 'email-error' : undefined}
                />
                {getFieldError('email') && (
                  <p id="email-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {getFieldError('email')}
                  </p>
                )}
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
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
                    disabled={loading}
                    className={`w-full px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed pr-10 ${
                      getFieldError('password')
                        ? 'border-red-500 focus:ring-red-500/50'
                        : 'border-gray-300 focus:ring-blue-500/50'
                    }`}
                    aria-invalid={!!getFieldError('password')}
                    aria-describedby={getFieldError('password') ? 'password-error' : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {getFieldError('password') && (
                  <p id="password-error" className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {getFieldError('password')}
                  </p>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>

            {/* Footer */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-center text-xs text-gray-500 mt-6"
            >
              Secure login for authorized administrators only
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

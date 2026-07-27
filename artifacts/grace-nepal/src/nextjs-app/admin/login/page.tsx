import { useState, useEffect } from 'react'
import { useRouter } from '@/lib/navigation'
import { motion } from 'motion/react'
import { Church, AlertCircle, Eye, EyeOff, Info } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import type { LoginRequest } from '@/lib/types'

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
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-white font-sans text-slate-900">
      {/* Left side: Atmospheric Image */}
      <div className="hidden md:flex flex-col md:w-1/2 lg:w-[55%] relative overflow-hidden bg-[#0b3c5d]">
        <div className="absolute inset-0 bg-black/40 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0b3c5d] via-[#0b3c5d]/60 to-transparent z-10" />
        
        <img 
          src="https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=1200&q=80" 
          alt="Church interior" 
          className="absolute inset-0 w-full h-full object-cover scale-105 animate-ken-burns"
        />

        <div className="relative z-20 flex flex-col justify-between h-full p-12 lg:p-20">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 shadow-xl shadow-black/20">
              <Church className="size-8 text-white" />
            </div>
            <div>
              <div className="font-bold text-white text-2xl tracking-wide">Grace Nepal</div>
              <div className="text-xs font-bold text-sky-400 uppercase tracking-wider mt-0.5">Admin Platform</div>
            </div>
          </div>

          <div className="max-w-xl">
            <h1 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6 font-serif">
              "Where the Spirit of the Lord is, there is freedom."
            </h1>
            <p className="text-lg text-white/80 font-medium leading-relaxed">
              Manage your church community, sermons, and operations from a single, unified platform.
            </p>
          </div>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-20 relative bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="md:hidden flex items-center gap-3 mb-12">
            <div className="bg-[#0b3c5d] p-3 rounded-2xl shadow-lg">
              <Church className="size-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-[#0b3c5d] text-xl tracking-wide">Grace Nepal</div>
              <div className="text-xs font-bold text-sky-600 uppercase tracking-wider mt-0.5">Admin Platform</div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-bold text-slate-900 mb-2 font-serif">Welcome back</h2>
            <p className="text-slate-500 mb-8 font-medium">Sign in to your admin account to continue.</p>

            {/* Error State */}
            {displayError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="size-5 shrink-0 mt-0.5" />
                <div className="flex-1 text-sm font-semibold leading-relaxed">{displayError}</div>
                <button
                  onClick={() => {
                    setLocalError(null)
                    clearError()
                  }}
                  className="text-red-500 hover:text-red-700 transition-colors p-1"
                >
                  <EyeOff className="size-4" />
                </button>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
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
                  className={`w-full px-4 py-3.5 border-2 rounded-xl transition-all outline-none disabled:opacity-50 disabled:bg-slate-50 bg-white text-slate-900 font-medium shadow-sm ${
                    getFieldError('email')
                      ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                      : 'border-slate-200 focus:border-[#0b3c5d] hover:border-slate-300 focus:ring-4 focus:ring-[#0b3c5d]/10'
                  }`}
                />
                {getFieldError('email') && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 font-bold">
                    <AlertCircle className="size-4" />
                    {getFieldError('email')}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-bold text-slate-700 uppercase tracking-wide">
                    Password
                  </label>
                </div>
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
                    className={`w-full px-4 py-3.5 pr-12 border-2 rounded-xl transition-all outline-none disabled:opacity-50 disabled:bg-slate-50 bg-white text-slate-900 font-medium shadow-sm ${
                      getFieldError('password')
                        ? 'border-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                        : 'border-slate-200 focus:border-[#0b3c5d] hover:border-slate-300 focus:ring-4 focus:ring-[#0b3c5d]/10'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 p-1 text-slate-400 hover:text-slate-600 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0b3c5d]/50 bg-white"
                  >
                    {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                  </button>
                </div>
                {getFieldError('password') && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1.5 font-bold">
                    <AlertCircle className="size-4" />
                    {getFieldError('password')}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="w-full py-4 mt-4 bg-[#0b3c5d] text-white rounded-xl font-bold shadow-lg shadow-[#0b3c5d]/25 hover:shadow-xl hover:shadow-[#0b3c5d]/35 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Demo Hint */}
            <div className="mt-12 bg-slate-50 rounded-xl p-4 border border-slate-200 flex items-start gap-3 shadow-inner">
              <Info className="size-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">Demo Mode Active</h4>
                <p className="text-sm text-slate-600 font-medium">
                  Try using <span className="font-mono text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">admin@gracenepal.org</span> and <span className="font-mono text-slate-800 bg-slate-200 px-1.5 py-0.5 rounded border border-slate-300">admin123</span> to sign in.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

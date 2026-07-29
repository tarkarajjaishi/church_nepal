'use client'

import React, { ReactNode, useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorCount: number
}

/**
 * ErrorBoundary - Catches React component errors and displays fallback UI
 *
 * Features:
 * - Prevents entire app crash from single component error
 * - Error tracking with ID for debugging
 * - User-friendly error messages
 * - Reset functionality to recover
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error for monitoring/debugging
    console.error('Error caught by boundary:', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    })

    // Send to error tracking service in production
    if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      // Example: send to Sentry, LogRocket, etc.
      // captureException(error, { contexts: { react: errorInfo } })
    }

    // Increment error count to prevent infinite loops
    this.setState((prev) => ({
      errorCount: prev.errorCount + 1,
    }))
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    const { hasError, error, errorCount } = this.state
    const { children, fallback } = this.props

    // If too many errors, show error state (prevent infinite loop)
    if (hasError && errorCount > 3) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 px-4">
          <div className="max-w-md w-full text-center">
            <div className="bg-red-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We&apos;re experiencing repeated errors. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </button>
          </div>
        </div>
      )
    }

    if (hasError && error) {
      return (
        this.props.fallback?.(error, this.handleReset) || (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <div className="max-w-md w-full">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <div className="bg-red-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                  Something went wrong
                </h1>
                <p className="text-gray-600 mb-2 text-center text-sm">
                  {error.message || 'An unexpected error occurred'}
                </p>
                <p className="text-gray-400 text-xs text-center mb-6">
                  Error ID: {Math.random().toString(36).substring(2, 9)}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={this.handleReset}
                    className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => (window.location.href = '/')}
                    className="flex-1 py-2 px-4 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Go Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      )
    }

    return children
  }
}

/**
 * AsyncErrorBoundary - Functional component wrapper for error handling
 */
export function AsyncErrorBoundary({
  children,
  fallback,
}: {
  children: ReactNode
  fallback?: (error: Error, reset: () => void) => ReactNode
}) {
  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}

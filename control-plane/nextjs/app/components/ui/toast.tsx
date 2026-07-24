'use client';

import { toast, Toaster as SonnerToaster } from 'sonner';
import { cva, type VariantProps } from 'class-variance-authority';

// Define toast variants using cva
const toastVariants = cva(
  'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg',
  {
    variants: {
      variant: {
        default: 'bg-[var(--panel)] text-[var(--text)] border-[var(--border)]',
        success: 'bg-[var(--good-soft)] text-[var(--good)] border-[var(--good)]',
        error: 'bg-[var(--error-soft)] text-[var(--error)] border-[var(--error)]',
        info: 'bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]',
        warning: 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning)]',
        loading: 'bg-[var(--panel)] text-[var(--text)] border-[var(--border)]'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

export interface ToastOptions extends VariantProps<typeof toastVariants> {
  description?: string;
}

// Success toast
export const success = (message: string, opts?: ToastOptions) => {
  toast.success(message, {
    ...opts,
    className: toastVariants({ variant: opts?.variant || 'success' })
  });
};

// Error toast
export const error = (message: string, opts?: ToastOptions) => {
  toast.error(message, {
    ...opts,
    className: toastVariants({ variant: opts?.variant || 'error' })
  });
};

// Info toast
export const info = (message: string, opts?: ToastOptions) => {
  toast.info(message, {
    ...opts,
    className: toastVariants({ variant: opts?.variant || 'info' })
  });
};

// Loading toast
export const loading = (message: string, opts?: ToastOptions) => {
  toast.loading(message, {
    ...opts,
    className: toastVariants({ variant: opts?.variant || 'loading' })
  });
};

// Default toast
export const notify = (message: string, opts?: ToastOptions) => {
  toast(message, {
    ...opts,
    className: toastVariants({ variant: opts?.variant || 'default' })
  });
};

// Custom Toaster component
export const Toaster = () => {
  return (
    <SonnerToaster 
      theme="system"
      position="bottom-right"
      toastOptions={{
        className: 'bg-[var(--panel)] text-[var(--text)] border border-[var(--border)]'
      }}
    />
  );
};

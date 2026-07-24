import * as React from 'react';

type ButtonVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  active?: boolean;
}

const variantClasses = {
  default: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-2)]',
  secondary: 'bg-[var(--panel-2)] text-[var(--text)] hover:bg-[var(--panel-3)]',
  destructive: 'bg-red-500 text-white hover:bg-red-600',
  outline: 'border border-[var(--border)] bg-transparent hover:bg-[var(--panel-2)] text-[var(--text)]',
  ghost: 'bg-transparent hover:bg-[var(--panel-2)] text-[var(--text)]',
  link: 'underline-offset-4 hover:underline text-[var(--accent)]',
};

const sizeClasses = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 py-2 text-base',
  lg: 'h-12 px-6 text-lg',
};

export function Button({
  className = '',
  variant = 'default',
  size = 'md',
  active = false,
  ...props
}: ButtonProps) {
  const baseClasses = `inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:pointer-events-none disabled:opacity-50 min-h-[44px] min-w-[44px]`;
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
    active ? 'ring-2 ring-[var(--accent)] ring-offset-2' : ''
  } ${className}`;

  return <button className={classes} {...props} />;
}

import { cn } from '../../lib/utils'
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md'
}

const variants = {
  primary: 'bg-blue-500 text-white hover:bg-blue-600 border border-blue-500',
  outline: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 border border-transparent',
  danger: 'bg-red-500 text-white hover:bg-red-600 border border-red-500',
  success: 'bg-green-500 text-white hover:bg-green-600 border border-green-500',
}

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
}

export function Button({ variant = 'outline', size = 'md', className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium transition-colors focus:outline-none',
        variants[variant],
        sizes[size],
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
    >
      {children}
    </button>
  )
}

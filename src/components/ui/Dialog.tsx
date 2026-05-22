import { cn } from '../../lib/utils'
import type { ReactNode } from 'react'

interface DialogProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export function Dialog({ open, onClose, title, children, className }: DialogProps) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className={cn('relative bg-white rounded-xl shadow-xl w-full mx-4 p-6', className ?? 'max-w-sm')}>
        <h2 className="text-base font-semibold text-slate-800 mb-4">{title}</h2>
        {children}
      </div>
    </div>
  )
}

interface DialogActionsProps {
  children: ReactNode
  className?: string
}

export function DialogActions({ children, className }: DialogActionsProps) {
  return (
    <div className={cn('flex justify-end gap-2 mt-6', className)}>
      {children}
    </div>
  )
}

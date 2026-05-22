import { cn } from '../../lib/utils'
import type { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  amber?: boolean
}

export function Card({ className, children, amber, ...props }: CardProps) {
  return (
    <div
      {...props}
      className={cn(
        'bg-white rounded-lg border border-slate-200 shadow-sm p-4',
        amber && 'border-l-4 border-l-amber-400 p-5',
        className
      )}
    >
      {children}
    </div>
  )
}

interface SectionHeaderProps {
  title: string
  collapsed?: boolean
  onToggle?: () => void
}

export function SectionHeader({ title, collapsed, onToggle }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      {onToggle && (
        <button
          onClick={onToggle}
          className="text-xs text-blue-500 hover:text-blue-700"
        >
          {collapsed ? 'Mở rộng' : 'Thu gọn'}
        </button>
      )}
    </div>
  )
}

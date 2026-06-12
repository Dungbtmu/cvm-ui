import { cn } from '../../lib/utils'
import type { CampaignStatus } from '../../types'

interface StatusBadgeProps {
  status: CampaignStatus
  className?: string
}

const statusConfig: Record<CampaignStatus, { label: string; className: string }> = {
  Active: { label: 'Đang chạy', className: 'bg-green-100 text-green-700' },
  Draft: { label: 'Nháp', className: 'bg-slate-100 text-slate-600' },
  Pending: { label: 'Chờ duyệt', className: 'bg-yellow-100 text-yellow-700' },
  Paused: { label: 'Tạm dừng', className: 'bg-orange-100 text-orange-700' },
  Ended: { label: 'Đã kết thúc', className: 'bg-slate-100 text-slate-500' },
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', config.className, className)}>
      {config.label}
    </span>
  )
}

interface TriggerChipProps {
  code: string
  className?: string
}

export function TriggerChip({ code, className }: TriggerChipProps) {
  return (
    <span className={cn('bg-amber-100 text-amber-800 rounded px-2 py-0.5 text-xs font-mono', className)}>
      {code}
    </span>
  )
}

interface ParamChipProps {
  name: string
  onClick?: () => void
  className?: string
}

export function ParamChip({ name, onClick, className }: ParamChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'bg-blue-100 text-blue-700 rounded-full px-2 py-0.5 text-xs cursor-pointer hover:bg-blue-200 transition-colors',
        className
      )}
    >
      {`{{${name}}}`}
    </button>
  )
}

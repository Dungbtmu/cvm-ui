import { Bell, User } from 'lucide-react'

interface HeaderProps {
  breadcrumb?: string[]
}

export function Header({ breadcrumb }: HeaderProps) {
  const now = new Date()
  const dateStr = now.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

  return (
    <header className="h-14 border-b bg-white flex items-center px-6 fixed top-0 right-0 left-56 z-10 justify-between">
      <div className="flex items-center gap-1 text-sm text-slate-500">
        {breadcrumb?.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && <span className="text-slate-300">/</span>}
            <span className={i === breadcrumb.length - 1 ? 'text-slate-800 font-medium' : ''}>
              {crumb}
            </span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-4 text-sm text-slate-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          TRỰC TIẾP · {dateStr} {timeStr}
        </span>
        <button className="p-1.5 hover:bg-slate-100 rounded-md transition-colors">
          <Bell size={16} />
        </button>
        <button className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-white">
          <User size={14} />
        </button>
      </div>
    </header>
  )
}

import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import {
  LayoutDashboard, Megaphone, FileText, Zap,
  Users, ShieldOff, BarChart2, ShieldCheck, Settings,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  { label: 'Campaign', to: '/campaigns', icon: Megaphone },
  { label: 'Template', to: '/templates', icon: FileText },
  { label: 'Trigger', to: '/triggers', icon: Zap },
  { label: 'Khách hàng', to: '/customers', icon: Users },
  { label: 'Blacklist', to: '/blacklist', icon: ShieldOff },
  { label: 'Report', to: '/report', icon: BarChart2 },
  { label: 'Admin', to: '/admin', icon: ShieldCheck },
  { label: 'Settings', to: '/settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="w-56 flex-shrink-0 bg-slate-50 border-r border-slate-200 flex flex-col fixed inset-y-0 left-0 z-20">
      <div className="p-4 font-bold text-lg text-slate-800 border-b border-slate-200">
        CVM
      </div>
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800 border-l-2 border-transparent'
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

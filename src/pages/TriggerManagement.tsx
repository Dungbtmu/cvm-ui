import { useState } from 'react'
import { Search, Copy, X, CheckCircle } from 'lucide-react'
import { Dialog } from '../components/ui/Dialog'
import { mockTriggers } from '../data/mock'
import type { Trigger, TriggerType } from '../types'

const TYPE_BADGE: Record<TriggerType, string> = {
  Realtime: 'bg-green-100 text-green-700',
  'Near Realtime': 'bg-blue-100 text-blue-700',
  Offline: 'bg-slate-100 text-slate-600',
}

const TYPE_OPTIONS: TriggerType[] = ['Realtime', 'Near Realtime', 'Offline']

export function TriggerManagement() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [typeFilter, setTypeFilter] = useState<TriggerType[]>([])
  const [viewTarget, setViewTarget] = useState<Trigger | null>(null)
  const [copiedParam, setCopiedParam] = useState<string | null>(null)

  const toggleTypeFilter = (type: TriggerType) => {
    setTypeFilter(prev =>
      prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type]
    )
  }

  const handleCopyParam = (paramName: string) => {
    const syntax = `{{${paramName}}}`
    navigator.clipboard.writeText(syntax).catch(() => {})
    setCopiedParam(paramName)
    setTimeout(() => setCopiedParam(null), 1800)
  }

  const filtered = mockTriggers.filter(t => {
    const matchSearch =
      !search ||
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'Tất cả' || t.status === statusFilter
    const matchType = typeFilter.length === 0 || typeFilter.includes(t.type)
    return matchSearch && matchStatus && matchType
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Trigger Management</h1>
      </div>

      {/* Search + filter */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm trigger code hoặc tên..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded px-2 py-2 focus:outline-none"
          >
            {['Tất cả', 'Active', 'Inactive'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">Kiểu chạy:</span>
          {TYPE_OPTIONS.map(type => (
            <button
              key={type}
              onClick={() => toggleTypeFilter(type)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                typeFilter.includes(type)
                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
          {typeFilter.length > 0 && (
            <button
              onClick={() => setTypeFilter([])}
              className="text-xs text-blue-600 hover:underline ml-1"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Bảng trigger */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100">
            <tr className="text-xs text-slate-500">
              <th className="text-left px-4 py-2 font-medium">Code</th>
              <th className="text-left px-4 py-2 font-medium">Tên</th>
              <th className="text-left px-4 py-2 font-medium">Kiểu chạy</th>
              <th className="text-left px-4 py-2 font-medium">Nguồn sự kiện</th>
              <th className="text-left px-4 py-2 font-medium">Trạng thái</th>
              <th className="text-right px-4 py-2 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(t => (
              <tr
                key={t.id}
                className={`hover:bg-slate-50 ${t.status === 'Inactive' ? 'opacity-60' : ''}`}
              >
                <td className="px-4 py-2.5">
                  <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${search && t.code.toLowerCase().includes(search.toLowerCase()) ? 'bg-yellow-100 text-yellow-800' : 'bg-amber-50 text-amber-700'}`}>
                    {t.code}
                  </span>
                </td>
                <td className={`px-4 py-2.5 text-slate-700 ${search && t.name.toLowerCase().includes(search.toLowerCase()) ? 'bg-yellow-50' : ''}`}>
                  {t.name}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[t.type]}`}>
                    {t.type}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{t.source}</td>
                <td className="px-4 py-2.5">
                  {t.status === 'Active' ? (
                    <span className="text-xs font-medium text-green-600">● Active</span>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">○ Không còn sử dụng</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => setViewTarget(t)}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    Xem
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-sm text-slate-400 text-center">
                  Không tìm thấy trigger nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal xem chi tiết */}
      <Dialog
        open={!!viewTarget}
        onClose={() => setViewTarget(null)}
        title="Chi tiết Sự kiện kích hoạt"
        className="max-w-2xl"
      >
        {viewTarget && (
          <div className="space-y-5 text-sm">

            {/* A — Định danh */}
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">A. Định danh</h3>
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                  <div>
                    <span className="text-xs text-slate-400">Code</span>
                    <div className="font-mono text-sm font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-0.5 inline-block">
                      {viewTarget.code}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Kiểu chạy</span>
                    <div className="mt-0.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[viewTarget.type]}`}>
                        {viewTarget.type}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Nguồn sự kiện</span>
                    <div className="text-sm font-medium text-slate-700 mt-0.5">{viewTarget.source}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Trạng thái</span>
                    <div className="mt-0.5">
                      {viewTarget.status === 'Active' ? (
                        <span className="text-xs font-medium text-green-600">● Active</span>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">○ Không còn sử dụng</span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Tên</span>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{viewTarget.name}</div>
                </div>
              </div>
            </section>

            {/* B — Tham số đầu ra */}
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">B. Tham số đầu ra</h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-slate-500">
                      <th className="text-left px-3 py-2 font-medium">Tham số</th>
                      <th className="text-left px-3 py-2 font-medium">Mô tả</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewTarget.params.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-3 py-4 text-slate-400 text-center italic">Chưa có tham số nào</td>
                      </tr>
                    )}
                    {viewTarget.params.map(p => (
                      <tr key={p.name} className="hover:bg-slate-50 group">
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleCopyParam(p.name)}
                            className="flex items-center gap-1 font-mono text-blue-600 hover:text-blue-800"
                            title="Nhấn để copy cú pháp"
                          >
                            <span>{`{{${p.name}}}`}</span>
                            {copiedParam === p.name
                              ? <CheckCircle size={10} className="text-green-500" />
                              : <Copy size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            }
                          </button>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{p.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <Copy size={10} />
                Nhấn vào tên tham số để copy cú pháp vào clipboard
              </p>
            </section>

          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100 mt-4">
          <button
            onClick={() => setViewTarget(null)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-3 py-1.5"
          >
            <X size={13} /> Đóng
          </button>
        </div>
      </Dialog>
    </div>
  )
}

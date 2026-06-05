import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Copy, Eye } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { mockTemplates, mockCampaigns } from '../data/mock'
import type { Template, ChannelType } from '../types'

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const

export function TemplateManagement() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>(mockTemplates)
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState<ChannelType | 'Tất cả'>('Tất cả')
  const [statusFilter, setStatusFilter] = useState<'Tất cả' | 'Active' | 'Inactive'>('Tất cả')
  const [disableTarget, setDisableTarget] = useState<Template | null>(null)
  const [usagePopup, setUsagePopup] = useState<Template | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const filtered = templates
    .filter(t => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
      const matchChannel = channelFilter === 'Tất cả' || t.channels.includes(channelFilter as ChannelType)
      const matchStatus = statusFilter === 'Tất cả' || t.status === statusFilter
      return matchSearch && matchChannel && matchStatus
    })
    .sort((a, b) => b.usageCount - a.usageCount)

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const changePage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)))
  const changePageSize = (size: number) => { setPageSize(size); setPage(1) }
  const handleFilter = (fn: () => void) => { fn(); setPage(1) }

  const handleClone = (t: Template) => {
    const clone: Template = { ...t, id: String(Date.now()), name: `Bản sao của ${t.name}`, usageCount: 0 }
    setTemplates(prev => [clone, ...prev])
    toast(`Đã tạo bản sao: ${clone.name}`, 'success')
    navigate(`/templates/${clone.id}`)
  }

  const handleToggle = (t: Template) => {
    if (t.status === 'Active') {
      setDisableTarget(t)
    } else {
      setTemplates(prev => prev.map(x => x.id === t.id ? { ...x, status: 'Active' } : x))
      toast('Đã bật template', 'success')
    }
  }

  const confirmDisable = () => {
    if (!disableTarget) return
    setTemplates(prev => prev.map(x => x.id === disableTarget.id ? { ...x, status: 'Inactive' } : x))
    toast('Đã tắt template', 'success')
    setDisableTarget(null)
  }

  const channelDots = (channels: ChannelType[]) =>
    channels.map(ch => (
      <span key={ch} className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 text-xs">{ch}</span>
    ))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Template</h1>
        <Button variant="primary" onClick={() => navigate('/templates/new')}>
          <Plus size={14} /> Tạo Template
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => handleFilter(() => setSearch(e.target.value))}
            placeholder="Tìm tên template..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400" />
        </div>
        <select
          value={channelFilter}
          onChange={e => handleFilter(() => setChannelFilter(e.target.value as any))}
          className="text-sm border border-slate-200 rounded px-2 py-2 focus:outline-none"
        >
          <option value="Tất cả">Kênh: Tất cả</option>
          {['Push', 'Zalo OA', 'SMS', 'USSD', 'Banner', 'Email'].map(ch => <option key={ch} value={ch}>{ch}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={e => handleFilter(() => setStatusFilter(e.target.value as any))}
          className="text-sm border border-slate-200 rounded px-2 py-2 focus:outline-none"
        >
          <option value="Tất cả">Trạng thái: Tất cả</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs text-slate-500">
              <th className="text-left px-4 py-3 font-medium">Tên Template</th>
              <th className="text-left px-4 py-3 font-medium">Kênh hỗ trợ</th>
              <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
              <th className="text-left px-4 py-3 font-medium">Dùng</th>
              <th className="text-right px-4 py-3 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Không có template nào phù hợp</td></tr>
            )}
            {paged.map(t => (
              <tr key={t.id} className={`hover:bg-slate-50 ${t.status === 'Inactive' ? 'opacity-50' : ''}`}>
                <td className="px-4 py-2.5 font-medium text-slate-800">{t.name}</td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1 flex-wrap">{channelDots(t.channels)}</div>
                </td>
                <td className="px-4 py-2.5">
                  {t.status === 'Active'
                    ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Hoạt động</span>
                    : <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Không hoạt động</span>
                  }
                </td>
                <td className="px-4 py-2.5">
                  {t.usageCount === 0 ? (
                    <span className="text-slate-400">–</span>
                  ) : (
                    <button
                      onClick={() => setUsagePopup(usagePopup?.id === t.id ? null : t)}
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      {t.usageCount} lần
                    </button>
                  )}
                  {usagePopup?.id === t.id && (() => {
                    const campaigns = mockCampaigns.filter(c => c.templateIds?.includes(t.id))
                    const statusColor: Record<string, string> = {
                      Active: 'text-green-600', Draft: 'text-slate-500',
                      Pending: 'text-yellow-600', Paused: 'text-orange-500', Ended: 'text-slate-400',
                    }
                    return (
                      <div className="absolute bg-white border border-slate-200 rounded-lg shadow-xl z-30 p-3 mt-1 w-72 text-xs">
                        <div className="font-medium text-slate-700 mb-2">Campaign sử dụng template này:</div>
                        <div className="space-y-1.5">
                          {campaigns.map(c => (
                            <div key={c.id} className="flex items-center justify-between gap-2">
                              <span className="text-slate-700 truncate">{c.name}</span>
                              <span className={`flex-shrink-0 font-medium ${statusColor[c.status]}`}>{c.status}</span>
                            </div>
                          ))}
                          {campaigns.length === 0 && <div className="text-slate-400 italic">Chưa có campaign nào</div>}
                        </div>
                        <button onClick={() => setUsagePopup(null)} className="mt-2.5 text-slate-400 hover:text-slate-600">Đóng</button>
                      </div>
                    )
                  })()}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-2 justify-end">
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/templates/${t.id}/view`)}>
                      <Eye size={12} /> Xem
                    </Button>
                    <Button size="sm" onClick={() => navigate(`/templates/${t.id}`)}>Sửa</Button>
                    <Button size="sm" variant="ghost" onClick={() => handleClone(t)}>
                      <Copy size={12} /> Nhân bản
                    </Button>
                    <Button size="sm" variant={t.status === 'Active' ? 'danger' : 'success'} onClick={() => handleToggle(t)}>
                      {t.status === 'Active' ? 'Tắt' : 'Bật'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{filtered.length} template</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button onClick={() => changePage(1)} disabled={currentPage === 1} className="px-1.5 py-1 rounded hover:bg-slate-100 disabled:opacity-30">«</button>
              <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} className="px-1.5 py-1 rounded hover:bg-slate-100 disabled:opacity-30">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...'
                    ? <span key={`e${i}`} className="px-1">…</span>
                    : <button key={p} onClick={() => changePage(p)} className={`px-2 py-1 rounded ${currentPage === p ? 'bg-blue-500 text-white' : 'hover:bg-slate-100'}`}>{p}</button>
                )}
              <button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} className="px-1.5 py-1 rounded hover:bg-slate-100 disabled:opacity-30">›</button>
              <button onClick={() => changePage(totalPages)} disabled={currentPage === totalPages} className="px-1.5 py-1 rounded hover:bg-slate-100 disabled:opacity-30">»</button>
            </div>
            <select
              value={pageSize}
              onChange={e => changePageSize(Number(e.target.value))}
              className="border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}/trang</option>)}
            </select>
          </div>
        </div>
      </div>

      <Dialog open={!!disableTarget} onClose={() => setDisableTarget(null)} title="Tắt template?">
        <p className="text-sm text-slate-600">
          Tắt mẫu nội dung? Mẫu sẽ không hiện trong danh sách chọn khi tạo campaign.
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setDisableTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={confirmDisable}>Tắt</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

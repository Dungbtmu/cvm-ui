import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Copy, Eye, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { TriggerChip } from '../components/ui/Badge'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { mockTemplates, mockCampaigns, mockTriggers } from '../data/mock'
import type { Template, ChannelType } from '../types'

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const

const campaignStatusLabel: Record<string, string> = {
  Active: 'Đang chạy', Draft: 'Nháp', Pending: 'Chờ duyệt', Paused: 'Tạm dừng', Ended: 'Đã kết thúc',
}

export function TemplateManagement() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [templates, setTemplates] = useState<Template[]>(mockTemplates)
  const [search, setSearch] = useState('')
  const [channelFilter, setChannelFilter] = useState<ChannelType | 'Tất cả'>('Tất cả')
  const [statusFilter, setStatusFilter] = useState<'Tất cả' | 'Active' | 'Inactive'>('Tất cả')
  const [disableTarget, setDisableTarget] = useState<Template | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Template | null>(null)
  const [usagePopup, setUsagePopup] = useState<Template | null>(null)
  const [pageSize, setPageSize] = useState(20)

  // Sắp xếp phẳng theo số lần dùng nhiều nhất — không nhóm theo Trigger (URD v4.3: cột Trigger
  // riêng thay cho nhóm collapsible, giống cách Campaign List hiển thị cột Trigger).
  const filtered = templates
    .filter(t => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
      const matchChannel = channelFilter === 'Tất cả' || t.channels.includes(channelFilter as ChannelType)
      const matchStatus = statusFilter === 'Tất cả' || t.status === statusFilter
      return matchSearch && matchChannel && matchStatus
    })
    .sort((a, b) => b.usageCount - a.usageCount)

  const changePageSize = (size: number) => setPageSize(size)
  const handleFilter = (fn: () => void) => { fn() }

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
      toast('Đã bật mẫu tin nhắn', 'success')
    }
  }

  const confirmDisable = () => {
    if (!disableTarget) return
    setTemplates(prev => prev.map(x => x.id === disableTarget.id ? { ...x, status: 'Inactive' } : x))
    toast('Đã tắt mẫu tin nhắn', 'success')
    setDisableTarget(null)
  }

  const channelDots = (channels: ChannelType[]) =>
    channels.map(ch => (
      <span key={ch} className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 text-xs">{ch}</span>
    ))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Mẫu tin nhắn</h1>
        <Button variant="primary" onClick={() => navigate('/templates/new')}>
          <Plus size={14} /> Tạo Mẫu tin nhắn
        </Button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => handleFilter(() => setSearch(e.target.value))}
            placeholder="Tìm tên mẫu tin nhắn..."
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
          <option value="Active">Hoạt động</option>
          <option value="Inactive">Không hoạt động</option>
        </select>
      </div>

      {/* Bảng phẳng, sắp xếp theo số lần dùng nhiều nhất — cột Trigger hiển thị tối đa 2 chip +
          "+N ⓘ" popover, cùng pattern với cột Trigger tại Campaign List (URD v4.3, Screen 4A). */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-visible">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100">
            <tr className="text-xs text-slate-500">
              <th className="text-left px-4 py-2 font-medium">Tên Mẫu tin nhắn</th>
              <th className="text-left px-4 py-2 font-medium">Sự kiện kích hoạt</th>
              <th className="text-left px-4 py-2 font-medium">Kênh hỗ trợ</th>
              <th className="text-left px-4 py-2 font-medium">Trạng thái</th>
              <th className="text-left px-4 py-2 font-medium">Dùng</th>
              <th className="text-right px-4 py-2 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(t => {
              const trig = t.triggerCode ? mockTriggers.find(x => x.code === t.triggerCode) : undefined
              return (
                <tr key={t.id} className={`hover:bg-slate-50 ${t.status === 'Inactive' ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{t.name}</td>
                  <td className="px-4 py-2.5">
                    {t.triggerCode ? (
                      <span title={trig ? `${trig.name}\n${trig.source} · ${trig.type}` : t.triggerCode} className="cursor-default">
                        <TriggerChip code={t.triggerCode} />
                      </span>
                    ) : (
                      <span className="text-slate-400">–</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="flex gap-1 flex-wrap">{channelDots(t.channels)}</div>
                  </td>
                  <td className="px-4 py-2.5">
                    {t.status === 'Active'
                      ? <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500" />Hoạt động</span>
                      : <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded-full px-2 py-0.5"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Không hoạt động</span>
                    }
                  </td>
                  <td className="px-4 py-2.5 relative">
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
                          <div className="font-medium text-slate-700 mb-2">Chiến dịch sử dụng mẫu tin nhắn này:</div>
                          <div className="space-y-1.5">
                            {campaigns.map(c => (
                              <div key={c.id} className="flex items-center justify-between gap-2">
                                <span className="text-slate-700 truncate">{c.name}</span>
                                <span className={`flex-shrink-0 font-medium ${statusColor[c.status]}`}>{campaignStatusLabel[c.status] ?? c.status}</span>
                              </div>
                            ))}
                            {campaigns.length === 0 && <div className="text-slate-400 italic">Chưa có chiến dịch nào</div>}
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
                      <Button size="sm" variant="ghost"
                        onClick={() => setDeleteTarget(t)}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={12} /> Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">
                  Không có mẫu tin nhắn nào phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{filtered.length} mẫu tin nhắn</span>
          <select
            value={pageSize}
            onChange={e => changePageSize(Number(e.target.value))}
            className="border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none"
          >
            {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}/trang</option>)}
          </select>
        </div>
      </div>

      <Dialog open={!!disableTarget} onClose={() => setDisableTarget(null)} title="Tắt mẫu tin nhắn?">
        <p className="text-sm text-slate-600">
          Tắt mẫu nội dung? Mẫu sẽ không hiện trong danh sách chọn khi tạo chiến dịch.
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setDisableTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={confirmDisable}>Tắt</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xóa mẫu tin nhắn?">
        {deleteTarget && deleteTarget.usageCount > 0 ? (
          <div className="text-sm text-slate-600 space-y-2">
            <p>
              Mẫu tin nhắn <strong>{deleteTarget.name}</strong> đang được <strong>{deleteTarget.usageCount} chiến dịch</strong> sử dụng:
            </p>
            <ul className="list-disc pl-5 space-y-0.5 text-xs">
              {mockCampaigns.filter(c => c.templateIds?.includes(deleteTarget.id)).map(c => (
                <li key={c.id}>{c.name} <span className="text-slate-400">({campaignStatusLabel[c.status] ?? c.status})</span></li>
              ))}
            </ul>
            <p>Xóa mẫu tin nhắn khỏi thư viện sẽ <strong>không ảnh hưởng</strong> đến nội dung các chiến dịch này (nội dung đã được lưu riêng vào từng chiến dịch khi chọn mẫu tin nhắn). Xác nhận xóa?</p>
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            Xóa mẫu tin nhắn <strong>{deleteTarget?.name}</strong>? Hành động này không thể hoàn tác.
          </p>
        )}
        <DialogActions>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={() => {
            if (!deleteTarget) return
            setTemplates(prev => prev.filter(x => x.id !== deleteTarget.id))
            toast('Đã xóa mẫu tin nhắn ✓', 'success')
            setDeleteTarget(null)
          }}>Xóa</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

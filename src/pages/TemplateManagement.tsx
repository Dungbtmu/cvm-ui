import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Copy, Eye, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { mockTemplates, mockCampaigns, mockTriggers } from '../data/mock'
import type { Template, ChannelType } from '../types'

const PAGE_SIZE_OPTIONS = [20, 50, 100] as const
// Nhóm dùng để gom template chưa gắn Trigger nào — luôn hiển thị cuối cùng (URD UC-TPL-00 STT 1).
const UNGROUPED_KEY = '__ungrouped__'

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
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const [pageSize, setPageSize] = useState(20)

  const filtered = templates
    .filter(t => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase())
      const matchChannel = channelFilter === 'Tất cả' || t.channels.includes(channelFilter as ChannelType)
      const matchStatus = statusFilter === 'Tất cả' || t.status === statusFilter
      return matchSearch && matchChannel && matchStatus
    })
    .sort((a, b) => b.usageCount - a.usageCount)

  // Nhóm theo Trigger áp dụng — template gắn nhiều Trigger xuất hiện lặp lại ở từng nhóm tương ứng;
  // template chưa gắn Trigger nào rơi vào nhóm UNGROUPED_KEY, luôn hiển thị cuối (URD UC-TPL-00).
  const groups: { key: string; code: string; name: string; templates: Template[] }[] = []
  const groupIndex = new Map<string, number>()
  for (const t of filtered) {
    const codes = t.triggerCodes && t.triggerCodes.length > 0 ? t.triggerCodes : [UNGROUPED_KEY]
    for (const code of codes) {
      if (!groupIndex.has(code)) {
        const trigger = mockTriggers.find(tr => tr.code === code)
        groups.push({
          key: code,
          code: code === UNGROUPED_KEY ? '' : code,
          name: code === UNGROUPED_KEY ? 'Chưa gắn Trigger' : (trigger?.name ?? code),
          templates: [],
        })
        groupIndex.set(code, groups.length - 1)
      }
      groups[groupIndex.get(code)!].templates.push(t)
    }
  }
  groups.sort((a, b) => (a.key === UNGROUPED_KEY ? 1 : b.key === UNGROUPED_KEY ? -1 : 0))

  const changePageSize = (size: number) => setPageSize(size)
  const handleFilter = (fn: () => void) => { fn() }
  const toggleGroup = (key: string) => setCollapsedGroups(prev => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key); else next.add(key)
    return next
  })

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
          <option value="Active">Hoạt động</option>
          <option value="Inactive">Không hoạt động</option>
        </select>
      </div>

      {/* Danh sách nhóm theo Trigger áp dụng (URD UC-TPL-00) — mỗi nhóm 1 khối collapsible; nhóm
          "Chưa gắn Trigger" luôn ở cuối; template gắn nhiều Trigger lặp lại ở từng nhóm tương ứng.
          Không phân trang theo trang số — URD không đặc tả pagination cho chế độ nhóm; thay vào đó
          giữ dropdown số dòng/trang chỉ mang tính hiển thị số lượng gợi ý, danh sách hiển thị đầy đủ
          theo nhóm để không cắt ngang một nhóm giữa 2 trang. */}
      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg px-4 py-8 text-center text-slate-400 text-sm">
          Không có template nào phù hợp
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map(group => {
            const isCollapsed = collapsedGroups.has(group.key)
            return (
              <div key={group.key} className="bg-white border border-slate-200 rounded-lg overflow-visible">
                <button onClick={() => toggleGroup(group.key)}
                  className="w-full flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200 text-left hover:bg-slate-100">
                  {isCollapsed ? <ChevronRight size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                  <span className="text-sm font-semibold text-slate-700">
                    {group.key === UNGROUPED_KEY
                      ? 'Chưa gắn Trigger'
                      : `${group.code} · ${group.name}`}
                  </span>
                  <span className="text-xs text-slate-400">({group.templates.length})</span>
                </button>
                {!isCollapsed && (
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-100">
                      <tr className="text-xs text-slate-500">
                        <th className="text-left px-4 py-2 font-medium">Tên Template</th>
                        <th className="text-left px-4 py-2 font-medium">Kênh hỗ trợ</th>
                        <th className="text-left px-4 py-2 font-medium">Trạng thái</th>
                        <th className="text-left px-4 py-2 font-medium">Dùng</th>
                        <th className="text-right px-4 py-2 font-medium">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {group.templates.map(t => (
                        <tr key={`${group.key}-${t.id}`} className={`hover:bg-slate-50 ${t.status === 'Inactive' ? 'opacity-50' : ''}`}>
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
                              <Button size="sm" variant="ghost" disabled={t.usageCount > 0}
                                title={t.usageCount > 0 ? `Không thể xóa — template đang được ${t.usageCount} campaign sử dụng (kể cả Draft/Ended)` : undefined}
                                onClick={() => setDeleteTarget(t)}
                                className={t.usageCount === 0 ? 'text-red-500 hover:bg-red-50' : ''}
                              >
                                <Trash2 size={12} /> Xóa
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )
          })}
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>{filtered.length} template</span>
            <select
              value={pageSize}
              onChange={e => changePageSize(Number(e.target.value))}
              className="border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}/trang</option>)}
            </select>
          </div>
        </div>
      )}

      <Dialog open={!!disableTarget} onClose={() => setDisableTarget(null)} title="Tắt template?">
        <p className="text-sm text-slate-600">
          Tắt mẫu nội dung? Mẫu sẽ không hiện trong danh sách chọn khi tạo campaign.
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setDisableTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={confirmDisable}>Tắt</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xóa template?">
        <p className="text-sm text-slate-600">
          Xóa template <strong>{deleteTarget?.name}</strong>? Hành động này không thể hoàn tác.
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={() => {
            if (!deleteTarget) return
            setTemplates(prev => prev.filter(x => x.id !== deleteTarget.id))
            toast('Đã xóa template ✓', 'success')
            setDeleteTarget(null)
          }}>Xóa</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

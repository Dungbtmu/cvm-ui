import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { StatusBadge, TriggerChip } from '../components/ui/Badge'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { mockCampaigns, mockTriggers } from '../data/mock'
import { reactivateBlockReason, reactivateFlow, sortCampaignsForList, isBeforeStart } from '../lib/utils'
import type { Campaign, CampaignStatus } from '../types'

const statusFilters: CampaignStatus[] = ['Active', 'Draft', 'Pending', 'Paused', 'Ended']
const statusLabel: Record<CampaignStatus, string> = {
  Active: 'Đang chạy', Draft: 'Nháp', Pending: 'Chờ duyệt', Paused: 'Tạm dừng', Ended: 'Đã kết thúc',
}

export function CampaignList() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns)
  const [search, setSearch] = useState('')
  const [activeFilters, setActiveFilters] = useState<CampaignStatus[]>([])

  const [confirmStop, setConfirmStop] = useState<Campaign | null>(null)
  const [tooltipCampaign, setTooltipCampaign] = useState<string | null>(null)
  const [confirmActivatePending, setConfirmActivatePending] = useState<Campaign | null>(null)
  const [editingPriority, setEditingPriority] = useState<string | null>(null)
  const [priorityDraft, setPriorityDraft] = useState('')
  const [confirmPriorityChange, setConfirmPriorityChange] = useState<{ campaign: Campaign; newPriority: number } | null>(null)

  const toggleFilter = (f: CampaignStatus) =>
    setActiveFilters(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])

  const filtered = sortCampaignsForList(campaigns.filter(c => {
    const matchSearch =
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.triggers.some(t => t.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = activeFilters.length === 0 || activeFilters.includes(c.status)
    return matchSearch && matchStatus
  }))

  const handleStop = (c: Campaign) => setConfirmStop(c)
  const handleStopConfirm = () => {
    if (!confirmStop) return
    setCampaigns(prev => prev.map(c => c.id === confirmStop.id ? { ...c, status: 'Paused' as CampaignStatus } : c))
    toast('Campaign đã dừng', 'warning')
    setConfirmStop(null)
  }
  // [Bật] campaign Paused — 3 nhánh theo UC-CAM-07: blocked (còn cờ vô hiệu, xử lý ở nút disabled),
  // toPending (param/điều kiện lọc trigger bị Sửa trong lúc Paused → confirm rồi về Chờ duyệt),
  // toActive (không thay đổi gì → bật thẳng, không cần confirm — hành vi cũ)
  const handleActivate = (c: Campaign) => {
    const flow = reactivateFlow(c)
    if (flow === 'blocked') return
    if (flow === 'toPending') { setConfirmActivatePending(c); return }
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: 'Active' as CampaignStatus } : x))
    toast('Campaign đã kích hoạt lại', 'success')
  }
  const confirmActivateToPending = () => {
    if (!confirmActivatePending) return
    setCampaigns(prev => prev.map(x => x.id === confirmActivatePending.id
      ? { ...x, status: 'Pending' as CampaignStatus, pausedConfigChanged: false }
      : x))
    toast('Đã chuyển về Chờ duyệt để Admin xác nhận lại', 'warning')
    setConfirmActivatePending(null)
  }

  // Sửa priority inline trên Campaign List — chỉ campaign Active. Xác nhận đổi → chuyển về Pending
  // để Admin xác nhận lại (khác Priority Matrix, nơi Admin tự sắp xếp không cần duyệt lại).
  const startEditPriority = (c: Campaign) => {
    setEditingPriority(c.id)
    setPriorityDraft(String(c.priority))
  }
  const commitPriorityEdit = (c: Campaign) => {
    const newPriority = Number(priorityDraft)
    setEditingPriority(null)
    if (!Number.isInteger(newPriority) || newPriority < 1 || newPriority === c.priority) return
    setConfirmPriorityChange({ campaign: c, newPriority })
  }
  const confirmPriorityChangeApply = () => {
    if (!confirmPriorityChange) return
    const { campaign: c, newPriority } = confirmPriorityChange
    setCampaigns(prev => prev.map(x => x.id === c.id
      ? { ...x, priority: newPriority, status: 'Pending' as CampaignStatus }
      : x))
    toast('Đã đổi độ ưu tiên — campaign chuyển về Chờ duyệt', 'warning')
    setConfirmPriorityChange(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Campaign</h1>
        <Button variant="primary" onClick={() => navigate('/campaigns/new')}>
          <Plus size={14} /> Tạo Campaign
        </Button>
      </div>

      {/* Search + filter */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên campaign, mã hoặc trigger code..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">FILTER:</span>
          {statusFilters.map(f => (
            <button key={f} onClick={() => toggleFilter(f)}
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                activeFilters.includes(f) ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600'
              }`}>
              {statusLabel[f]}
            </button>
          ))}
          {activeFilters.length > 0 && (
            <button onClick={() => setActiveFilters([])}
              className="text-xs text-slate-400 hover:text-slate-600 underline">
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-visible">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Tên / Mã Campaign</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Trigger</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Hiệu lực</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Ưu tiên</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Trạng thái</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-800">{c.name}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">{c.code}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1 items-center">
                    {c.triggers.slice(0, 2).map(t => {
                      const trig = mockTriggers.find(x => x.code === t)
                      return (
                        <span
                          key={t}
                          title={trig ? `${trig.name}\n${trig.source} · ${trig.type}` : t}
                          className="cursor-default"
                        >
                          <TriggerChip code={t} />
                        </span>
                      )
                    })}
                    {c.triggers.length > 2 && (
                      <div className="relative">
                        <button
                          onClick={() => setTooltipCampaign(tooltipCampaign === c.id ? null : c.id)}
                          className="text-xs text-slate-500 hover:text-blue-600 border border-slate-200 rounded-full px-1.5 py-0.5"
                        >
                          +{c.triggers.length - 2} ⓘ
                        </button>
                        {tooltipCampaign === c.id && (
                          <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 min-w-72 w-80">
                            <div className="px-3 pt-2.5 pb-1.5 border-b border-slate-100 text-xs font-medium text-slate-500">
                              Tất cả trigger ({c.triggers.length})
                            </div>
                            <div className="max-h-64 overflow-y-auto divide-y divide-slate-50">
                              {c.triggers.map(code => {
                                const trig = mockTriggers.find(t => t.code === code)
                                return (
                                  <div key={code} className="px-3 py-2 text-xs space-y-0.5">
                                    <div className="font-mono text-amber-700 font-medium">{code}</div>
                                    <div className="text-slate-600">{trig?.name ?? '—'}</div>
                                    <div className="text-slate-400">{trig?.source ?? '—'} · {trig?.type ?? '—'}</div>
                                  </div>
                                )
                              })}
                            </div>
                            <div className="px-3 py-1.5 border-t border-slate-100">
                              <button onClick={() => setTooltipCampaign(null)} className="text-xs text-slate-400 hover:text-slate-600">Đóng</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">
                  {c.startDate} – {c.isInfinite ? 'Vô hạn' : c.endDate}
                </td>
                <td className="px-4 py-3">
                  {c.status === 'Active' ? (
                    editingPriority === c.id ? (
                      <input
                        type="number"
                        autoFocus
                        value={priorityDraft}
                        min={1}
                        onChange={e => setPriorityDraft(e.target.value)}
                        onBlur={() => commitPriorityEdit(c)}
                        onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                        className="w-16 px-1.5 py-1 text-xs border border-blue-300 rounded focus:outline-none"
                      />
                    ) : (
                      <button
                        onClick={() => startEditPriority(c)}
                        className="text-xs text-slate-700 hover:text-blue-600 hover:underline px-1.5 py-1 rounded"
                        title="Nhấn để sửa độ ưu tiên"
                      >
                        {c.priority}
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-slate-400">{c.priority}</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <StatusBadge status={c.status} />
                    {c.status === 'Active' && isBeforeStart(c) && (
                      <span className="text-xs bg-slate-100 text-slate-500 rounded-full px-2 py-0.5 whitespace-nowrap">
                        ⏳ Chưa tới ngày bắt đầu
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 justify-end">
                    <Button size="sm" onClick={() => navigate(`/campaigns/${c.id}/detail`)}>Xem</Button>
                    {c.status === 'Draft' && (
                      <Button size="sm" variant="outline" onClick={() => navigate(`/campaigns/${c.id}/edit`)}>Sửa</Button>
                    )}
                    {c.status === 'Active' && (
                      <Button size="sm" variant="danger" onClick={() => handleStop(c)}>Dừng</Button>
                    )}
                    {c.status === 'Paused' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/campaigns/${c.id}/edit`)}>Sửa</Button>
                        {(() => {
                          const blockReason = reactivateBlockReason(c)
                          return (
                            <span title={blockReason ?? undefined} className="inline-flex">
                              <Button size="sm" variant="success" disabled={!!blockReason} onClick={() => handleActivate(c)}>Bật</Button>
                            </span>
                          )
                        })()}
                      </>
                    )}
                    {c.status === 'Ended' && (
                      <span className="text-xs text-slate-400 italic">Đã kết thúc</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                  Không có campaign nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{filtered.length} campaign</span>
          <div className="flex items-center gap-2">
            <button className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50">‹</button>
            <span className="px-2 py-1 bg-blue-500 text-white rounded">1</span>
            <button className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50">›</button>
            <select className="border border-slate-200 rounded px-2 py-1 focus:outline-none">
              <option>20/trang</option>
              <option>50/trang</option>
            </select>
          </div>
        </div>
      </div>

      <Dialog open={!!confirmStop} onClose={() => setConfirmStop(null)} title="Dừng campaign?">
        <p className="text-sm text-slate-600">
          Tin nhắn đang trong hàng chờ sẽ bị hủy. Không thể hoàn tác.
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setConfirmStop(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleStopConfirm}>Xác nhận Dừng</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmActivatePending} onClose={() => setConfirmActivatePending(null)} title="Bật lại campaign?">
        <p className="text-sm text-slate-600">
          Trigger đang dùng đã bị Admin sửa tham số/điều kiện lọc trong lúc campaign tạm dừng. Bật lại sẽ
          chuyển campaign về <strong>Chờ duyệt</strong> để Admin xác nhận lại cấu hình mới, thay vì kích hoạt thẳng.
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setConfirmActivatePending(null)}>Hủy</Button>
          <Button variant="primary" onClick={confirmActivateToPending}>Xác nhận</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmPriorityChange} onClose={() => setConfirmPriorityChange(null)} title="Thay đổi độ ưu tiên?">
        <p className="text-sm text-slate-600">
          Thay đổi độ ưu tiên sẽ chuyển campaign về <strong>Chờ duyệt</strong> để Admin xác nhận lại
          {confirmPriorityChange && (
            <> — từ <strong>{confirmPriorityChange.campaign.priority}</strong> thành <strong>{confirmPriorityChange.newPriority}</strong>.</>
          )}
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setConfirmPriorityChange(null)}>Hủy</Button>
          <Button variant="primary" onClick={confirmPriorityChangeApply}>Xác nhận</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

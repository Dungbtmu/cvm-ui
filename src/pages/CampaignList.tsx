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
  const [confirmUnlockResume, setConfirmUnlockResume] = useState<Campaign | null>(null)
  const [editingPriority, setEditingPriority] = useState<string | null>(null)
  const [priorityDraft, setPriorityDraft] = useState('')
  const [priorityErr, setPriorityErr] = useState('')
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
    toast('Chiến dịch đã dừng', 'warning')
    setConfirmStop(null)
  }
  // [Bật] campaign Paused — 4 nhánh theo UC-CAM-07 (V4.13 bổ sung nhánh Mở khóa): blocked (param/điều
  // kiện lọc VẪN đang Khóa, xử lý ở nút disabled), toPrePauseStatus (còn cờ nhưng đã Mở khóa lại →
  // confirm rồi về đúng trạng thái gốc trước khi tự Paused, không tự Active thẳng), toPending (param/
  // điều kiện lọc trigger bị Sửa trong lúc Paused → confirm rồi về Chờ duyệt), toActive (không thay
  // đổi gì → bật thẳng, không cần confirm — hành vi cũ)
  const handleActivate = (c: Campaign) => {
    const flow = reactivateFlow(c)
    if (flow === 'blocked') return
    if (flow === 'toPrePauseStatus') { setConfirmUnlockResume(c); return }
    if (flow === 'toPending') { setConfirmActivatePending(c); return }
    setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, status: 'Active' as CampaignStatus } : x))
    toast('Chiến dịch đã kích hoạt lại', 'success')
  }
  const confirmActivateToPending = () => {
    if (!confirmActivatePending) return
    setCampaigns(prev => prev.map(x => x.id === confirmActivatePending.id
      ? { ...x, status: 'Pending' as CampaignStatus, pausedConfigChanged: false }
      : x))
    toast('Đã chuyển về Chờ duyệt để Quản trị viên xác nhận lại', 'warning')
    setConfirmActivatePending(null)
  }
  // Nhánh Mở khóa (URD UC-CAM-07 nhánh 1c, V4.13) — trả về đúng trạng thái gốc trước khi tự Paused,
  // gỡ cờ paramInvalid/filterInvalid; không tự động Active thẳng nếu gốc là Pending.
  const confirmActivateUnlockResume = () => {
    if (!confirmUnlockResume) return
    const target = confirmUnlockResume.prePauseStatus ?? 'Active'
    setCampaigns(prev => prev.map(x => x.id === confirmUnlockResume.id
      ? { ...x, status: target, paramInvalid: undefined, filterInvalid: undefined, prePauseStatus: undefined }
      : x))
    toast(target === 'Pending' ? 'Đã chuyển về Chờ duyệt để Quản trị viên xác nhận lại' : 'Chiến dịch đã kích hoạt lại',
      target === 'Pending' ? 'warning' : 'success')
    setConfirmUnlockResume(null)
  }

  // Sửa priority inline trên Campaign List — áp dụng cho campaign Active và Draft.
  // Active: xác nhận đổi → chuyển về Pending để Admin xác nhận lại (khác Priority Matrix,
  // nơi Admin tự sắp xếp không cần duyệt lại). Draft: chưa từng qua duyệt nên lưu ngay,
  // không confirm dialog, không đổi trạng thái.
  const startEditPriority = (c: Campaign) => {
    setEditingPriority(c.id)
    setPriorityDraft(String(c.priority))
    setPriorityErr('')
  }
  // Validate: số nguyên dương 1–9999, cùng ngưỡng với Campaign Builder (URD Screen 3 STT 5,
  // Screen 2 STT 7 v4.11) — sai định dạng/ngoài khoảng thì giữ edit mode, không âm thầm bỏ qua.
  const commitPriorityEdit = (c: Campaign) => {
    const newPriority = Number(priorityDraft)
    if (!Number.isInteger(newPriority) || newPriority < 1 || newPriority > 9999) {
      setPriorityErr('Độ ưu tiên phải là số nguyên từ 1 đến 9999')
      return
    }
    if (newPriority !== c.priority) {
      // Không cho trùng độ ưu tiên với campaign Active khác (URD UC-CAM-01 V4.14) — thống nhất với
      // Campaign Builder (chặn tại Gửi duyệt) và Priority Matrix (chặn cứng). Draft không tham gia
      // so trùng vì chưa giữ vị trí xếp hạng thật.
      const dup = campaigns.find(x => x.id !== c.id && x.status === 'Active' && x.priority === newPriority)
      if (dup) {
        setPriorityErr(`Độ ưu tiên ${newPriority} đã được dùng bởi campaign ${dup.name} — vui lòng chọn số khác`)
        return
      }
    }
    setEditingPriority(null)
    setPriorityErr('')
    if (newPriority === c.priority) return
    if (c.status === 'Draft') {
      setCampaigns(prev => prev.map(x => x.id === c.id ? { ...x, priority: newPriority } : x))
      toast('Đã cập nhật độ ưu tiên ✓', 'success')
      return
    }
    setConfirmPriorityChange({ campaign: c, newPriority })
  }
  const confirmPriorityChangeApply = () => {
    if (!confirmPriorityChange) return
    const { campaign: c, newPriority } = confirmPriorityChange
    setCampaigns(prev => prev.map(x => x.id === c.id
      ? { ...x, priority: newPriority, status: 'Pending' as CampaignStatus }
      : x))
    toast('Đã đổi độ ưu tiên — chiến dịch chuyển về Chờ duyệt', 'warning')
    setConfirmPriorityChange(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Chiến dịch</h1>
        <Button variant="primary" onClick={() => navigate('/campaigns/new')}>
          <Plus size={14} /> Tạo Chiến dịch
        </Button>
      </div>

      {/* Search + filter */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm tên chiến dịch, mã hoặc mã sự kiện kích hoạt..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500 font-medium">BỘ LỌC:</span>
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
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Tên / Mã Chiến dịch</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase tracking-wide">Sự kiện kích hoạt</th>
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
                              Tất cả sự kiện kích hoạt ({c.triggers.length})
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
                  {c.status === 'Active' || c.status === 'Draft' ? (
                    editingPriority === c.id ? (
                      <div>
                        <input
                          type="number"
                          autoFocus
                          value={priorityDraft}
                          min={1}
                          max={9999}
                          onChange={e => { setPriorityDraft(e.target.value); setPriorityErr('') }}
                          onBlur={() => commitPriorityEdit(c)}
                          onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                          className={`w-16 px-1.5 py-1 text-xs border rounded focus:outline-none ${priorityErr ? 'border-red-400 bg-red-50' : 'border-blue-300'}`}
                        />
                        {priorityErr && <div className="text-[10px] text-red-500 mt-0.5 w-32">{priorityErr}</div>}
                      </div>
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
                  Không có chiến dịch nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{filtered.length} chiến dịch</span>
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

      <Dialog open={!!confirmStop} onClose={() => setConfirmStop(null)} title="Dừng chiến dịch?">
        <p className="text-sm text-slate-600">
          Tin nhắn đang trong hàng chờ sẽ bị hủy. Không thể hoàn tác.
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setConfirmStop(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleStopConfirm}>Xác nhận Dừng</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmActivatePending} onClose={() => setConfirmActivatePending(null)} title="Bật lại chiến dịch?">
        <p className="text-sm text-slate-600">
          Sự kiện kích hoạt đang dùng đã bị Quản trị viên sửa tham số/điều kiện lọc trong lúc chiến dịch tạm dừng. Bật lại sẽ
          chuyển chiến dịch về <strong>Chờ duyệt</strong> để Quản trị viên xác nhận lại cấu hình mới, thay vì kích hoạt thẳng.
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setConfirmActivatePending(null)}>Hủy</Button>
          <Button variant="primary" onClick={confirmActivateToPending}>Xác nhận</Button>
        </DialogActions>
      </Dialog>

      {/* Nhánh Mở khóa (UC-CAM-07 nhánh 1c, V4.13) — param/điều kiện lọc đã được Admin mở khóa lại,
          [Bật] trả về đúng trạng thái gốc trước khi tự tạm dừng, không tự động Active thẳng */}
      <Dialog open={!!confirmUnlockResume} onClose={() => setConfirmUnlockResume(null)} title="Bật lại chiến dịch?">
        <p className="text-sm text-slate-600">
          Tham số/điều kiện lọc đã được Quản trị viên mở khóa. Chiến dịch sẽ quay về{' '}
          <strong>{confirmUnlockResume?.prePauseStatus === 'Pending' ? 'Chờ duyệt' : 'Đang chạy'}</strong>{' '}
          — trạng thái trước khi tạm dừng.
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setConfirmUnlockResume(null)}>Hủy</Button>
          <Button variant="primary" onClick={confirmActivateUnlockResume}>Xác nhận</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!confirmPriorityChange} onClose={() => setConfirmPriorityChange(null)} title="Thay đổi độ ưu tiên?">
        <p className="text-sm text-slate-600">
          Thay đổi độ ưu tiên sẽ chuyển chiến dịch về <strong>Chờ duyệt</strong> để Quản trị viên xác nhận lại
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

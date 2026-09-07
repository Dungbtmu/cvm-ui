import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { mockCampaigns } from '../data/mock'
import type { Campaign } from '../types'
import { TriggerAdmin } from './TriggerAdmin'

export function AdminScreen() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState(0)
  const [campaigns, setCampaigns] = useState<Campaign[]>(mockCampaigns.filter(c => c.status === 'Pending'))
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [approveTarget, setApproveTarget] = useState<Campaign | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Campaign | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const filtered = campaigns.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const changePage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)))
  const changePageSize = (size: number) => { setPageSize(size); setPage(1) }

  const handleApprove = () => {
    if (!approveTarget) return
    setCampaigns(prev => prev.filter(c => c.id !== approveTarget.id))
    toast('Đã duyệt ✓', 'success')
    setApproveTarget(null)
  }

  // Không cho Phê duyệt (Pending → Active) nếu độ ưu tiên trùng campaign Active khác — lỗ hổng thứ 4
  // trong chuỗi chặn trùng priority (URD UC-CAM-05 V4.15): thời điểm campaign thực sự tham gia xếp
  // hạng là lúc Phê duyệt, không phải lúc Gửi duyệt (đã chặn ở Campaign Builder, V4.14). Admin không
  // tự sửa priority tại đây — chỉ [Từ chối] để QTV sửa lại, [Từ chối] vẫn là action tự quyết định
  // bình thường, không bị ép buộc.
  const findPriorityConflict = (c: Campaign) =>
    mockCampaigns.find(x => x.id !== c.id && x.status === 'Active' && x.priority === c.priority)

  const rejectReasonErr = rejectReason.trim().length > 0 && rejectReason.trim().length < 10
  const canReject = rejectReason.trim().length >= 10

  const handleReject = () => {
    if (!rejectTarget || !canReject) return
    setCampaigns(prev => prev.filter(c => c.id !== rejectTarget.id))
    toast('Đã từ chối', 'warning')
    setRejectTarget(null)
    setRejectReason('')
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">Quản trị viên</h1>

      {/* Tab bar */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit">
        {['Duyệt Chiến dịch', 'Sự kiện kích hoạt'].map((t, i) => (
          <button
            key={t}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === i ? 'bg-blue-500 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 0 && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Tìm chiến dịch..."
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <span className="text-sm font-semibold text-slate-700">Chiến dịch chờ duyệt</span>
            </div>
            {filtered.length === 0 ? (
              <div className="px-4 py-12 text-center text-slate-400 text-sm">
                Không có chiến dịch nào chờ duyệt.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-slate-100">
                  <tr className="text-xs text-slate-500">
                    <th className="text-left px-4 py-2 font-medium">Tên / Mã Chiến dịch</th>
                    <th className="text-left px-4 py-2 font-medium">Người tạo</th>
                    <th className="text-left px-4 py-2 font-medium">Gửi duyệt</th>
                    <th className="text-right px-4 py-2 font-medium">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paged.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{c.name}</div>
                        <div className="text-xs text-slate-400 font-mono">{c.code}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{c.owner}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{c.submittedAt ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" onClick={() => navigate(`/campaigns/${c.id}/detail`)}>Xem</Button>
                          <Button size="sm" variant="success" onClick={() => setApproveTarget(c)}>Duyệt</Button>
                          <Button size="sm" variant="danger" onClick={() => { setRejectTarget(c); setRejectReason('') }}>
                            Từ chối
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{filtered.length} chiến dịch</span>
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
                <select value={pageSize} onChange={e => changePageSize(Number(e.target.value))}
                  className="border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none">
                  {[20, 50, 100].map(s => <option key={s} value={s}>{s}/trang</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 1 && <TriggerAdmin />}

      {/* Approve dialog — check trùng độ ưu tiên với campaign Active khác trước khi cho xác nhận
          (URD UC-CAM-05 V4.15, lỗ hổng thứ 4 trong chuỗi chặn trùng priority). Trùng thì đổi hẳn
          nội dung dialog sang cảnh báo, không có nút xác nhận duyệt — chỉ [Đóng]; Admin quay về
          Từ chối để QTV tự sửa priority, không sửa priority ngay tại đây. */}
      {approveTarget && (() => {
        const conflict = findPriorityConflict(approveTarget)
        return (
          <Dialog open onClose={() => setApproveTarget(null)} title={conflict ? 'Không thể duyệt — trùng độ ưu tiên' : 'Duyệt chiến dịch?'}>
            {conflict ? (
              <p className="text-sm text-slate-600">
                Độ ưu tiên <strong>{approveTarget.priority}</strong> của <strong>{approveTarget.name}</strong> đang trùng với campaign <strong>{conflict.name}</strong> đang Active.
                Vui lòng Từ chối để QTV quay về sửa lại độ ưu tiên trước khi gửi duyệt lại.
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                Duyệt chiến dịch <strong>{approveTarget.name}</strong>? Chiến dịch sẽ chuyển sang trạng thái Đang chạy ngay.
              </p>
            )}
            <DialogActions>
              {conflict ? (
                <Button variant="outline" onClick={() => setApproveTarget(null)}>Đóng</Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setApproveTarget(null)}>Hủy</Button>
                  <Button variant="success" onClick={handleApprove}>Duyệt</Button>
                </>
              )}
            </DialogActions>
          </Dialog>
        )
      })()}

      {/* Reject dialog */}
      <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} title="Từ chối chiến dịch">
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Nhập lý do từ chối:</p>
          <textarea
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Mô tả rõ lý do để QTV điều chỉnh... (tối thiểu 10 ký tự)"
            className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:border-blue-400 resize-none ${rejectReasonErr ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
          />
          <div className="flex justify-between mt-1">
            {rejectReasonErr
              ? <span className="text-xs text-red-500">Vui lòng nhập lý do từ chối (tối thiểu 10 ký tự)</span>
              : <span />
            }
            <span className="text-xs text-slate-400">{rejectReason.length}/500</span>
          </div>
        </div>
        <DialogActions>
          <Button variant="outline" onClick={() => setRejectTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleReject} disabled={!canReject}>Từ chối</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { mockCustomers } from '../data/mock'

const historyItems = [
  { date: '10/05 09:32', campaign: 'Chào mừng SIM', channel: 'Zalo OA', result: '✓ Đã chuyển phát', ok: true },
  { date: '08/05 14:10', campaign: 'Nạp thẻ lỗi', channel: 'SMS', result: '✓ Đã chuyển phát', ok: true },
  { date: '07/05 08:45', campaign: 'Hết data', channel: 'Zalo OA', result: '⛔ Bị chặn → Chuyển kênh dự phòng', ok: false },
  { date: '07/05 08:46', campaign: 'Hết data', channel: 'SMS', result: '✓ Đã chuyển phát', ok: true },
  { date: '06/05 10:12', campaign: 'Nhắc nạp tiền', channel: 'Push', result: '✓ Đã chuyển phát', ok: true },
  { date: '05/05 14:30', campaign: 'Nhắc nạp tiền', channel: 'SMS', result: '✓ Đã chuyển phát', ok: true },
  { date: '04/05 09:05', campaign: 'Hết data', channel: 'Push', result: '✓ Đã chuyển phát', ok: true },
  { date: '03/05 11:20', campaign: 'Chào mừng SIM', channel: 'Email', result: '✓ Đã chuyển phát', ok: true },
  { date: '02/05 08:00', campaign: 'Nhắc nạp tiền', channel: 'Zalo OA', result: '⛔ Bị chặn', ok: false },
  { date: '01/05 16:45', campaign: 'Hết data', channel: 'Push', result: '✓ Đã chuyển phát', ok: true },
]

const CHANNELS = ['Tất cả', 'Push', 'Zalo OA', 'SMS', 'Email', 'USSD', 'Banner']
const CAMPAIGNS_FILTER = ['Tất cả', 'Chào mừng SIM', 'Hết data', 'Nhắc nạp tiền']

export function Customer360() {
  const { phone } = useParams()
  const navigate = useNavigate()
  const customer = mockCustomers.find(c => c.phone.replace(/\s/g, '') === phone)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [channelFilter, setChannelFilter] = useState('Tất cả')
  const [campaignFilter, setCampaignFilter] = useState('Tất cả')
  const [page, setPage] = useState(1)

  const filteredHistory = historyItems.filter(h => {
    const matchCh = channelFilter === 'Tất cả' || h.channel === channelFilter
    const matchCamp = campaignFilter === 'Tất cả' || h.campaign === campaignFilter
    return matchCh && matchCamp
  })

  const PER_PAGE = 5
  const totalPages = Math.ceil(filteredHistory.length / PER_PAGE)
  const pagedHistory = filteredHistory.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  return (
    <div className="max-w-4xl">
      <button onClick={() => navigate('/customers')}
        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft size={14} /> Danh sách khách hàng
      </button>

      <h1 className="text-lg font-bold text-slate-800 mb-1">{customer?.name ?? phone}</h1>
      <p className="text-sm text-slate-500 font-mono mb-4">{phone}</p>

      <div className="grid grid-cols-2 gap-4">
        {/* LEFT */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-700">Thông tin khách hàng</div>
            <dl className="space-y-1.5 text-sm">
              {[
                ['Tên khách hàng', customer?.name ?? '—'],
                ['Số điện thoại', phone],
                ['Loại SIM', 'eSIM'],
                ['Trạng thái', 'Hoạt động'],
                ['Gói cước', 'D50 (HH 18/05)'],
                ['Ngày KH SIM', '01/04/2026'],
                ['Thiết bị', 'Android'],
                ['Cài app', 'Chưa'],
                ['Đăng nhập app', 'Chưa'],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <dt className="text-slate-500 w-32 flex-shrink-0">{label}:</dt>
                  <dd className="text-slate-800 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
            <div className="text-sm font-semibold text-slate-700">Thống kê sử dụng</div>
            <dl className="space-y-1.5 text-sm">
              {[
                ['Data còn lại', '85 MB'],
                ['Lưu lượng hôm nay', '320 MB'],
                ['Số dư', '45,000 VND'],
                ['Số lần nạp', '3'],
                ['Số lần gia hạn', '2'],
                ['Cuộc gọi thất bại', '0'],
                ['Ngày sinh nhật', '15/08'],
                ['Nghề nghiệp', 'Nhân viên VP'],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <dt className="text-slate-500 w-32 flex-shrink-0">{label}:</dt>
                  <dd className="text-slate-800 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4">
          {/* Channel status */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-700">Trạng thái kênh (đồng bộ ngược)</div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-slate-500 border-b border-slate-100">
                  <th className="text-left pb-2 font-medium">Kênh</th>
                  <th className="text-left pb-2 font-medium">Trạng thái</th>
                  <th className="text-left pb-2 font-medium">Cập nhật</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { ch: 'Zalo OA', status: '⛔ Bị chặn', date: '05/05 09:32', ok: false },
                  { ch: 'SMS', status: '✅ Hoạt động', date: '—', ok: true },
                  { ch: 'USSD', status: '✅ Hoạt động', date: '—', ok: true },
                  { ch: 'Push', status: '✅ Hoạt động', date: '—', ok: true },
                ].map((c, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-1.5 text-slate-700">{c.ch}</td>
                    <td className={`py-1.5 text-xs font-medium ${c.ok ? 'text-green-600' : 'text-red-500'}`}>{c.status}</td>
                    <td className="py-1.5 text-xs text-slate-400">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1.5">
              ⓘ Tự cập nhật từ phản hồi Cổng gửi tin. Đặt lại về Hoạt động khi khách hàng bỏ chặn.
            </div>
          </div>

          {/* Throttling */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
            <div className="text-sm font-semibold text-slate-700">Giới hạn tần suất gửi</div>
            <dl className="space-y-1.5 text-sm">
              {[
                ['Tin nhắn hôm nay', '2 / 3 (còn 1)'],
                ['Đang trong thời gian nghỉ', 'Không'],
                ['Cờ DNC từ BSS', 'Không'],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <dt className="text-slate-500 w-36 flex-shrink-0">{label}:</dt>
                  <dd className="text-slate-800 font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Segments */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-2">
            <div className="text-sm font-semibold text-slate-700">Phân khúc</div>
            <div className="flex gap-2 flex-wrap">
              {['Gen Z User', 'Sắp hết data'].map(seg => (
                <span key={seg} className="bg-blue-100 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-medium">{seg}</span>
              ))}
            </div>
          </div>

          {/* History (short) */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-700">Lịch sử nhận tin</div>
            <div className="space-y-3">
              {historyItems.slice(0, 4).map((h, i) => (
                <div key={i} className="text-sm border-b border-slate-50 pb-2">
                  <div className="text-xs text-slate-400">{h.date}</div>
                  <div className="font-medium text-slate-700">{h.campaign}</div>
                  <div className={`text-xs ${h.ok ? 'text-green-600' : 'text-red-500'}`}>
                    {h.channel} · {h.result}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setHistoryOpen(true)}
              className="text-xs text-blue-500 hover:text-blue-700"
            >
              Xem đầy đủ lịch sử →
            </button>
          </div>
        </div>
      </div>

      {/* Slide-in history panel */}
      {historyOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setHistoryOpen(false)}
          />
          {/* Panel */}
          <div className="fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-50 flex flex-col">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <div>
                <div className="font-semibold text-slate-800">Lịch sử nhận tin</div>
                <div className="text-xs text-slate-500">{phone}</div>
              </div>
              <button onClick={() => setHistoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            {/* Filters */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap bg-slate-50">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Kênh:</span>
                <select value={channelFilter} onChange={e => { setChannelFilter(e.target.value); setPage(1) }}
                  className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none">
                  {CHANNELS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500">Chiến dịch:</span>
                <select value={campaignFilter} onChange={e => { setCampaignFilter(e.target.value); setPage(1) }}
                  className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none">
                  {CAMPAIGNS_FILTER.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* History list */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {pagedHistory.length === 0 ? (
                <div className="text-sm text-slate-400 text-center py-8">Không có lịch sử phù hợp</div>
              ) : (
                pagedHistory.map((h, i) => (
                  <div key={i} className="border border-slate-100 rounded-lg p-3 text-sm space-y-0.5">
                    <div className="text-xs text-slate-400">{h.date}</div>
                    <div className="font-medium text-slate-700">{h.campaign}</div>
                    <div className={`text-xs ${h.ok ? 'text-green-600' : 'text-red-500'}`}>
                      {h.channel} · {h.result}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Pagination */}
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>{filteredHistory.length} bản ghi</span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40">‹</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-2 py-1 rounded border ${page === p ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-200 hover:bg-slate-50'}`}>
                    {p}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-40">›</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

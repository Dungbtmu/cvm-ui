import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { StatusBadge, TriggerChip } from '../components/ui/Badge'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { mockCampaigns } from '../data/mock'
import type { ChannelType, CampaignStatus } from '../types'

const CHANNELS: ChannelType[] = ['Push', 'Zalo OA', 'SMS', 'Banner', 'Email', 'USSD']


type ScheduleConfig = {
  perChannel: boolean
  common: { blackout: { enabled: boolean; from: string; to: string; action: string } }
  channels: Record<string, { blackout: { enabled: boolean; from: string; to: string; action: string } }>
}

const MOCK_SCHEDULES: Record<string, ScheduleConfig> = {
  // Lịch chung, blackout bật
  '1': {
    perChannel: false,
    common: { blackout: { enabled: true, from: '22:00', to: '08:00', action: 'Hủy luôn' } },
    channels: {},
  },
  // Lịch chung, không blackout
  '2': {
    perChannel: false,
    common: { blackout: { enabled: false, from: '', to: '', action: '' } },
    channels: {},
  },
  // Lịch riêng per kênh, mỗi kênh blackout khác nhau
  '3': {
    perChannel: true,
    common: { blackout: { enabled: false, from: '', to: '', action: '' } },
    channels: {
      Push:      { blackout: { enabled: true,  from: '22:00', to: '08:00', action: 'Hủy luôn' } },
      'Zalo OA': { blackout: { enabled: false, from: '',      to: '',      action: '' } },
      SMS:       { blackout: { enabled: true,  from: '21:00', to: '07:00', action: 'Hoãn đến đầu khung giờ' } },
      Banner:    { blackout: { enabled: false, from: '',      to: '',      action: '' } },
      Email:     { blackout: { enabled: false, from: '',      to: '',      action: '' } },
      USSD:      { blackout: { enabled: true,  from: '22:00', to: '06:00', action: 'Hủy luôn' } },
    },
  },
  // Lịch riêng per kênh, tất cả blackout bật
  '4': {
    perChannel: true,
    common: { blackout: { enabled: false, from: '', to: '', action: '' } },
    channels: {
      Push:      { blackout: { enabled: true, from: '23:00', to: '07:00', action: 'Hoãn đến đầu khung giờ' } },
      'Zalo OA': { blackout: { enabled: true, from: '22:00', to: '08:00', action: 'Hủy luôn' } },
      SMS:       { blackout: { enabled: true, from: '21:00', to: '07:00', action: 'Hủy luôn' } },
      Banner:    { blackout: { enabled: true, from: '22:00', to: '08:00', action: 'Hoãn đến đầu khung giờ' } },
      Email:     { blackout: { enabled: true, from: '20:00', to: '06:00', action: 'Hủy luôn' } },
      USSD:      { blackout: { enabled: true, from: '22:00', to: '06:00', action: 'Hủy luôn' } },
    },
  },
}

const DEFAULT_SCHEDULE: ScheduleConfig = {
  perChannel: false,
  common: { blackout: { enabled: false, from: '', to: '', action: '' } },
  channels: {},
}

const BL_PHONES = [
  '0987 xxx 001',
  '0912 xxx 002',
  '0965 xxx 003',
]

const WL_PHONES = [
  '0901 xxx 101',
  '0938 xxx 202',
]

type VariantContent = { segmentName: string; title?: string; body: string }

// Mock variant per trigger per channel — mỗi trigger có số biến thể độc lập per kênh
// Key: triggerCode → ChannelType → VariantContent[]
// Trigger T1 (EVT_DATA_LOW): Push/Zalo 3 biến thể, Email 2, SMS/Banner/USSD chỉ 1
// Trigger T2 (EVT_ROAM_START): Push/Zalo 2 biến thể, các kênh còn lại 1
const MOCK_VARIANTS: Record<string, Record<ChannelType, VariantContent[]>> = {
  EVT_DATA_LOW: {
    Push: [
      { segmentName: 'Tất cả (dự phòng)', title: 'Sắp hết data rồi!', body: 'Bạn chỉ còn 10% data. Nạp thêm ngay để không bị gián đoạn.' },
      { segmentName: 'Nguy cơ rời mạng', title: 'Ưu đãi đặc biệt cho bạn', body: 'Hết data + ưu đãi giữ chân 50% — nhận ngay trước khi hết hạn!' },
      { segmentName: 'Gen Z User', title: 'Data sắp cạn 😱', body: 'Còn 10% thôi! Nạp deal 5GB chỉ 19k — xịn không?' },
    ],
    'Zalo OA': [
      { segmentName: 'Tất cả (dự phòng)', body: 'Chào {{ten_kh}}! Data của bạn sắp hết. Nạp thêm ngay tại app.' },
      { segmentName: 'Nguy cơ rời mạng', body: 'Chào {{ten_kh}}! Chúng tôi có gói ưu đãi đặc biệt dành riêng cho bạn — đừng bỏ lỡ!' },
      { segmentName: 'Gen Z User', body: 'Hey {{ten_kh}}! Data gần hết rồi, có deal xịn đang chờ bạn 👀' },
    ],
    SMS: [
      { segmentName: 'Tất cả (dự phòng)', body: 'DATA SAP HET: {{ten_kh}} con 10% data. Nap them tai *100# hoac app.' },
    ],
    Banner: [
      { segmentName: 'Tất cả (dự phòng)', title: 'Data sắp hết', body: 'Nạp thêm ngay!' },
    ],
    Email: [
      { segmentName: 'Tất cả (dự phòng)', title: 'Thông báo: Data của bạn sắp hết', body: 'Kính gửi {{ten_kh}}, tài khoản data của bạn chỉ còn 10%.' },
      { segmentName: 'Nguy cơ rời mạng', title: 'Ưu đãi đặc biệt — chỉ dành cho bạn', body: 'Kính gửi {{ten_kh}}, chúng tôi có gói ưu đãi giữ chân dành riêng.' },
    ],
    USSD: [
      { segmentName: 'Tất cả (dự phòng)', body: 'DATA SAP HET. Bam 1 de nap them. Bam 2 de xem goi cuoc.' },
    ],
  },
  EVT_ROAM_START: {
    Push: [
      { segmentName: 'Tất cả (dự phòng)', title: 'Bạn đang roaming', body: 'Kích hoạt gói roaming ngay để tiết kiệm chi phí.' },
      { segmentName: 'Nguy cơ rời mạng', title: 'Ưu đãi roaming cho bạn', body: 'Tặng thêm 20% data roaming — áp dụng ngay hôm nay!' },
    ],
    'Zalo OA': [
      { segmentName: 'Tất cả (dự phòng)', body: 'Chào {{ten_kh}}! Bạn đang ở nước ngoài. Kích hoạt gói roaming để dùng data giá tốt hơn.' },
      { segmentName: 'Nguy cơ rời mạng', body: 'Chào {{ten_kh}}! Ưu đãi roaming đặc biệt — tiết kiệm 30% cước quốc tế.' },
    ],
    SMS: [
      { segmentName: 'Tất cả (dự phòng)', body: 'ROAMING: {{ten_kh}} dang o nuoc ngoai. Kich hoat goi roaming tai *100# de tiet kiem.' },
    ],
    Banner: [
      { segmentName: 'Tất cả (dự phòng)', title: 'Đang roaming', body: 'Kích hoạt gói ngay!' },
    ],
    Email: [
      { segmentName: 'Tất cả (dự phòng)', title: 'Thông báo roaming quốc tế', body: 'Kính gửi {{ten_kh}}, chúng tôi nhận thấy bạn đang sử dụng dịch vụ tại nước ngoài.' },
    ],
    USSD: [
      { segmentName: 'Tất cả (dự phòng)', body: 'ROAMING QUOC TE. Bam 1 kich hoat goi. Bam 2 xem cuoc phi.' },
    ],
  },
}

export function CampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [campaigns, setCampaigns] = useState(mockCampaigns)
  const campaign = campaigns.find(c => c.id === id) ?? campaigns[0]

  const [activeTab, setActiveTab] = useState<ChannelType>('Push')
  // key = triggerCode, value = index biến thể đang active — mỗi trigger độc lập
  const [activeVariantMap, setActiveVariantMap] = useState<Record<string, number>>({})
  const [stopConfirm, setStopConfirm] = useState(false)
  const [blPreviewOpen, setBlPreviewOpen] = useState(false)
  const [wlPreviewOpen, setWlPreviewOpen] = useState(false)

  const handleStop = () => {
    setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: 'Paused' as CampaignStatus } : c))
    toast('Campaign đã dừng', 'warning')
    setStopConfirm(false)
  }

  const handleActivate = () => {
    setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: 'Active' as CampaignStatus } : c))
    toast('Campaign đã kích hoạt lại', 'success')
  }

  return (
    <div className="space-y-0 max-w-4xl">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-t-lg px-6 py-4">
        <button onClick={() => navigate('/campaigns')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-3">
          <ArrowLeft size={14} /> Campaign
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-slate-800">{campaign.name}</h1>
              <StatusBadge status={campaign.status} />
            </div>
            <div className="text-xs font-mono text-slate-400 mt-1">{campaign.code}</div>
          </div>
          <div className="flex items-center gap-2">
            {campaign.status === 'Draft' && (
              <Button variant="primary" onClick={() => navigate(`/campaigns/${campaign.id}/edit`)}>
                Sửa
              </Button>
            )}
            {campaign.status === 'Active' && (
              <Button variant="danger" onClick={() => setStopConfirm(true)}>
                Dừng
              </Button>
            )}
            {campaign.status === 'Paused' && (
              <Button variant="success" onClick={handleActivate}>
                Bật
              </Button>
            )}
            <Button variant="outline" onClick={() => navigate('/campaigns')}>
              Đóng
            </Button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="bg-white border-x border-b border-slate-200 rounded-b-lg divide-y divide-slate-100">

        {/* S1 */}
        <section className="px-6 py-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">1. Thông tin Campaign</h2>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {[
              ['Tên campaign', campaign.name],
              ['Mã kịch bản', campaign.code],
              ['Mục tiêu', campaign.goal ?? '—'],
              ['Thời gian', `${campaign.startDate} – ${campaign.endDate}`],
              ['Độ ưu tiên', String(campaign.priority)],
              ['Người tạo', campaign.owner],
              ['Ngày tạo', campaign.createdAt],
              ['Ngày gửi duyệt', campaign.submittedAt ?? '—'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <dt className="text-slate-500 w-36 flex-shrink-0">{label}:</dt>
                <dd className="text-slate-800 font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* S2 */}
        <section className="px-6 py-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">2. Trigger &amp; Logic</h2>
          <div className="text-sm text-slate-600 space-y-2">
            <div className="flex gap-2">
              <span className="text-slate-500">Chế độ:</span>
              <span className="font-medium">Advanced · Logic: OR</span>
            </div>
            <div className="space-y-1">
              {campaign.triggers.map((t, i) => (
                <div key={t} className="flex items-center gap-2">
                  <span className="text-slate-400 w-4">{i + 1}</span>
                  <TriggerChip code={t} />
                </div>
              ))}
            </div>
            <div className="text-xs text-slate-500">
              Ưu tiên khi match nhiều trigger: Chỉ gửi trigger thứ tự 1
            </div>
            <div className="text-xs text-slate-500">
              Ước tính tin: ~6,800 KH × 2 kênh = ~13,600 tin
            </div>
          </div>
        </section>

        {/* S3 */}
        <section className="px-6 py-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">3. Audience / Phân khúc</h2>
          <dl className="text-sm space-y-1.5 text-slate-600">
            <div className="flex gap-2"><dt className="text-slate-500 w-32">Phân khúc:</dt><dd>Gen Z User (18–25) · Sắp hết data</dd></div>
            <div className="flex gap-2"><dt className="text-slate-500 w-32">Logic:</dt><dd>Bất kỳ phân khúc nào (OR)</dd></div>
            <div className="flex gap-2"><dt className="text-slate-500 w-32">Điều kiện lọc:</dt><dd>Loại thiết bị = Android</dd></div>
            <div className="flex gap-2">
              <dt className="text-slate-500 w-32">Reach ước tính:</dt>
              <dd className="font-semibold text-blue-600">~6,800 KH</dd>
            </div>
          </dl>
        </section>

        {/* S4 — Message Matrix với tab kênh interactive */}
        <section className="px-6 py-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">4. Message Matrix</h2>

          {/* Channel tabs */}
          <div className="flex gap-1 border-b border-slate-200 flex-wrap">
            {CHANNELS.map(ch => (
              <button
                key={ch}
                onClick={() => { setActiveTab(ch); setActiveVariantMap({}) }}
                className={`px-3 py-1.5 text-xs border-b-2 transition-colors ${
                  activeTab === ch
                    ? 'border-blue-500 text-blue-700 font-medium'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {ch}
                {['Push', 'Zalo OA'].includes(ch) ? ' ●●●' : ch === 'Email' ? ' ●●' : ' ●'}
              </button>
            ))}
          </div>

          {/* Messages for active tab */}
          <div className="space-y-3">
            {campaign.triggers.map((t, i) => {
              const variants = MOCK_VARIANTS[t]?.[activeTab] ?? []
              const hasVariants = variants.length > 1
              const activeIdx = activeVariantMap[t] ?? 0
              const currentVariant = variants[activeIdx] ?? variants[0]
              return (
                <div key={t} className="border border-slate-200 rounded-lg text-sm overflow-hidden">
                  {/* Trigger header */}
                  <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 font-medium text-slate-700">
                    T{i + 1} · {t}
                  </div>

                  {/* Variant tabs — mỗi trigger độc lập, chỉ hiển thị khi có >1 biến thể */}
                  {hasVariants && (
                    <div className="flex gap-0 border-b border-slate-200 bg-white px-3 pt-2">
                      {variants.map((v, vi) => (
                        <button
                          key={vi}
                          onClick={() => setActiveVariantMap(prev => ({ ...prev, [t]: vi }))}
                          className={`text-xs px-3 py-1.5 border-b-2 transition-colors mr-1 ${
                            activeIdx === vi
                              ? 'border-amber-400 text-amber-700 font-medium'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {v.segmentName}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Nội dung biến thể hiện tại */}
                  <div className="px-3 py-2.5 space-y-1">
                    {currentVariant?.title && (
                      <div><span className="text-slate-500">Tiêu đề: </span>{currentVariant.title}</div>
                    )}
                    <div><span className="text-slate-500">Nội dung: </span>{currentVariant?.body}</div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-xs text-slate-400">(Nhấn tab kênh để xem nội dung từng kênh)</div>
        </section>

        {/* S5 */}
        {(() => {
          const schedule = MOCK_SCHEDULES[id ?? ''] ?? DEFAULT_SCHEDULE
          return (
            <section className="px-6 py-4 space-y-3">
              <h2 className="text-sm font-semibold text-slate-700">5. Kênh &amp; Lịch gửi</h2>
              <div className="flex gap-2 text-sm">
                <span className="text-slate-500 w-40 flex-shrink-0">Đặt lịch theo kênh:</span>
                <span className="font-medium text-slate-700">{schedule.perChannel ? 'Có — lịch riêng per kênh' : 'Không — tất cả theo thời gian gửi message'}</span>
              </div>
              {!schedule.perChannel ? (
                <div className="flex gap-2 text-sm">
                  <span className="text-slate-500 w-40 flex-shrink-0">Blackout chung:</span>
                  <span className="font-medium text-slate-700">
                    {schedule.common.blackout.enabled
                      ? `Bật · ${schedule.common.blackout.from} – ${schedule.common.blackout.to} · ${schedule.common.blackout.action}`
                      : 'Tắt'}
                  </span>
                </div>
              ) : (
                <table className="w-full text-sm border border-slate-100 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50">
                    <tr className="text-xs text-slate-500">
                      <th className="text-left px-3 py-2 font-medium">Kênh</th>
                      <th className="text-left px-3 py-2 font-medium">Blackout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {CHANNELS.map(ch => {
                      const s = schedule.channels[ch]
                      if (!s) return null
                      return (
                        <tr key={ch} className="text-slate-700">
                          <td className="px-3 py-2 font-medium">{ch}</td>
                          <td className="px-3 py-2">
                            {s.blackout.enabled
                              ? `Bật · ${s.blackout.from} – ${s.blackout.to} · ${s.blackout.action}`
                              : <span className="text-slate-400">Tắt</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </section>
          )
        })()}

        {/* S6 */}
        <section className="px-6 py-4 space-y-2">
          <h2 className="text-sm font-semibold text-slate-700">6. An toàn</h2>
          <dl className="text-sm space-y-1.5 text-slate-600">
            {[
              ['Blackout', 'Bật · 22:00 – 08:00 · Hủy luôn'],
              ['DNC toàn hệ thống', 'Bật'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <dt className="text-slate-500 w-40 flex-shrink-0">{label}:</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
            <div className="flex gap-2 items-center">
              <dt className="text-slate-500 w-40 flex-shrink-0">Blacklist campaign:</dt>
              <dd className="flex items-center gap-2 font-medium">
                BL_ESIM_Q2_2026 · {BL_PHONES.length} SĐT
                <button
                  onClick={() => setBlPreviewOpen(true)}
                  className="text-xs text-blue-500 hover:text-blue-700 underline"
                >
                  [Xem]
                </button>
              </dd>
            </div>
            <div className="flex gap-2 items-center">
              <dt className="text-slate-500 w-40 flex-shrink-0">Whitelist:</dt>
              <dd className="flex items-center gap-2 font-medium">
                WL_VIP_Q2_2026 · {WL_PHONES.length} SĐT
                <button
                  onClick={() => setWlPreviewOpen(true)}
                  className="text-xs text-blue-500 hover:text-blue-700 underline"
                >
                  [Xem]
                </button>
              </dd>
            </div>
            {[
              ['Reach cuối cùng', '~6,480 KH'],
            ].map(([label, value]) => (
              <div key={label} className="flex gap-2">
                <dt className="text-slate-500 w-40 flex-shrink-0">{label}:</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      {/* Stop confirm */}
      <Dialog open={stopConfirm} onClose={() => setStopConfirm(false)} title="Dừng campaign?">
        <p className="text-sm text-slate-600">
          Tin nhắn đang trong hàng chờ sẽ bị hủy. Không thể hoàn tác.
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setStopConfirm(false)}>Hủy</Button>
          <Button variant="danger" onClick={handleStop}>Xác nhận Dừng</Button>
        </DialogActions>
      </Dialog>

      {/* BL file preview */}
      <Dialog open={blPreviewOpen} onClose={() => setBlPreviewOpen(false)} title="Blacklist — BL_ESIM_Q2_2026" className="max-w-sm">
        <ul className="space-y-1">
          {BL_PHONES.map((phone, i) => (
            <li key={i} className="font-mono text-sm text-slate-700">{phone}</li>
          ))}
        </ul>
        <div className="mt-3 text-xs text-slate-500">{BL_PHONES.length} số điện thoại</div>
        <DialogActions>
          <Button variant="outline" onClick={() => setBlPreviewOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* WL file preview */}
      <Dialog open={wlPreviewOpen} onClose={() => setWlPreviewOpen(false)} title="Whitelist — WL_VIP_Q2_2026" className="max-w-sm">
        <ul className="space-y-1">
          {WL_PHONES.map((phone, i) => (
            <li key={i} className="font-mono text-sm text-slate-700">{phone}</li>
          ))}
        </ul>
        <div className="mt-3 text-xs text-slate-500">{WL_PHONES.length} số điện thoại</div>
        <DialogActions>
          <Button variant="outline" onClick={() => setWlPreviewOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

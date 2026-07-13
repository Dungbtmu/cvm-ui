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

const SEGMENT_FILTERS: { segment: string; conditions: string[] }[] = [
  { segment: 'ARPU cao', conditions: ['Loại thiết bị = Android', 'Gói cước = D200'] },
  { segment: 'Gen Z User', conditions: ['Trạng thái SIM ≠ Tạm khóa', 'Số ngày không giao dịch > 14'] },
]


type SendTime =
  | { type: 'immediate' }
  | { type: 'delay'; value: number; unit: 'phút' | 'giờ' | 'ngày' }
  | { type: 'scheduled'; time: string; dayOffset: number }

type ChannelSchedule = {
  sendTime: SendTime
  blackout: { enabled: boolean; from: string; to: string; action: string }
}

type ScheduleConfig = {
  perChannel: boolean
  common: ChannelSchedule
  channels: Record<string, ChannelSchedule>
}

function formatSendTime(s: SendTime): string {
  if (s.type === 'immediate') return 'Gửi ngay sau khi trigger kích hoạt'
  if (s.type === 'delay') return `Sau ${s.value} ${s.unit} kể từ T`
  return `Vào lúc ${s.time} ngày T+${s.dayOffset}`
}

const MOCK_SCHEDULES: Record<string, ScheduleConfig> = {
  // Lịch chung, blackout bật
  '1': {
    perChannel: false,
    common: {
      sendTime: { type: 'immediate' },
      blackout: { enabled: true, from: '22:00', to: '08:00', action: 'Hủy luôn' },
    },
    channels: {},
  },
  // Lịch chung, không blackout
  '2': {
    perChannel: false,
    common: {
      sendTime: { type: 'scheduled', time: '09:00', dayOffset: 1 },
      blackout: { enabled: false, from: '', to: '', action: '' },
    },
    channels: {},
  },
  // Lịch riêng per kênh, mỗi kênh sendTime + blackout khác nhau
  '3': {
    perChannel: true,
    common: {
      sendTime: { type: 'immediate' },
      blackout: { enabled: false, from: '', to: '', action: '' },
    },
    channels: {
      Push:      { sendTime: { type: 'immediate' },                              blackout: { enabled: true,  from: '11:00', to: '08:00', action: 'Hủy luôn' } },
      'Zalo OA': { sendTime: { type: 'delay', value: 35, unit: 'phút' },        blackout: { enabled: true,  from: '02:00', to: '08:00', action: 'Hủy luôn' } },
      SMS:       { sendTime: { type: 'delay', value: 2, unit: 'giờ' },          blackout: { enabled: true,  from: '21:00', to: '07:00', action: 'Hoãn đến đầu khung giờ' } },
      Banner:    { sendTime: { type: 'immediate' },                              blackout: { enabled: false, from: '',      to: '',      action: '' } },
      Email:     { sendTime: { type: 'scheduled', time: '08:00', dayOffset: 1 },blackout: { enabled: false, from: '',      to: '',      action: '' } },
      USSD:      { sendTime: { type: 'delay', value: 1, unit: 'ngày' },         blackout: { enabled: true,  from: '22:00', to: '06:00', action: 'Hủy luôn' } },
    },
  },
  // Lịch riêng per kênh, tất cả blackout bật
  '4': {
    perChannel: true,
    common: {
      sendTime: { type: 'immediate' },
      blackout: { enabled: false, from: '', to: '', action: '' },
    },
    channels: {
      Push:      { sendTime: { type: 'immediate' },                               blackout: { enabled: true, from: '23:00', to: '07:00', action: 'Hoãn đến đầu khung giờ' } },
      'Zalo OA': { sendTime: { type: 'delay', value: 30, unit: 'phút' },         blackout: { enabled: true, from: '22:00', to: '08:00', action: 'Hủy luôn' } },
      SMS:       { sendTime: { type: 'scheduled', time: '10:00', dayOffset: 0 }, blackout: { enabled: true, from: '21:00', to: '07:00', action: 'Hủy luôn' } },
      Banner:    { sendTime: { type: 'immediate' },                               blackout: { enabled: true, from: '22:00', to: '08:00', action: 'Hoãn đến đầu khung giờ' } },
      Email:     { sendTime: { type: 'scheduled', time: '08:30', dayOffset: 1 }, blackout: { enabled: true, from: '20:00', to: '06:00', action: 'Hủy luôn' } },
      USSD:      { sendTime: { type: 'delay', value: 1, unit: 'ngày' },          blackout: { enabled: true, from: '22:00', to: '06:00', action: 'Hủy luôn' } },
    },
  },
}

const DEFAULT_SCHEDULE: ScheduleConfig = {
  perChannel: false,
  common: {
    sendTime: { type: 'immediate' },
    blackout: { enabled: false, from: '', to: '', action: '' },
  },
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

// Mock variant per trigger per channel — key phải khớp trigger code trong mockCampaigns
// E01: Push/Zalo 3 biến thể, Email 2, SMS/Banner/USSD chỉ 1 (không có tab)
// E02: Push/Zalo 2 biến thể, các kênh còn lại 1
const MOCK_VARIANTS: Record<string, Record<ChannelType, VariantContent[]>> = {
  E01: {
    Push: [
      { segmentName: 'Tất cả (dự phòng)', title: 'Chào mừng bạn đến với mạng!', body: 'SIM đã kích hoạt thành công. Khám phá các gói cước ngay.' },
      { segmentName: 'Nguy cơ rời mạng', title: 'Ưu đãi đặc biệt cho bạn', body: 'Kích hoạt SIM mới — nhận ngay ưu đãi giữ chân 50% tháng đầu!' },
      { segmentName: 'Gen Z User', title: 'Sim mới — deal ngay!', body: 'Kích hoạt xong rồi, giờ đăng ký gói 5GB/ngày chỉ 9k thôi nào!' },
    ],
    'Zalo OA': [
      { segmentName: 'Tất cả (dự phòng)', body: 'Chào {{ten_kh}}! SIM của bạn đã kích hoạt thành công. Xem các gói cước phù hợp tại app.' },
      { segmentName: 'Nguy cơ rời mạng', body: 'Chào {{ten_kh}}! Chúng tôi có ưu đãi đặc biệt dành riêng cho bạn ngay hôm nay!' },
      { segmentName: 'Gen Z User', body: 'Hey {{ten_kh}}! SIM mới kích hoạt rồi — có deal xịn đang chờ bạn 🔥' },
    ],
    SMS: [
      { segmentName: 'Tất cả (dự phòng)', body: 'Chao mung {{ten_kh}} da kich hoat SIM. Xem goi cuoc tai *100# hoac tai app.' },
    ],
    Banner: [
      { segmentName: 'Tất cả (dự phòng)', title: 'Chào mừng!', body: 'SIM đã kích hoạt — khám phá ưu đãi ngay.' },
    ],
    Email: [
      { segmentName: 'Tất cả (dự phòng)', title: 'Chào mừng bạn đến với mạng VietnamPost', body: 'Kính gửi {{ten_kh}}, SIM của bạn đã được kích hoạt thành công.' },
      { segmentName: 'Nguy cơ rời mạng', title: 'Ưu đãi đặc biệt — chỉ dành cho bạn', body: 'Kính gửi {{ten_kh}}, chúng tôi có gói ưu đãi giữ chân dành riêng.' },
    ],
    USSD: [
      { segmentName: 'Tất cả (dự phòng)', body: 'SIM DA KICH HOAT. Bam 1 xem goi cuoc. Bam 2 nap tien.' },
    ],
  },
  E02: {
    Push: [
      { segmentName: 'Tất cả (dự phòng)', title: 'Bạn chưa cài app!', body: 'Cài MyVNPost để quản lý tài khoản, nạp tiền và xem cước dễ dàng hơn.' },
      { segmentName: 'Gen Z User', title: 'App xịn lắm đó!', body: 'MyVNPost có giao diện mới — tải ngay, dùng thử miễn phí tháng đầu!' },
    ],
    'Zalo OA': [
      { segmentName: 'Tất cả (dự phòng)', body: 'Chào {{ten_kh}}! Bạn chưa cài ứng dụng MyVNPost. Tải ngay để tiện quản lý tài khoản.' },
      { segmentName: 'Gen Z User', body: 'Hey {{ten_kh}}! App mới của bọn mình xịn lắm, tải về dùng thử đi nào 📱' },
    ],
    SMS: [
      { segmentName: 'Tất cả (dự phòng)', body: 'Tai app MyVNPost de quan ly tai khoan de dang hon. Link: vnpost.vn/app' },
    ],
    Banner: [
      { segmentName: 'Tất cả (dự phòng)', title: 'Tải app ngay', body: 'Quản lý tài khoản dễ dàng hơn.' },
    ],
    Email: [
      { segmentName: 'Tất cả (dự phòng)', title: 'Bạn chưa cài ứng dụng MyVNPost', body: 'Kính gửi {{ten_kh}}, hãy tải ứng dụng để quản lý tài khoản thuận tiện hơn.' },
    ],
    USSD: [
      { segmentName: 'Tất cả (dự phòng)', body: 'TAI APP MYVNPOST. Bam 1 nhan link tai. Bam 2 de sau.' },
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
            <div className="flex gap-2 items-start">
              <dt className="text-slate-500 w-32 pt-0.5">Điều kiện lọc:</dt>
              <dd className="flex-1 space-y-1">
                {SEGMENT_FILTERS.map(sf => (
                  <div key={sf.segment}>
                    <span className="font-medium text-slate-700">[{sf.segment}]</span>{' '}
                    <span>{sf.conditions.join(' • ')}</span>
                  </div>
                ))}
              </dd>
            </div>
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
                <div className="space-y-1.5 text-sm">
                  <div className="flex gap-2">
                    <span className="text-slate-500 w-40 flex-shrink-0">Thời gian gửi:</span>
                    <span className="font-medium text-slate-700">{formatSendTime(schedule.common.sendTime)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-500 w-40 flex-shrink-0">Blackout chung:</span>
                    <span className="font-medium text-slate-700">
                      {schedule.common.blackout.enabled
                        ? `Bật · ${schedule.common.blackout.from} – ${schedule.common.blackout.to} · ${schedule.common.blackout.action}`
                        : 'Tắt'}
                    </span>
                  </div>
                </div>
              ) : (
                <table className="w-full text-sm border border-slate-100 rounded-lg overflow-hidden">
                  <thead className="bg-slate-50">
                    <tr className="text-xs text-slate-500">
                      <th className="text-left px-3 py-2 font-medium">Kênh</th>
                      <th className="text-left px-3 py-2 font-medium">Thời gian gửi</th>
                      <th className="text-left px-3 py-2 font-medium">Blackout</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {CHANNELS.map(ch => {
                      const s = schedule.channels[ch]
                      if (!s) return null
                      return (
                        <tr key={ch} className="text-slate-700">
                          <td className="px-3 py-2 font-medium w-24">{ch}</td>
                          <td className="px-3 py-2 text-slate-600">{formatSendTime(s.sendTime)}</td>
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

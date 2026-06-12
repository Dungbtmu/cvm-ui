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

const CHANNEL_MESSAGES: Record<ChannelType, { title?: string; body: string }> = {
  Push: { title: 'Chào mừng bạn!', body: 'SIM eSIM đã kích hoạt thành công. Khám phá VietnamPost App ngay.' },
  'Zalo OA': { title: undefined, body: 'Chào mừng {{ten_kh}}! SIM {{loai_sim}} đã được kích hoạt thành công.' },
  SMS: { body: 'Chao {{ten_kh}}! SIM {{loai_sim}} da kich hoat thanh cong. Cam on ban da su dung dich vu.' },
  Banner: { title: 'Chào mừng bạn!', body: 'SIM eSIM đã kích hoạt.' },
  Email: { title: 'Chào mừng đến VietnamPost', body: 'Kính gửi {{ten_kh}},\n\nSIM {{loai_sim}} của bạn đã được kích hoạt thành công.' },
  USSD: { body: 'Chao {{ten_kh}}! SIM kich hoat thanh cong. Bam 1 de xem them.' },
}

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

const BL_PREVIEW = [
  { phone: '0987 xxx 001', status: 'Hợp lệ' },
  { phone: '0912 xxx 002', status: 'Hợp lệ' },
  { phone: '0965 xxx 003', status: 'Trùng' },
]

export function CampaignDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [campaigns, setCampaigns] = useState(mockCampaigns)
  const campaign = campaigns.find(c => c.id === id) ?? campaigns[0]

  const [activeTab, setActiveTab] = useState<ChannelType>('Push')
  const [stopConfirm, setStopConfirm] = useState(false)
  const [blPreviewOpen, setBlPreviewOpen] = useState(false)

  const handleStop = () => {
    setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: 'Paused' as CampaignStatus } : c))
    toast('Campaign đã dừng', 'warning')
    setStopConfirm(false)
  }

  const handleActivate = () => {
    setCampaigns(prev => prev.map(c => c.id === campaign.id ? { ...c, status: 'Active' as CampaignStatus } : c))
    toast('Campaign đã kích hoạt lại', 'success')
  }

  const msg = CHANNEL_MESSAGES[activeTab]

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
                onClick={() => setActiveTab(ch)}
                className={`px-3 py-1.5 text-xs border-b-2 transition-colors ${
                  activeTab === ch
                    ? 'border-blue-500 text-blue-700 font-medium'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                {ch}
                {['Push', 'Zalo OA'].includes(ch) ? ' ●●' : ch === 'SMS' ? ' ●○' : ' ○○'}
              </button>
            ))}
          </div>

          {/* Messages for active tab */}
          <div className="space-y-2">
            {campaign.triggers.map((t, i) => (
              <div key={t} className="border border-slate-200 rounded-lg p-3 text-sm space-y-1">
                <div className="font-medium text-slate-700">T{i + 1} · {t} · {activeTab}</div>
                {msg.title && <div><span className="text-slate-500">Title: </span>{msg.title}</div>}
                <div><span className="text-slate-500">Body: </span>{msg.body}</div>
              </div>
            ))}
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
                BL_ESIM_Q2_2026 · 320 KH
                <button
                  onClick={() => setBlPreviewOpen(true)}
                  className="text-xs text-blue-500 hover:text-blue-700 underline"
                >
                  [Xem]
                </button>
              </dd>
            </div>
            {[
              ['Whitelist', 'Không dùng'],
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
      <Dialog open={blPreviewOpen} onClose={() => setBlPreviewOpen(false)} title="Xem trước tệp Blacklist — BL_ESIM_Q2_2026" className="max-w-md">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-slate-500 border-b border-slate-100">
              <th className="text-left pb-2 font-medium">Số điện thoại</th>
              <th className="text-left pb-2 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {BL_PREVIEW.map((row, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="py-1.5 font-mono text-xs">{row.phone}</td>
                <td className={`py-1.5 text-xs font-medium ${row.status === 'Hợp lệ' ? 'text-green-600' : 'text-orange-500'}`}>
                  {row.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 text-xs text-slate-500">
          ✅ 319 số hợp lệ · ⚠ 1 số trùng · 320 tổng
        </div>
        <DialogActions>
          <Button variant="outline" onClick={() => setBlPreviewOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

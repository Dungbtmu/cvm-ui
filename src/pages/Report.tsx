import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell
} from 'recharts'
import { Download } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useToast } from '../components/ui/Toast'
import { formatNumber } from '../lib/utils'

const deliveryData = [
  { day: '07', sent: 28000, delivered: 26800, failed: 1200 },
  { day: '08', sent: 32000, delivered: 30800, failed: 1200 },
  { day: '09', sent: 38000, delivered: 36600, failed: 1400 },
  { day: '10', sent: 42000, delivered: 40400, failed: 1600 },
  { day: '11', sent: 40000, delivered: 38400, failed: 1600 },
  { day: '12', sent: 38000, delivered: 36500, failed: 1500 },
  { day: '13', sent: 48320, delivered: 46560, failed: 1760 },
]
const deliveryDataPrev = [
  { day: '07', sent: 25000, delivered: 23800, failed: 1200 },
  { day: '08', sent: 29000, delivered: 27800, failed: 1200 },
  { day: '09', sent: 35000, delivered: 33600, failed: 1400 },
  { day: '10', sent: 38000, delivered: 36400, failed: 1600 },
  { day: '11', sent: 37000, delivered: 35400, failed: 1600 },
  { day: '12', sent: 35000, delivered: 33500, failed: 1500 },
  { day: '13', sent: 44000, delivered: 42560, failed: 1440 },
]

// open: null = kênh không track được (hiển thị N/A); ctr: null = tương tự
// Push, Email: hỗ trợ open + ctr
// Zalo OA, Banner: không track open, có ctr
// SMS, USSD: không track open, không track ctr
const channelPerf = [
  { ch: 'Push',    open: 52,   ctr: 18,  conv: 9 },
  { ch: 'Zalo OA', open: null, ctr: 15,  conv: 7 },
  { ch: 'SMS',     open: null, ctr: null, conv: 4 },
  { ch: 'USSD',    open: null, ctr: null, conv: 2 },
  { ch: 'Banner',  open: null, ctr: 3,   conv: 1 },
  { ch: 'Email',   open: 21,   ctr: 9,   conv: 4 },
]

const campaignCompare = [
  { name: 'Nhắc nạp tiền', sent: 32100, delivered: 30980, open: 38.4, conv: 9.1, cost: 480000 },
  { name: 'Hết hạn data',  sent: 28400, delivered: 27100, open: 35.2, conv: 7.8, cost: 360000 },
  { name: 'Welcome eSIM',  sent: 20600, delivered: 19400, open: 42.1, conv: 8.3, cost: 240000 },
  { name: 'LOW_DATA batch',sent: 24800, delivered: 23900, open: 29.6, conv: 6.2, cost: 720000 },
]

const funnelSteps = [
  { label: 'Audience đủ điều kiện', value: 32100, pct: 100,  drop: '' },
  { label: 'Đã gửi',                value: 29590, pct: 92.2, drop: '↓ rời bỏ 7.8% (DNC/Blacklist)' },
  { label: 'Đã tới đích',           value: 27310, pct: 85.1, drop: '↓ rời bỏ 7.7% (không đến nơi)' },
  { label: 'Đã mở / Đã nhấp',      value: 14380, pct: 44.8, drop: '↓ rời bỏ 47.3% (không mở) ← cao nhất' },
  { label: 'Đã cài app',            value: 9260,  pct: 28.8, drop: '↓ rời bỏ 35.6% (không hành động)' },
  { label: 'Đã mua gói cước',       value: 5810,  pct: 18.1, drop: '↓ rời bỏ 37.3% (không mua)' },
]

const segmentData = [
  { seg: 'Gen Z',       reach: 18450, delivered: 17800, open: 52.3, conv: 11.2 },
  { seg: 'Sắp hết data',reach: 8920,  delivered: 8600,  open: 44.8, conv: 8.9  },
  { seg: 'ARPU cao',    reach: 5600,  delivered: 5480,  open: 38.1, conv: 14.6 },
  { seg: 'Nguy cơ rời', reach: 2150,  delivered: 2050,  open: 22.4, conv: 3.1  },
]

const optOutData = [
  { day: '07', optout: 210, bl: 80 },
  { day: '08', optout: 240, bl: 90 },
  { day: '09', optout: 280, bl: 100 },
  { day: '10', optout: 320, bl: 110 },
  { day: '11', optout: 420, bl: 130 },
  { day: '12', optout: 380, bl: 120 },
  { day: '13', optout: 310, bl: 105 },
]

const freqDist = [
  { label: '1 tin', pct: 42, color: 'bg-blue-400' },
  { label: '2 tin', pct: 31, color: 'bg-blue-300' },
  { label: '3 tin', pct: 18, color: 'bg-blue-200' },
  { label: '4+ tin', pct: 9, color: 'bg-blue-100' },
]

const tabs = ['Hiệu quả gửi tin', 'Tương tác', 'So sánh Campaign', 'Phân khúc', 'Phễu', 'Spam & Quá tải']

export function Report() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState(0)
  const [compare, setCompare] = useState(false)
  const [timeRange, setTimeRange] = useState('7 ngày')
  const [highlightedRow, setHighlightedRow] = useState<number | null>(null)

  const handleExport = () => {
    toast('Đang xuất file... Sẽ tải xuống sau vài giây', 'success')
  }

  // Merge current + prev data for compare mode
  const mergedDelivery = deliveryData.map((d, i) => ({
    ...d,
    sent_prev: deliveryDataPrev[i].sent,
    delivered_prev: deliveryDataPrev[i].delivered,
  }))

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Analytics &amp; Report</h1>
        <Button variant="outline" onClick={handleExport}>
          <Download size={14} /> Xuất Excel
        </Button>
      </div>

      {/* Filter bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Thời gian:</span>
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)}
            className="text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none">
            {['Hôm nay', '7 ngày', '30 ngày', 'Tháng này', 'Tùy chỉnh'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Campaign:</span>
          <select className="text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none">
            <option>Tất cả</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Segment:</span>
          <select className="text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none">
            <option>Tất cả</option>
            {segmentData.map(s => <option key={s.seg}>{s.seg}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Kênh:</span>
          <select className="text-sm border border-slate-200 rounded px-2 py-1.5 focus:outline-none">
            <option>Tất cả</option>
          </select>
        </div>
        <button
          onClick={() => setCompare(!compare)}
          className={`text-xs px-3 py-1.5 rounded border transition-colors ${compare ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-200 text-slate-600 hover:border-blue-300'}`}
        >
          So sánh: {compare ? 'BẬT' : 'TẮT'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${activeTab === i ? 'bg-blue-500 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Delivery ── */}
      {activeTab === 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Tổng đã gửi', value: '124,500', sub: '' },
              { label: 'Đã tới đích', value: '119,940', sub: 'Đã tới đích / Đã gửi = 96.3%' },
              { label: 'Thất bại', value: '4,560', sub: '3.7% ⚠ — lỗi gateway hoặc timeout', warn: true },
              { label: 'Tỉ lệ đã tới đích', value: '96.3%', sub: 'Đã tới đích / Đã gửi × 100% · Mục tiêu: ≥ 95%' },
            ].map((k, i) => (
              <Card key={i}>
                <div className="text-xs text-slate-500">{k.label}</div>
                <div className={`text-2xl font-bold ${k.warn ? 'text-red-500' : 'text-slate-800'} mt-1`}>{k.value}</div>
                {k.sub && <div className="text-xs text-slate-500 mt-1">{k.sub}</div>}
              </Card>
            ))}
          </div>
          <Card>
            <div className="text-sm font-semibold text-slate-700 mb-3">
              Đã gửi vs Đã tới đích ({timeRange}){compare && <span className="ml-2 text-xs text-blue-500 font-normal">+ kỳ trước</span>}
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={compare ? mergedDelivery : deliveryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="sent" name="Đã gửi" stroke="#3b82f6" fill="#eff6ff" strokeWidth={2} />
                <Area type="monotone" dataKey="delivered" name="Đã tới đích" stroke="#22c55e" fill="#f0fdf4" strokeWidth={2} />
                <Area type="monotone" dataKey="failed" name="Thất bại" stroke="#ef4444" fill="#fef2f2" strokeWidth={2} />
                {compare && <Line type="monotone" dataKey="sent_prev" name="Đã gửi (kỳ trước)" stroke="#93c5fd" strokeDasharray="4 2" dot={false} />}
                {compare && <Line type="monotone" dataKey="delivered_prev" name="Đã tới đích (kỳ trước)" stroke="#86efac" strokeDasharray="4 2" dot={false} />}
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* ── Tab 1: Engagement ── */}
      {activeTab === 1 && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: 'Tỉ lệ mở', value: '38.4%', sub: '↑2.1% vs tuần trước · Mở / Đã tới đích × 100%', note: '* Push & Email' },
              { label: 'Tỉ lệ nhấp (CTR)', value: '12.1%', sub: '↑0.8% · Click / Đã tới đích × 100%', note: '* Trừ SMS & USSD' },
              { label: 'Tỉ lệ chuyển đổi', value: '8.3%', sub: '↑0.4% · Hoàn thành mục tiêu / Đã tới đích × 100% (24h)', note: '' },
              { label: 'Kênh hiệu quả nhất', value: 'Push', sub: 'Tỉ lệ chuyển đổi cao nhất trong kỳ', note: '' },
            ].map((k, i) => (
              <Card key={i}>
                <div className="text-xs text-slate-500">{k.label}</div>
                <div className="text-2xl font-bold text-slate-800 mt-1">{k.value}</div>
                <div className="text-xs text-green-600 mt-1">{k.sub}</div>
                {k.note && <div className="text-xs text-slate-400 mt-1">{k.note}</div>}
              </Card>
            ))}
          </div>
          <Card>
            <div className="text-sm font-semibold text-slate-700 mb-1">Hiệu suất theo kênh</div>
            <div className="text-xs text-slate-400 mb-3">N/A = kênh không hỗ trợ đo chỉ số này</div>
            <div className="space-y-3">
              {channelPerf.map(row => (
                <div key={row.ch} className="flex items-center gap-3 text-xs">
                  <span className="w-14 text-slate-500 shrink-0">{row.ch}</span>
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    {/* Open Rate */}
                    {row.open === null ? (
                      <div className="flex items-center gap-1">
                        <div className="h-5 w-8 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-[10px]">N/A</div>
                        <span className="text-slate-400 text-[10px]">Mở</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <div className="h-5 rounded bg-blue-400" style={{ width: `${Math.max(row.open, 4)}%`, minWidth: 8 }} />
                        <span className="text-slate-600">{row.open}% Mở</span>
                      </div>
                    )}
                    {/* CTR */}
                    {row.ctr === null ? (
                      <div className="flex items-center gap-1">
                        <div className="h-5 w-8 bg-slate-100 rounded flex items-center justify-center text-slate-400 text-[10px]">N/A</div>
                        <span className="text-slate-400 text-[10px]">CTR</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <div className="h-5 rounded bg-violet-400" style={{ width: `${Math.max(row.ctr, 4)}%`, minWidth: 8 }} />
                        <span className="text-slate-600">{row.ctr}% CTR</span>
                      </div>
                    )}
                    {/* Conversion */}
                    <div className="flex items-center gap-1">
                      <div className="h-5 rounded bg-green-400" style={{ width: `${Math.max(row.conv, 4)}%`, minWidth: 8 }} />
                      <span className="text-slate-600">{row.conv}% Conv</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400 inline-block" /> Tỉ lệ mở</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-violet-400 inline-block" /> Tỉ lệ nhấp (CTR)</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400 inline-block" /> Tỉ lệ chuyển đổi</span>
            </div>
          </Card>
        </div>
      )}

      {/* ── Tab 2: Campaign Comparison ── */}
      {activeTab === 2 && (
        <div className="space-y-4">
          <Card>
            <div className="text-sm font-semibold text-slate-700 mb-3">
              So sánh Delivery Rate / Conversion Rate theo campaign
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={campaignCompare}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="open" name="Tỉ lệ mở %" fill="#3b82f6" />
                <Bar dataKey="conv" name="Tỉ lệ chuyển đổi %" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div className="text-sm font-semibold text-slate-700 mb-3">Bảng so sánh chi tiết</div>
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="text-left pb-2 font-medium">Campaign</th>
                  <th className="text-right pb-2 font-medium">Đã gửi</th>
                  <th className="text-right pb-2 font-medium">Đã tới đích</th>
                  <th className="text-right pb-2 font-medium">Tỉ lệ mở</th>
                  <th className="text-right pb-2 font-medium">Chuyển đổi</th>
                  <th className="text-right pb-2 font-medium">Chi phí SMS</th>
                </tr>
              </thead>
              <tbody>
                {campaignCompare.map((c, i) => (
                  <tr key={i}
                    onClick={() => setHighlightedRow(highlightedRow === i ? null : i)}
                    className={`border-b border-slate-50 cursor-pointer ${highlightedRow === i ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                    <td className="py-2 text-slate-700 font-medium">{c.name}</td>
                    <td className="py-2 text-right">{formatNumber(c.sent)}</td>
                    <td className="py-2 text-right">{formatNumber(c.delivered)}</td>
                    <td className="py-2 text-right text-blue-600">{c.open}%</td>
                    <td className="py-2 text-right text-green-600">{c.conv}%</td>
                    <td className="py-2 text-right text-slate-500">{formatNumber(c.cost)} VND</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {highlightedRow !== null && (
              <div className="mt-2 text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
                → Đang lọc tất cả biểu đồ theo: <strong>{campaignCompare[highlightedRow].name}</strong>. Nhấn lại để bỏ lọc.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Tab 3: Segment ── */}
      {activeTab === 3 && (
        <div className="space-y-4">
          <Card>
            <div className="text-sm font-semibold text-slate-700 mb-3">Hiệu suất phân khúc — Tiếp cận = số KH thoả điều kiện lọc tại thời điểm chạy</div>
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="text-left pb-2 font-medium">Phân khúc</th>
                  <th className="text-right pb-2 font-medium">Tiếp cận</th>
                  <th className="text-right pb-2 font-medium">Đã tới đích</th>
                  <th className="text-right pb-2 font-medium">Tỉ lệ mở</th>
                  <th className="text-right pb-2 font-medium">Chuyển đổi</th>
                </tr>
              </thead>
              <tbody>
                {segmentData.map((s, i) => (
                  <tr key={i}
                    onClick={() => setHighlightedRow(highlightedRow === i + 10 ? null : i + 10)}
                    className={`border-b border-slate-50 cursor-pointer ${highlightedRow === i + 10 ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                    <td className="py-2 text-slate-700 font-medium">{s.seg}</td>
                    <td className="py-2 text-right">{formatNumber(s.reach)}</td>
                    <td className="py-2 text-right">{formatNumber(s.delivered)}</td>
                    <td className="py-2 text-right text-blue-600">{s.open}%</td>
                    <td className="py-2 text-right text-green-600">{s.conv}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Card>
            <div className="text-sm font-semibold text-slate-700 mb-3">So sánh phân khúc</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={segmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="seg" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="open" name="Tỉ lệ mở %" fill="#3b82f6" />
                <Bar dataKey="conv" name="Tỉ lệ chuyển đổi %" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card>
            <div className="text-sm font-semibold text-slate-700 mb-3">Phân bổ thiết bị — dựa trên push token</div>
            {(() => {
              const data = [
                { label: 'Android', pct: 62, color: '#22c55e' },
                { label: 'iOS',     pct: 28, color: '#3b82f6' },
                { label: 'Khác',   pct: 10, color: '#cbd5e1' },
              ]
              return (
                <div className="flex items-center gap-6">
                  <div className="relative flex-shrink-0">
                    <ResponsiveContainer width={140} height={140}>
                      <PieChart>
                        <Pie data={data} dataKey="pct" innerRadius={42} outerRadius={62} startAngle={90} endAngle={-270} paddingAngle={2} stroke="none">
                          {data.map(d => <Cell key={d.label} fill={d.color} />)}
                        </Pie>
                        <Tooltip formatter={(v) => `${v}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-lg font-bold text-slate-700">100%</span>
                      <span className="text-[10px] text-slate-400">tổng</span>
                    </div>
                  </div>
                  <div className="space-y-2.5 flex-1">
                    {data.map(d => (
                      <div key={d.label} className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="text-slate-600 flex-1">{d.label}</span>
                        <span className="font-medium text-slate-700">{d.pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </Card>
        </div>
      )}

      {/* ── Tab 4: Funnel ── */}
      {activeTab === 4 && (
        <Card>
          <div className="text-sm font-semibold text-slate-700 mb-1">Phễu chuyển đổi</div>
          <div className="text-xs text-slate-400 mb-3">% rời bỏ = (bước N − bước N+1) / bước N × 100%</div>
          <div className="space-y-3">
            {funnelSteps.map((step, i) => (
              <div key={i}>
                {i > 0 && <div className="text-xs text-slate-400 pl-2 mb-1">{step.drop}</div>}
                <div className="flex items-center gap-3">
                  <div className="text-sm text-slate-600 w-48">{step.label}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-5 relative">
                    <div className="bg-blue-500 h-5 rounded-full" style={{ width: `${step.pct}%` }} />
                  </div>
                  <div className="text-sm text-slate-700 w-20 text-right">{formatNumber(step.value)}</div>
                  <div className="text-sm font-medium text-slate-500 w-12 text-right">{step.pct}%</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-orange-600 bg-orange-50 rounded p-3 space-y-1">
            <div className="font-medium">Điểm rời bỏ lớn nhất: Đã tới đích → Đã mở (−47.3%)</div>
            <div>→ Gợi ý: Thử A/B test tiêu đề Push để tăng tỉ lệ mở</div>
            <div>→ So sánh kênh: Push mở 52% · SMS mở 22% · Zalo mở 44%</div>
          </div>
        </Card>
      )}

      {/* ── Tab 5: Spam & Fatigue ── */}
      {activeTab === 5 && (
        <div className="space-y-4">
          <Card>
            <div className="text-sm font-semibold text-slate-700 mb-1">Xu hướng opt-out & bị chặn theo ngày</div>
            <div className="text-xs text-slate-400 mb-3">Tỉ lệ opt-out = Số KH opt-out / Đã tới đích × 100%</div>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={optOutData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="optout" name="Opt-out" stroke="#ef4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="bl" name="Bị chặn Blacklist mới" stroke="#f97316" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
            <div className="text-xs text-orange-600 mt-2 bg-orange-50 rounded px-2 py-1">
              ↑ Spike ngày 11: cần điều tra — opt-out tăng 420 (+34% so với ngày trước)
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <div className="text-sm font-semibold text-slate-700 mb-1">Chỉ số tần suất</div>
              <div className="text-xs text-slate-400 mb-3">TB tin/người = Tổng tin đã gửi / Số KH unique nhận tin</div>
              <dl className="space-y-2 text-sm">
                {[
                  ['TB tin/người/ngày', '1.8'],
                  ['TB tin/người/tuần', '4.2'],
                  ['Tối đa tin/người/ngày', '5'],
                  ['Người nhận > 3 tin', '8.4%'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 space-y-1">
                <div className="text-xs text-slate-500 font-medium">Phân phối số tin/người (trục x = số tin, trục y = số KH):</div>
                {freqDist.map(f => (
                  <div key={f.label} className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 w-12">{f.label}</span>
                    <div className="flex-1 bg-slate-100 rounded h-3">
                      <div className={`${f.color} h-3 rounded`} style={{ width: `${f.pct * 2}%` }} />
                    </div>
                    <span className="text-slate-500 w-8 text-right">{f.pct}%</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <div className="text-sm font-semibold text-slate-700 mb-1">Điểm rủi ro spam (0–100)</div>
              <div className="text-xs text-slate-400 mb-2">Opt-out (40%) + Blacklist mới (30%) + CTR giảm (30%)</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600 font-medium text-sm">● LOW RISK</span>
                <span className="text-xs text-slate-500">(score 24/100)</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-4 mb-1">
                <div className="bg-green-500 h-4 rounded-full transition-all" style={{ width: '24%' }} />
              </div>
              <div className="flex justify-between text-xs text-slate-400 mb-3">
                <span>0</span>
                <span>60 (cảnh báo)</span>
                <span>100</span>
              </div>
              <dl className="space-y-1.5 text-xs text-slate-500">
                <div>Cảnh báo khi điểm &gt; 60 → thanh gauge chuyển cam/đỏ</div>
              </dl>
              <button className="mt-3 text-xs text-blue-500 hover:text-blue-700">Xem chi tiết chỉ số →</button>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

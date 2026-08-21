import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { Card } from '../components/ui/Card'
import { formatNumber } from '../lib/utils'
import { AlertTriangle, Pause, Play } from 'lucide-react'
import { useToast } from '../components/ui/Toast'
import { recentTriggerEvents } from '../data/mock'

const kpiCards = [
  { label: 'Số chiến dịch đang chạy', value: '12', sub: '↑2 vs hôm qua', trend: 'up', spark: [8,9,9,10,11,11,12], tooltip: 'Số chiến dịch có trạng thái Đang chạy tại thời điểm này' },
  { label: 'Sự kiện kích hoạt hôm nay', value: '3,842', sub: '↑18% vs hôm qua', trend: 'up', spark: [2100,2400,2400,2800,3200,3600,3842], tooltip: 'Tổng số lần sự kiện kích hoạt từ 00:00 đến hiện tại' },
  { label: 'Tin nhắn đã gửi hôm nay', value: '48,320', sub: '', trend: 'neutral', spark: [28000,32000,38000,42000,40000,38000,48320], tooltip: 'Tổng tin nhắn ở trạng thái Đã gửi hoặc Đã chuyển phát trong ngày' },
  { label: 'Tỉ lệ đã tới đích hôm nay', value: '96.4%', sub: '● SLA: OK', trend: 'up', spark: [95.1,95.8,96.2,96.0,96.5,96.1,96.4], tooltip: 'Đã tới đích / Đã gửi × 100% — tính từ 00:00 hôm nay' },
  { label: 'Tin nhắn thất bại', value: '1,760', sub: '⚠ ↑3% vs hôm qua', trend: 'down', spark: [900,1000,1100,1200,1400,1600,1760], tooltip: 'Cổng gửi tin trả lỗi hoặc quá thời gian chờ sau 3 lần thử lại' },
  { label: 'Tỉ lệ chuyển đổi', value: '8.3%', sub: '↑0.4% vs tuần', trend: 'up', spark: [7.5,7.8,7.9,8.0,8.1,8.2,8.3], tooltip: 'Số KH hoàn thành hành động mục tiêu / Gửi thành công × 100% (cửa sổ 24h)' },
  { label: 'Bị chặn Danh sách chặn hôm nay', value: '4,210', sub: 'BSS DNC: 3,840', trend: 'neutral', spark: [2800,3100,3400,3600,3800,4000,4210], tooltip: 'Tin bị chặn bởi DNC + Danh sách chặn của chiến dịch trong ngày' },
]

const volumeData = [
  { h: '00', rt: 800, nrt: 400, off: 200 },
  { h: '04', rt: 600, nrt: 300, off: 150 },
  { h: '08', rt: 3200, nrt: 1800, off: 800 },
  { h: '09', rt: 4100, nrt: 2200, off: 900 },
  { h: '12', rt: 3800, nrt: 1900, off: 850 },
  { h: '16', rt: 3500, nrt: 1700, off: 800 },
  { h: '20', rt: 2200, nrt: 1100, off: 500 },
  { h: '24', rt: 1200, nrt: 600, off: 280 },
]


const topCampaigns = [
  { name: 'Nhắc nạp tiền', sent: 18200, rate: '96.5%', spark: [14000,15000,16000,17000,17500,18000,18200] },
  { name: 'Hết hạn data', sent: 12400, rate: '95.4%', spark: [10000,10500,11000,11500,12000,12200,12400] },
  { name: 'LOW_DATA batch', sent: 9800, rate: '94.2%', spark: [9000,9200,9400,9500,9600,9700,9800] },
  { name: 'Welcome eSIM', sent: 8100, rate: '93.1%', spark: [6000,6500,7000,7400,7700,7900,8100] },
]

const topTriggersToday = [
  { name: 'LOW_DATA_BALANCE', count: 1842, match: '68%' },
  { name: 'SIM_ACTIVATED', count: 940, match: '91%' },
  { name: 'NO_APP_INSTALL_24H', count: 620, match: '44%' },
  { name: 'TOP_UP_FAIL', count: 440, match: '82%' },
]

const topTriggers7d = [
  { name: 'LOW_DATA_BALANCE', count: 12400, match: '68%' },
  { name: 'SIM_ACTIVATED', count: 6580, match: '91%' },
  { name: 'NO_APP_INSTALL_24H', count: 4340, match: '44%' },
  { name: 'TOP_UP_FAIL', count: 3080, match: '82%' },
  { name: 'LOC_TRAVEL', count: 920, match: '77%' },
]

const oldestPendingMinutes = 22

function Sparkline({ data, bad }: { data: number[]; bad?: boolean }) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const h = 28
  const w = 64
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline points={pts} fill="none" stroke={bad ? '#ef4444' : '#3b82f6'} strokeWidth="1.5" />
    </svg>
  )
}

export function Dashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [livePaused, setLivePaused] = useState(false)
  const [triggerRange, setTriggerRange] = useState<'today' | '7d'>('today')
  const topTriggers = triggerRange === 'today' ? topTriggersToday : topTriggers7d

  return (
    <div className="space-y-6">
      {/* ROW 1 — KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        {kpiCards.map((kpi, i) => {
          const navTarget = i < 2 ? '/triggers' : i < 4 ? '/report' : i === 4 ? '/report' : i === 6 ? '/report' : '/blacklist'
          const isBad = kpi.trend === 'down'
          return (
            <Card
              key={i}
              className={`space-y-2 cursor-pointer hover:shadow-md transition-shadow ${isBad ? 'border-red-400' : ''}`}
              onClick={() => navigate(navTarget)}
              title={kpi.tooltip}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-slate-500 font-medium">{kpi.label}</div>
                {isBad && <span className="text-red-500 text-xs">⚠</span>}
              </div>
              <div className={`text-2xl font-bold ${isBad ? 'text-red-600' : 'text-slate-800'}`}>{kpi.value}</div>
              <div className="flex items-center justify-between">
                <span className={`text-xs ${isBad ? 'text-red-500' : kpi.trend === 'up' ? 'text-green-600' : 'text-slate-500'}`}>
                  {kpi.sub}
                </span>
                <Sparkline data={kpi.spark} bad={isBad} />
              </div>
            </Card>
          )
        })}
      </div>

      {/* ROW 2 — System Health */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="space-y-3">
          <div className="text-sm font-semibold text-slate-700">Lượng trigger / sự kiện (24h)</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={volumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="h" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="rt" name="Thời gian thực" stroke="#3b82f6" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="nrt" name="Gần thời gian thực" stroke="#8b5cf6" dot={false} strokeWidth={2} />
              <Line type="monotone" dataKey="off" name="Ngoại tuyến" stroke="#94a3b8" dot={false} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="space-y-3">
          <div className="text-sm font-semibold text-slate-700">Hàng chờ & Tồn đọng</div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Đang chờ (giờ giới nghiêm):</span><span className="font-medium">1,240</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Đã lên lịch (tương lai):</span><span className="font-medium">8,900</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Chờ lâu nhất:</span>
              <span className={`font-medium ${oldestPendingMinutes > 30 ? 'text-red-600' : oldestPendingMinutes > 15 ? 'text-orange-600' : 'text-slate-700'}`}>
                {oldestPendingMinutes} phút
              </span>
            </div>
            <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
              ⓘ Hàng chờ giờ giới nghiêm sẽ được xử lý lúc 08:00
            </div>
            <button
              onClick={() => toast('Tính năng đang phát triển', 'warning')}
              className="text-xs text-blue-500 hover:text-blue-700 self-end"
            >
              [Xem hàng chờ]
            </button>
          </div>
        </Card>

      </div>

      {/* ROW 3 — Campaign Monitoring */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="space-y-3">
          <div className="text-sm font-semibold text-slate-700">Chiến dịch đang chạy nhiều nhất</div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-100">
                <th className="text-left pb-2 font-medium">Chiến dịch</th>
                <th className="text-right pb-2 font-medium">Đã gửi</th>
                <th className="text-right pb-2 font-medium">Tỉ lệ</th>
                <th className="text-right pb-2 font-medium">Xu hướng</th>
              </tr>
            </thead>
            <tbody>
              {topCampaigns.map((c, i) => (
                <tr
                  key={i}
                  className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                  onClick={() => navigate('/campaigns')}
                >
                  <td className="py-2 text-slate-700">{c.name}</td>
                  <td className="py-2 text-right text-slate-600">{formatNumber(c.sent)}</td>
                  <td className="py-2 text-right text-green-600 font-medium">{c.rate}</td>
                  <td className="py-2 text-right"><Sparkline data={[...c.spark]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => navigate('/campaigns')} className="text-xs text-blue-500 hover:text-blue-700">
            Xem tất cả →
          </button>
        </Card>

        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">Sự kiện kích hoạt nhiều nhất</div>
            <div className="flex text-xs rounded-full border border-slate-200 overflow-hidden">
              <button
                onClick={() => setTriggerRange('today')}
                className={`px-2.5 py-1 ${triggerRange === 'today' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                Hôm nay
              </button>
              <button
                onClick={() => setTriggerRange('7d')}
                className={`px-2.5 py-1 border-l border-slate-200 ${triggerRange === '7d' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                7 ngày
              </button>
            </div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-slate-100">
                <th className="text-left pb-2 font-medium">Sự kiện kích hoạt</th>
                <th className="text-right pb-2 font-medium">Kích hoạt</th>
                <th className="text-right pb-2 font-medium">Tỉ lệ khớp</th>
              </tr>
            </thead>
            <tbody>
              {topTriggers.map((t, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => navigate('/triggers')}>
                  <td className="py-2 font-mono text-xs text-slate-700">{t.name}</td>
                  <td className="py-2 text-right text-slate-600">{formatNumber(t.count)}</td>
                  <td className="py-2 text-right text-blue-600 font-medium">{t.match}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">Dòng sự kiện trigger gần đây</div>
          <button
            onClick={() => setLivePaused(!livePaused)}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-slate-200 hover:bg-slate-50"
          >
            {livePaused ? <Play size={10} /> : <Pause size={10} />}
            <span className={livePaused ? 'text-slate-400' : 'text-green-600'}>
              {livePaused ? 'Tạm dừng' : 'Đang chạy ●'}
            </span>
          </button>
        </div>
        <div className="space-y-1.5 font-mono text-xs">
          {recentTriggerEvents.map((e, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5 border-b border-slate-50">
              <span className="text-slate-400 w-20">{e.time}</span>
              <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded w-40 truncate">{e.code}</span>
              <span className="text-slate-500 w-32">{e.phone}</span>
              <span className={
                e.type === 'success' ? 'text-green-600' :
                e.type === 'blocked' ? 'text-red-500' : 'text-slate-500'
              }>
                → {e.result}
              </span>
            </div>
          ))}
        </div>
      </Card>


      {/* ROW 5 — Trigger Analytics */}
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">Phát hiện bất thường trigger</div>
          <button onClick={() => navigate('/report')} className="text-xs text-blue-500 hover:text-blue-700">Xem chi tiết →</button>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="text-yellow-600" />
            <span className="text-sm font-semibold text-yellow-800">LOW_DATA_BALANCE</span>
            <span className="text-xs text-yellow-700 font-medium">+340%</span>
          </div>
          <div className="text-xs text-slate-500">Hiện tại: 12,400 lần / Trung bình 7 ngày: 3,600 lần</div>
        </div>
      </Card>
    </div>
  )
}

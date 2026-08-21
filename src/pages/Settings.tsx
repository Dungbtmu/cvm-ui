import { useState } from 'react'
import { HelpCircle } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { mockCampaigns } from '../data/mock'
import type { ChannelType } from '../types'

const CAP_CHANNELS: ChannelType[] = ['Push', 'Zalo OA', 'SMS', 'USSD', 'Banner', 'Email']

// Số nguyên dương ≤ 9999, hoặc rỗng (= không giới hạn) — dùng chung cho mọi ô ngưỡng Frequency Cap
// (Ngày/Tuần/Tháng/theo kênh/Gửi lại). Xem URD Settings Tab 1 STT 1.10.
function capFieldError(v: string): boolean {
  if (v === '') return false
  const n = Number(v)
  return !Number.isInteger(n) || n <= 0 || n > 9999
}

export function Settings() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState(0)

  // Frequency Cap — Daily/Weekly/Monthly đều KHÔNG bắt buộc, để trống = không giới hạn (URD STT 1.1-1.3).
  // Cooldown đã bị bỏ khỏi form theo URD V4 (thay bằng cấu hình Gửi lại ở STT 1.5).
  const [capDay, setCapDay] = useState('')
  const [capWeek, setCapWeek] = useState('')
  const [capMonth, setCapMonth] = useState('')
  const [capChannel, setCapChannel] = useState<Partial<Record<ChannelType, string>>>({})

  const [allowResend, setAllowResend] = useState(false)
  const [resendMaxCount, setResendMaxCount] = useState('')
  const [resendGapHours, setResendGapHours] = useState('')

  const capDayErr = capFieldError(capDay)
  const capWeekErr = capFieldError(capWeek)
  const capMonthErr = capFieldError(capMonth)
  const capChannelErrs = CAP_CHANNELS.reduce<Partial<Record<ChannelType, boolean>>>((acc, ch) => {
    acc[ch] = capFieldError(capChannel[ch] ?? '')
    return acc
  }, {})
  const resendMaxErr = capFieldError(resendMaxCount)
  const resendGapErr = capFieldError(resendGapHours)

  const weekLtDayErr = !capDayErr && !capWeekErr && capDay !== '' && capWeek !== '' && Number(capWeek) < Number(capDay)
  const monthLtWeekErr = !capWeekErr && !capMonthErr && capWeek !== '' && capMonth !== '' && Number(capMonth) < Number(capWeek)
  const resendIncompleteErr = allowResend && (resendMaxCount === '' || resendGapHours === '')

  const hasAnyCapErr = capDayErr || capWeekErr || capMonthErr
    || Object.values(capChannelErrs).some(Boolean)
    || weekLtDayErr || monthLtWeekErr
    || resendMaxErr || resendGapErr || resendIncompleteErr

  const handleSaveCap = () => {
    if (hasAnyCapErr) return
    toast('Đã lưu cài đặt ✓', 'success')
  }

  // Priority matrix
  const [priorities, setPriorities] = useState(
    mockCampaigns.filter(c => c.status === 'Active').map((c, i) => ({ ...c, priority: i + 1 }))
  )
  const [saveConfirm, setSaveConfirm] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  // Detect conflicts (duplicate priority numbers)
  const priorityNums = priorities.map(p => p.priority)
  const hasDuplicate = priorityNums.some((n, i) => priorityNums.indexOf(n) !== i)

  const handlePriorityChange = (idx: number, val: number) => {
    setPriorities(prev =>
      [...prev.map((x, i) => i === idx ? { ...x, priority: val } : x)]
        .sort((a, b) => a.priority - b.priority)
    )
  }

  const confirmSave = () => {
    toast('Đã cập nhật thứ tự ưu tiên ✓', 'success')
    setSaveConfirm(false)
  }

  const perms: [string, boolean, boolean][] = [
    ['Xem Dashboard', true, true],
    ['Xem tất cả màn hình', true, true],
    ['Tạo / Sửa Campaign', false, true],
    ['Gửi duyệt campaign', false, true],
    ['Duyệt / Từ chối Campaign', true, false],
    ['Xem Trigger catalog', true, true],
    ['Quản lý Blacklist', true, true],
    ['Xem Report', true, true],
    ['Cài đặt hệ thống (Settings)', true, false],
  ]

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-bold text-slate-800">Cài đặt hệ thống</h1>

      <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit">
        {['Frequency Cap', 'Phân quyền', 'Priority Matrix'].map((t, i) => (
          <button key={t} onClick={() => setActiveTab(i)}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${activeTab === i ? 'bg-blue-500 text-white font-medium' : 'text-slate-600 hover:bg-slate-100'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Frequency Cap ── */}
      {activeTab === 0 && (
        <Card className="space-y-5">
          <div className="text-sm font-semibold text-slate-700">Giới hạn tần suất nhận tin — áp dụng toàn hệ thống</div>

          {/* Ngưỡng tổng: Ngày / Tuần / Tháng — tất cả không bắt buộc, để trống = không giới hạn */}
          <div className="space-y-3">
            {([
              ['Tối đa tin/KH/ngày', capDay, setCapDay, capDayErr],
              ['Tối đa tin/KH/tuần', capWeek, setCapWeek, capWeekErr],
              ['Tối đa tin/KH/tháng', capMonth, setCapMonth, capMonthErr],
            ] as [string, string, (v: string) => void, boolean][]).map(([label, value, setter, hasErr]) => (
              <div key={label} className="flex items-center gap-4">
                <label className="text-sm text-slate-600 w-56">{label}:</label>
                <div>
                  <input type="number" min="1" max="9999" value={value} onChange={e => setter(e.target.value)}
                    placeholder="VD: 3 (để trống = không giới hạn)"
                    className={`w-56 px-2 py-1.5 text-sm border rounded focus:outline-none focus:border-blue-400 ${hasErr ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} />
                  {hasErr && <div className="text-xs text-red-500 mt-0.5">Giá trị không hợp lệ — phải là số nguyên từ 1 đến 9999</div>}
                </div>
                <span className="text-sm text-slate-500">tin</span>
              </div>
            ))}
            {weekLtDayErr && (
              <div className="text-xs text-red-500 bg-red-50 rounded px-2 py-1.5">
                Giới hạn tuần phải ≥ giới hạn ngày
              </div>
            )}
            {monthLtWeekErr && (
              <div className="text-xs text-red-500 bg-red-50 rounded px-2 py-1.5">
                Giới hạn tháng phải ≥ giới hạn tuần
              </div>
            )}
          </div>

          {/* Giới hạn theo kênh */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">Giới hạn theo kênh</div>
            <table className="w-full text-sm max-w-md">
              <thead className="text-xs text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="text-left pb-2 font-medium">Kênh</th>
                  <th className="text-left pb-2 font-medium">Tối đa/ngày</th>
                </tr>
              </thead>
              <tbody>
                {CAP_CHANNELS.map(ch => (
                  <tr key={ch} className="border-b border-slate-50">
                    <td className="py-1.5 text-slate-600">{ch}</td>
                    <td className="py-1.5">
                      <input type="number" min="1" max="9999"
                        value={capChannel[ch] ?? ''}
                        onChange={e => setCapChannel(prev => ({ ...prev, [ch]: e.target.value }))}
                        placeholder="Không giới hạn"
                        className={`w-32 px-2 py-1 text-sm border rounded focus:outline-none focus:border-blue-400 ${capChannelErrs[ch] ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-xs text-slate-400 mt-1">Để trống = kênh đó không giới hạn riêng; vẫn chịu ràng buộc Ngày/Tuần/Tháng ở trên nếu có cấu hình.</div>
          </div>

          {/* Cho phép gửi lại */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer w-fit">
              <input type="checkbox" checked={allowResend} onChange={e => setAllowResend(e.target.checked)}
                className="accent-blue-500" />
              <span className="text-sm font-medium text-slate-700">Cho phép gửi lại</span>
            </label>
            {allowResend && (
              <div className="mt-2 space-y-3 pl-6">
                <div className="flex items-center gap-4">
                  <label className="text-sm text-slate-600 w-56">Số lần gửi lại tối đa:</label>
                  <div>
                    <input type="number" min="1" max="9999" value={resendMaxCount}
                      onChange={e => setResendMaxCount(e.target.value)} placeholder="VD: 2"
                      className={`w-32 px-2 py-1.5 text-sm border rounded focus:outline-none focus:border-blue-400 ${resendMaxErr ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm text-slate-600 w-56">Khoảng cách tối thiểu giữa các lần (giờ):</label>
                  <div>
                    <input type="number" min="1" max="9999" value={resendGapHours}
                      onChange={e => setResendGapHours(e.target.value)} placeholder="VD: 4"
                      className={`w-32 px-2 py-1.5 text-sm border rounded focus:outline-none focus:border-blue-400 ${resendGapErr ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} />
                  </div>
                </div>
                {resendIncompleteErr && (
                  <div className="text-xs text-red-500 bg-red-50 rounded px-2 py-1.5 w-fit">
                    Vui lòng nhập đầy đủ số lần và khoảng cách gửi lại
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-orange-600 bg-orange-50 rounded px-2 py-1.5">
            ⚠ Thay đổi áp dụng cho sự kiện tiếp theo — không hồi tố. Để trống một ngưỡng nghĩa là không giới hạn ở cấp đó.
          </div>
          <Button variant="primary" onClick={handleSaveCap} disabled={hasAnyCapErr}>
            Lưu cài đặt
          </Button>
        </Card>
      )}

      {/* ── Phân quyền ── */}
      {activeTab === 1 && (
        <Card>
          <div className="text-sm font-semibold text-slate-700 mb-4">
            Phân quyền hệ thống
            <span className="ml-2 text-xs font-normal text-slate-400">(chỉ đọc — thay đổi qua hệ thống IAM)</span>
          </div>
          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 border-b border-slate-100">
              <tr>
                <th className="text-left pb-2 font-medium">Chức năng</th>
                <th className="text-center pb-2 font-medium">Admin</th>
                <th className="text-center pb-2 font-medium">QTV Marketing</th>
              </tr>
            </thead>
            <tbody>
              {perms.map(([label, admin, qtv]) => (
                <tr key={label} className="border-b border-slate-50">
                  <td className="py-2 text-slate-700">{label}</td>
                  <td className="py-2 text-center"><span className={admin ? 'text-green-600' : 'text-red-400'}>{admin ? '✓' : '✗'}</span></td>
                  <td className="py-2 text-center"><span className={qtv ? 'text-green-600' : 'text-red-400'}>{qtv ? '✓' : '✗'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* ── Priority Matrix ── */}
      {activeTab === 2 && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-slate-700">Priority Matrix — Thứ tự ưu tiên Campaign</div>
              <div className="text-xs text-slate-500 mt-1">
                Khi nhiều campaign cùng khớp một khách hàng, hệ thống chọn campaign có số ưu tiên nhỏ nhất.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setHelpOpen(true)} className="text-slate-400 hover:text-slate-600">
                <HelpCircle size={16} />
              </button>
              <Button
                variant="primary"
                size="sm"
                disabled={hasDuplicate}
                onClick={() => setSaveConfirm(true)}
                title={hasDuplicate ? 'Hãy giải quyết xung đột trước khi lưu' : undefined}
              >
                Lưu thứ tự
              </Button>
            </div>
          </div>

          {hasDuplicate && (
            <div className="text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">
              ⚠ Có số ưu tiên bị trùng — hãy điều chỉnh trước khi lưu
            </div>
          )}

          <table className="w-full text-sm">
            <thead className="text-xs text-slate-500 border-b border-slate-100">
              <tr>
                <th className="w-8"></th>
                <th className="text-left pb-2 font-medium">Tên campaign</th>
                <th className="text-left pb-2 font-medium">Mã kịch bản</th>
                <th className="text-center pb-2 font-medium w-24">Độ ưu tiên</th>
              </tr>
            </thead>
            <tbody>
              {priorities.map((c, i) => {
                const isDuplicate = priorityNums.filter(n => n === c.priority).length > 1
                return (
                  <tr key={c.id} className={`border-b border-slate-50 hover:bg-slate-50 ${isDuplicate ? 'bg-red-50' : ''}`}>
                    <td className="py-2 text-slate-300 cursor-grab text-center">≡</td>
                    <td className="py-2 text-slate-700">
                      {i === 0 && <span className="mr-1">★</span>}
                      {c.name}
                    </td>
                    <td className="py-2 text-xs text-slate-400 font-mono">{c.code}</td>
                    <td className="py-2 text-center">
                      <div className="relative inline-block">
                        <input
                          type="number"
                          min="1"
                          value={c.priority}
                          onChange={e => handlePriorityChange(i, Number(e.target.value))}
                          className={`w-16 px-2 py-1 text-sm border rounded text-center focus:outline-none focus:border-blue-400 ${isDuplicate ? 'border-red-400' : 'border-slate-200'}`}
                        />
                        {isDuplicate && (
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 bg-red-700 text-white text-xs rounded px-2 py-0.5 whitespace-nowrap z-10">
                            Trùng thứ tự ưu tiên — kéo để sắp xếp lại
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {priorities.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-slate-400 text-sm">Không có campaign Active</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}

      {/* Help dialog */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} title="Priority Matrix — Hướng dẫn">
        <p className="text-sm text-slate-600">
          Số ưu tiên nhỏ hơn = được chọn trước khi nhiều campaign cùng khớp với một KH.
        </p>
        <ul className="mt-3 text-xs text-slate-500 space-y-1 list-disc pl-4">
          <li>Kéo icon ≡ để sắp xếp lại thứ tự</li>
          <li>Hoặc nhập số trực tiếp vào ô Độ ưu tiên</li>
          <li>Campaign Active mới tự thêm vào cuối với priority = max + 1</li>
          <li>Campaign Paused/Ended tự ẩn khỏi danh sách</li>
        </ul>
        <DialogActions>
          <Button variant="outline" onClick={() => setHelpOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Save confirm dialog */}
      <Dialog open={saveConfirm} onClose={() => setSaveConfirm(false)} title="Lưu thứ tự ưu tiên?">
        <p className="text-sm text-slate-600">
          Thứ tự mới sẽ áp dụng ngay cho sự kiện trigger tiếp theo.
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setSaveConfirm(false)}>Hủy</Button>
          <Button variant="primary" onClick={confirmSave}>Xác nhận</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

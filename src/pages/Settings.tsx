import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HelpCircle, ChevronUp, ChevronDown, Info } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { mockCampaigns, mockTriggers } from '../data/mock'
import { buildPriorityGroups, groupsForCampaign, type PriorityGroup } from '../lib/utils'
import type { ChannelType, Campaign } from '../types'

const CAP_CHANNELS: ChannelType[] = ['Push', 'Zalo OA', 'SMS', 'USSD', 'Banner', 'Email']

// Số nguyên dương ≤ 9999, hoặc rỗng (= không giới hạn) — dùng chung cho mọi ô ngưỡng Frequency Cap
// (Ngày/Tuần/Tháng/theo kênh/Gửi lại). Xem URD Settings Tab 1 STT 1.10.
function capFieldError(v: string): boolean {
  if (v === '') return false
  const n = Number(v)
  return !Number.isInteger(n) || n <= 0 || n > 9999
}

const TAB_LABELS = ['Giới hạn tần suất', 'Phân quyền', 'Độ ưu tiên']

export function Settings() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  // Hỗ trợ điều hướng từ Campaign Builder/List (solution Mục 2.7): ?tab=priority&campaign=<id>
  // mở thẳng Tab "Độ ưu tiên" với filter sẵn theo đúng campaign đó. Khởi tạo 1 lần từ query khi
  // component mount (route change từ Builder/List sang Settings luôn remount) — không dùng effect
  // để tránh setState đồng bộ trong effect (react-hooks/set-state-in-effect).
  const [activeTab, setActiveTab] = useState(() => (searchParams.get('tab') === 'priority' ? 2 : 0))

  // Frequency Cap — Daily/Weekly/Monthly đều KHÔNG bắt buộc, để trống = không giới hạn (URD STT 1.1-1.3).
  // Cooldown đã bị bỏ khỏi form theo URD V4. "Gửi lại" đã CHUYỂN sang Campaign Builder (Nhắc lại —
  // Re-engagement, cấu hình riêng theo từng campaign) theo URD V4.1 — xem CampaignBuilder.tsx.
  const [capDay, setCapDay] = useState('')
  const [capWeek, setCapWeek] = useState('')
  const [capMonth, setCapMonth] = useState('')
  const [capChannel, setCapChannel] = useState<Partial<Record<ChannelType, string>>>({})

  const capDayErr = capFieldError(capDay)
  const capWeekErr = capFieldError(capWeek)
  const capMonthErr = capFieldError(capMonth)
  const capChannelErrs = CAP_CHANNELS.reduce<Partial<Record<ChannelType, boolean>>>((acc, ch) => {
    acc[ch] = capFieldError(capChannel[ch] ?? '')
    return acc
  }, {})

  const weekLtDayErr = !capDayErr && !capWeekErr && capDay !== '' && capWeek !== '' && Number(capWeek) < Number(capDay)
  const monthLtWeekErr = !capWeekErr && !capMonthErr && capWeek !== '' && capMonth !== '' && Number(capMonth) < Number(capWeek)

  const hasAnyCapErr = capDayErr || capWeekErr || capMonthErr
    || Object.values(capChannelErrs).some(Boolean)
    || weekLtDayErr || monthLtWeekErr

  const handleSaveCap = () => {
    if (hasAnyCapErr) return
    toast('Đã lưu cài đặt ✓', 'success')
  }

  // ── Nhóm ưu tiên liên-campaign (CR Priority Redesign — thay thế hoàn toàn Priority Matrix cũ) ──
  // Xem solution/priority-redesign-solution.md Mục 2. State cục bộ để demo kéo-thả trên prototype;
  // không có API thật — mọi thay đổi chỉ tồn tại trong phiên xem hiện tại (reload sẽ mất).
  const [localCampaigns, setLocalCampaigns] = useState<Campaign[]>(mockCampaigns)
  const [helpOpen, setHelpOpen] = useState(false)
  const [saveConfirm, setSaveConfirm] = useState<{ triggerCode: string } | null>(null)
  const [triggerFilter, setTriggerFilter] = useState<string>('')
  const [campaignFilter, setCampaignFilter] = useState<string>(() => searchParams.get('campaign') ?? '')

  const allGroups = useMemo(() => buildPriorityGroups(localCampaigns), [localCampaigns])

  // 2 chế độ filter độc lập (solution Mục 2.1): theo Trigger (1 trigger → 1 nhóm) hoặc theo Campaign
  // (hiện TẤT CẢ nhóm mà campaign đó tham gia — phục vụ link điều hướng từ Builder/List Mục 2.7).
  const displayedGroups: PriorityGroup[] = campaignFilter
    ? groupsForCampaign(localCampaigns, campaignFilter)
    : triggerFilter
      ? allGroups.filter(g => g.triggerCode === triggerFilter)
      : allGroups

  const filteredCampaignName = campaignFilter ? localCampaigns.find(c => c.id === campaignFilter)?.name : undefined

  // Kéo-thả đơn giản hóa bằng nút lên/xuống (project chưa có sẵn lib kéo-thả) — chỉ hoán đổi vị trí
  // trong PHẠM VI 1 nhóm trigger, không ảnh hưởng vị trí của campaign đó ở các nhóm trigger khác
  // (đúng mô hình "N vị trí độc lập theo nhóm", solution Mục 2.4).
  const moveInGroup = (triggerCode: string, campaignId: string, direction: -1 | 1) => {
    setLocalCampaigns(prev => {
      const group = buildPriorityGroups(prev).find(g => g.triggerCode === triggerCode)
      if (!group) return prev
      const ordered = [...group.limited]
      const idx = ordered.findIndex(m => m.campaign.id === campaignId)
      const targetIdx = idx + direction
      if (idx < 0 || targetIdx < 0 || targetIdx >= ordered.length) return prev
      ;[ordered[idx], ordered[targetIdx]] = [ordered[targetIdx], ordered[idx]]
      const newPositionById = new Map(ordered.map((m, i) => [m.campaign.id, i + 1]))
      return prev.map(c =>
        newPositionById.has(c.id)
          ? { ...c, groupPositions: { ...c.groupPositions, [triggerCode]: newPositionById.get(c.id)! } }
          : c
      )
    })
  }

  const confirmSave = () => {
    toast('Đã cập nhật thứ tự ưu tiên ✓', 'success')
    setSaveConfirm(null)
  }

  const perms: [string, boolean, boolean][] = [
    ['Xem Bảng điều hành', true, true],
    ['Xem tất cả màn hình', true, true],
    ['Tạo / Sửa Chiến dịch', false, true],
    ['Gửi duyệt chiến dịch', false, true],
    ['Duyệt / Từ chối Chiến dịch', true, false],
    ['Xem danh mục Sự kiện kích hoạt', true, true],
    ['Quản lý Danh sách chặn', true, true],
    ['Xem Báo cáo', true, true],
    ['Cài đặt hệ thống', true, false],
  ]

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-xl font-bold text-slate-800">Cài đặt hệ thống</h1>

      <div className="flex gap-1 bg-white border border-slate-200 rounded-lg p-1 w-fit">
        {TAB_LABELS.map((t, i) => (
          <button key={t} onClick={() => { setActiveTab(i); setSearchParams({}) }}
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

          <div className="text-xs text-slate-500 bg-slate-50 rounded px-2 py-1.5">
            ℹ Cấu hình "Nhắc lại" (gửi thêm tin cho KH đã nhận thành công nhưng chưa xử lý) nằm tại
            màn hình <span className="font-medium">Tạo/Sửa Chiến dịch</span> — mục Kênh &amp; Lịch gửi,
            vì mỗi chiến dịch cần tự bật/tắt và chỉnh riêng theo sự kiện kích hoạt của mình.
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
                <th className="text-center pb-2 font-medium">Quản trị viên</th>
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

      {/* ── Độ ưu tiên (Nhóm ưu tiên liên-campaign — CR Priority Redesign) ── */}
      {activeTab === 2 && (
        <div className="space-y-4 max-w-4xl">
          <Card className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-700">Độ ưu tiên — Nhóm ưu tiên liên-campaign</div>
                <div className="text-xs text-slate-500 mt-1">
                  Khi nhiều chiến dịch cùng khớp một khách hàng qua chung 1 sự kiện kích hoạt, hệ thống xử lý theo
                  đúng thứ tự Admin sắp xếp bên dưới — nhóm theo từng sự kiện kích hoạt (trigger).
                </div>
              </div>
              <button onClick={() => setHelpOpen(true)} className="text-slate-400 hover:text-slate-600 flex-shrink-0">
                <HelpCircle size={16} />
              </button>
            </div>

            <div className="flex items-center gap-3 flex-wrap pt-1">
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Lọc theo Trigger:</label>
                <select
                  value={triggerFilter}
                  onChange={e => { setTriggerFilter(e.target.value); setCampaignFilter(''); setSearchParams({}) }}
                  className="text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                >
                  <option value="">Tất cả nhóm</option>
                  {allGroups.map(g => (
                    <option key={g.triggerCode} value={g.triggerCode}>
                      {g.triggerCode} — {mockTriggers.find(t => t.code === g.triggerCode)?.name ?? g.triggerCode}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Lọc theo Campaign:</label>
                <select
                  value={campaignFilter}
                  onChange={e => { setCampaignFilter(e.target.value); setTriggerFilter(''); setSearchParams({}) }}
                  className="text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400 max-w-56"
                >
                  <option value="">Không lọc</option>
                  {localCampaigns.filter(c => c.status === 'Active').map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              {(triggerFilter || campaignFilter) && (
                <button
                  onClick={() => { setTriggerFilter(''); setCampaignFilter(''); setSearchParams({}) }}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>

            {campaignFilter && (
              <div className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1.5">
                Đang xem tất cả nhóm mà campaign <strong>{filteredCampaignName ?? campaignFilter}</strong> tham gia ({displayedGroups.length} nhóm).
              </div>
            )}
          </Card>

          {displayedGroups.length === 0 && (
            <Card>
              <div className="py-8 text-center text-slate-400 text-sm">
                Không có nhóm nào phù hợp — chỉ campaign Đang chạy mới xuất hiện tại đây.
              </div>
            </Card>
          )}

          {displayedGroups.map(group => {
            const trig = mockTriggers.find(t => t.code === group.triggerCode)
            return (
              <Card key={group.triggerCode} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-slate-700">
                    Nhóm Trigger: {trig?.name ?? group.triggerCode}{' '}
                    <span className="text-xs text-slate-400 font-mono font-normal">({group.triggerCode})</span>
                  </div>
                  {group.limited.length >= 2 && (
                    <Button variant="primary" size="sm" onClick={() => setSaveConfirm({ triggerCode: group.triggerCode })}>
                      Lưu thứ tự
                    </Button>
                  )}
                </div>

                {group.limited.length >= 2 && (
                  // ≥ 2 campaign "Có thời hạn" cạnh tranh → bàn kéo-thả (nút lên/xuống — project chưa
                  // có sẵn lib kéo-thả, đơn giản hóa theo đúng gợi ý trong yêu cầu).
                  <table className="w-full text-sm">
                    <thead className="text-xs text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="w-16"></th>
                        <th className="text-left pb-2 font-medium">Tên chiến dịch</th>
                        <th className="text-left pb-2 font-medium">Mã kịch bản</th>
                        <th className="text-center pb-2 font-medium w-20">Vị trí</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.limited.map((m, i) => (
                        <tr key={m.campaign.id} className="border-b border-slate-50 hover:bg-slate-50">
                          <td className="py-2">
                            <div className="flex items-center justify-center gap-0.5">
                              <button
                                disabled={i === 0}
                                onClick={() => moveInGroup(group.triggerCode, m.campaign.id, -1)}
                                className="text-slate-400 hover:text-blue-600 disabled:opacity-20 disabled:pointer-events-none"
                                title="Tăng ưu tiên (lên trên)"
                              >
                                <ChevronUp size={16} />
                              </button>
                              <button
                                disabled={i === group.limited.length - 1}
                                onClick={() => moveInGroup(group.triggerCode, m.campaign.id, 1)}
                                className="text-slate-400 hover:text-blue-600 disabled:opacity-20 disabled:pointer-events-none"
                                title="Giảm ưu tiên (xuống dưới)"
                              >
                                <ChevronDown size={16} />
                              </button>
                            </div>
                          </td>
                          <td className="py-2 text-slate-700">
                            {i === 0 && <span className="mr-1">★</span>}
                            {m.campaign.name}
                          </td>
                          <td className="py-2 text-xs text-slate-400 font-mono">{m.campaign.code}</td>
                          <td className="py-2 text-center text-slate-600 font-medium">#{i + 1}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {group.limited.length === 1 && (
                  // Mục 5.3 — chỉ 1 campaign "Có thời hạn", không cạnh tranh: hiển thị đơn giản, không kéo-thả.
                  <div className="text-sm text-slate-600 bg-slate-50 rounded px-3 py-2">
                    Campaign <strong>{group.limited[0].campaign.name}</strong> — vị trí #1 (không có campaign{' '}
                    <strong>Có thời hạn</strong> nào khác cạnh tranh cùng trigger này)
                  </div>
                )}

                {group.limited.length === 0 && group.ongoing.length > 0 && (
                  // Mục 2.5 — toàn bộ nhóm là "Vận hành thường trực": chỉ liệt kê, tiebreak createdAt, không thao tác.
                  <div className="space-y-1.5">
                    <div className="text-xs text-slate-500">
                      {group.ongoing.length} campaign vận hành thường trực dùng chung trigger này, tự động xếp theo
                      thời gian tạo (sớm hơn thắng) — không cần sắp xếp.
                    </div>
                    <ul className="text-sm text-slate-600 space-y-1">
                      {group.ongoing.map((c, i) => (
                        <li key={c.id} className="flex items-center gap-2 bg-slate-50 rounded px-3 py-1.5">
                          <span className="text-xs text-slate-400 w-5">{i + 1}.</span>
                          <span className="flex-1">{c.name}</span>
                          <span className="text-xs text-slate-400 font-mono">{c.createdAt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {group.limited.length > 0 && group.ongoing.length > 0 && (
                  // Campaign "Vận hành thường trực" trùng trigger với nhóm có "Có thời hạn" → khối ghi chú
                  // phụ riêng, KHÔNG lẫn vào bàn kéo-thả (solution Mục 2.1, 2.6).
                  <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 rounded px-3 py-2">
                    <Info size={14} className="flex-shrink-0 mt-0.5" />
                    <span>
                      Ngoài ra còn có {group.ongoing.length} campaign <strong>Vận hành thường trực</strong> dùng
                      chung trigger này (không xếp hạng, luôn nhường campaign Có thời hạn):{' '}
                      {group.ongoing.map(c => c.name).join(', ')}
                    </span>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Help dialog */}
      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} title="Độ ưu tiên — Hướng dẫn">
        <p className="text-sm text-slate-600">
          Khi nhiều chiến dịch "Có thời hạn" cùng dùng 1 sự kiện kích hoạt (trigger), hệ thống xử lý theo đúng
          thứ tự Admin sắp xếp trong nhóm của trigger đó.
        </p>
        <ul className="mt-3 text-xs text-slate-500 space-y-1 list-disc pl-4">
          <li>Dùng nút ▲▼ để đổi vị trí trong nhóm — chỉ ảnh hưởng nhóm trigger đang xem</li>
          <li>Chiến dịch "Có thời hạn" luôn được xử lý trước "Vận hành thường trực" cùng trigger, mặc định</li>
          <li>Giữa các campaign "Vận hành thường trực": xếp theo ngày tạo sớm hơn, không cấu hình được</li>
          <li>Chiến dịch Đang chạy mới luôn tự thêm vào CUỐI nhóm — không chèn giữa</li>
          <li>Chiến dịch Tạm dừng/Đã kết thúc tự gỡ khỏi mọi nhóm</li>
        </ul>
        <DialogActions>
          <Button variant="outline" onClick={() => setHelpOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Save confirm dialog */}
      <Dialog open={!!saveConfirm} onClose={() => setSaveConfirm(null)} title="Lưu thứ tự ưu tiên?">
        <p className="text-sm text-slate-600">
          Thứ tự mới sẽ áp dụng ngay cho sự kiện trigger tiếp theo trong nhóm này — không ảnh hưởng vị trí của các
          campaign ở những nhóm trigger khác.
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setSaveConfirm(null)}>Hủy</Button>
          <Button variant="primary" onClick={confirmSave}>Xác nhận</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

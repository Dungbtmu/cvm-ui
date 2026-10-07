import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { HelpCircle, GripVertical } from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove, sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { mockCampaigns, mockTriggers } from '../data/mock'
import { buildPriorityGroups, groupsForCampaign, isRecentlyAddedToGroup, type PriorityGroup, type PriorityGroupMember } from '../lib/utils'
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

// ── SortablePriorityRow: 1 dòng trong bàn kéo-thả Tab Độ ưu tiên (nâng cấp từ nút ▲▼ sang kéo-thả
// thật — @dnd-kit/sortable). Chỉ kéo-thả trong PHẠM VI 1 nhóm trigger (SortableContext bọc riêng
// từng nhóm ở component Settings bên dưới) — không kéo chéo giữa các nhóm khác nhau. ──
interface SortablePriorityRowProps {
  member: PriorityGroupMember
  index: number
  isNew: boolean
}

function SortablePriorityRow({ member, index, isNew }: SortablePriorityRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: member.campaign.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-slate-50 ${isDragging ? 'bg-blue-50 shadow-lg opacity-80 relative z-10' : 'hover:bg-slate-50'}`}
    >
      <td className="py-2 w-10">
        <button
          {...attributes}
          {...listeners}
          className="text-slate-400 hover:text-blue-600 cursor-grab active:cursor-grabbing touch-none flex items-center justify-center w-full"
          title="Kéo để đổi vị trí"
        >
          <GripVertical size={16} />
        </button>
      </td>
      <td className="py-2 text-slate-700">
        {index === 0 && <span className="mr-1">★</span>}
        {member.campaign.name}
        {isNew && (
          <span className="ml-2 text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5 align-middle">
            Mới
          </span>
        )}
      </td>
      <td className="py-2 text-xs text-slate-400 font-mono">{member.campaign.code}</td>
      <td className="py-2 text-center text-slate-600 font-medium">#{index + 1}</td>
    </tr>
  )
}

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
  const [triggerFilter, setTriggerFilter] = useState<string>('')
  const [campaignFilter, setCampaignFilter] = useState<string>(() => searchParams.get('campaign') ?? '')

  const allGroups = useMemo(
    () => buildPriorityGroups(localCampaigns),
    [localCampaigns]
  )

  // 2 filter kết hợp AND có ràng buộc 2 chiều (URD V4.28/UC-PRIORITY-01, Screen Settings Tab 3
  // STT 3.1-3.2): chọn Trigger trước → dropdown Campaign chỉ hiện campaign đang dùng trigger đó;
  // chọn Campaign trước → dropdown Trigger chỉ hiện trigger mà campaign đó đang dùng. Nhờ ràng buộc
  // lẫn nhau, không bao giờ kết hợp ra kết quả rỗng — không cần empty state riêng cho trường hợp sai.
  const filterCampaignObj = campaignFilter ? localCampaigns.find(c => c.id === campaignFilter) : undefined

  // Options khả dụng cho dropdown Trigger: nếu đã chọn Campaign, chỉ hiện trigger của campaign đó.
  const triggerOptions = filterCampaignObj
    ? allGroups.filter(g => filterCampaignObj.triggers.includes(g.triggerCode))
    : allGroups

  // Options khả dụng cho dropdown Campaign: nếu đã chọn Trigger, chỉ hiện campaign Active dùng trigger đó.
  const campaignOptions = triggerFilter
    ? localCampaigns.filter(c => c.status === 'Active' && c.triggers.includes(triggerFilter))
    : localCampaigns.filter(c => c.status === 'Active')

  // Cả 2 đã chọn → chỉ hiện đúng 1 khối nhóm theo Trigger đã chọn (không hiện các nhóm khác của
  // Campaign đó). Chỉ 1 trong 2 → hành vi như trước (theo Trigger, hoặc tất cả nhóm của Campaign).
  const displayedGroups: PriorityGroup[] = triggerFilter
    ? allGroups.filter(g => g.triggerCode === triggerFilter)
    : campaignFilter
      ? groupsForCampaign(localCampaigns, campaignFilter)
      : allGroups

  const filteredCampaignName = filterCampaignObj?.name

  // Kéo-thả thật (nâng cấp từ nút ▲▼ — @dnd-kit/core + @dnd-kit/sortable) — chỉ hoán đổi vị trí
  // trong PHẠM VI 1 nhóm trigger, không ảnh hưởng vị trí của campaign đó ở các nhóm trigger khác
  // (đúng mô hình "N vị trí độc lập theo nhóm", URD II.6.8/UC-PRIORITY-01). Áp dụng ngay khi thả —
  // không có nút [Lưu] riêng hay confirm dialog bổ sung (Screen Settings Tab 3 STT 3.4).
  const reorderGroup = (triggerCode: string, fromId: string, toId: string) => {
    if (fromId === toId) return
    setLocalCampaigns(prev => {
      const group = buildPriorityGroups(prev).find(g => g.triggerCode === triggerCode)
      if (!group) return prev
      const ordered = group.members.map(m => m.campaign.id)
      const fromIdx = ordered.indexOf(fromId)
      const toIdx = ordered.indexOf(toId)
      if (fromIdx < 0 || toIdx < 0) return prev
      const moved = arrayMove(ordered, fromIdx, toIdx)
      const newPositionById = new Map(moved.map((id, i) => [id, i + 1]))
      return prev.map(c =>
        newPositionById.has(c.id)
          ? { ...c, groupPositions: { ...c.groupPositions, [triggerCode]: newPositionById.get(c.id)! } }
          : c
      )
    })
    toast('Đã cập nhật thứ tự ưu tiên ✓', 'success')
  }

  // Sensor dùng chung cho mọi bàn kéo-thả trong trang — PointerSensor cho chuột/touch, KeyboardSensor
  // để vẫn thao tác được bằng bàn phím (a11y) theo đúng pattern chuẩn của dnd-kit.
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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
                  onChange={e => {
                    const next = e.target.value
                    setTriggerFilter(next)
                    // Ràng buộc 2 chiều: nếu Campaign đang chọn không dùng trigger mới này, bỏ chọn Campaign.
                    if (next && filterCampaignObj && !filterCampaignObj.triggers.includes(next)) {
                      setCampaignFilter('')
                    }
                    setSearchParams({})
                  }}
                  className="text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
                >
                  <option value="">Tất cả nhóm</option>
                  {triggerOptions.map(g => (
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
                  onChange={e => {
                    const next = e.target.value
                    setCampaignFilter(next)
                    // Ràng buộc 2 chiều: nếu Trigger đang chọn không thuộc campaign mới này, bỏ chọn Trigger.
                    if (next && triggerFilter) {
                      const nextCampaign = localCampaigns.find(c => c.id === next)
                      if (!nextCampaign?.triggers.includes(triggerFilter)) setTriggerFilter('')
                    }
                    setSearchParams({})
                  }}
                  className="text-sm border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400 max-w-56"
                >
                  <option value="">Không lọc</option>
                  {campaignOptions.map(c => (
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

            {campaignFilter && triggerFilter && (
              <div className="text-xs text-blue-700 bg-blue-50 rounded px-2 py-1.5">
                Đang xem đúng nhóm trigger <strong>{triggerFilter}</strong> của campaign <strong>{filteredCampaignName ?? campaignFilter}</strong>.
              </div>
            )}
            {campaignFilter && !triggerFilter && (
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
                </div>

                {group.members.length >= 2 && (
                  // ≥ 2 campaign Active cạnh tranh → bàn kéo-thả THẬT (@dnd-kit/core + @dnd-kit/sortable).
                  // SortableContext bọc riêng per-nhóm (items = id campaign của ĐÚNG nhóm này) nên kéo-thả
                  // chỉ hoán vị trong phạm vi 1 nhóm, không thể kéo chéo sang nhóm trigger khác (đúng mô
                  // hình N vị trí độc lập, URD II.6.8/UC-PRIORITY-01). Mọi campaign Active cùng 1 luật —
                  // không phân biệt có hay không có ngày kết thúc (V4.25).
                  <DndContext
                    sensors={dndSensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(event: DragEndEvent) => {
                      const { active, over } = event
                      if (over && active.id !== over.id) {
                        reorderGroup(group.triggerCode, String(active.id), String(over.id))
                      }
                    }}
                  >
                    <table className="w-full text-sm">
                      <thead className="text-xs text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="w-10"></th>
                          <th className="text-left pb-2 font-medium">Tên chiến dịch</th>
                          <th className="text-left pb-2 font-medium">Mã kịch bản</th>
                          <th className="text-center pb-2 font-medium w-20">Vị trí</th>
                        </tr>
                      </thead>
                      <SortableContext items={group.members.map(m => m.campaign.id)} strategy={verticalListSortingStrategy}>
                        <tbody>
                          {group.members.map((m, i) => (
                            <SortablePriorityRow key={m.campaign.id} member={m} index={i} isNew={isRecentlyAddedToGroup(m.campaign)} />
                          ))}
                        </tbody>
                      </SortableContext>
                    </table>
                  </DndContext>
                )}

                {group.members.length === 1 && (
                  // Chỉ 1 campaign Active dùng trigger này, không cạnh tranh: hiển thị đơn giản, không kéo-thả.
                  <div className="text-sm text-slate-600 bg-slate-50 rounded px-3 py-2 flex items-center gap-2">
                    <span>
                      Campaign <strong>{group.members[0].campaign.name}</strong> — vị trí #1 (không có campaign nào
                      khác cạnh tranh cùng trigger này)
                    </span>
                    {isRecentlyAddedToGroup(group.members[0].campaign) && (
                      <span className="text-[10px] font-medium bg-emerald-100 text-emerald-700 rounded-full px-1.5 py-0.5">
                        Mới
                      </span>
                    )}
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
          Khi nhiều chiến dịch Đang chạy cùng dùng 1 sự kiện kích hoạt (trigger), hệ thống xử lý theo đúng
          thứ tự Admin sắp xếp trong nhóm của trigger đó — mọi chiến dịch Đang chạy đều tham gia bàn kéo-thả
          theo cùng 1 luật, không phân biệt có hay không có ngày kết thúc.
        </p>
        <ul className="mt-3 text-xs text-slate-500 space-y-1 list-disc pl-4">
          <li>Kéo-thả dòng (biểu tượng ⠿) để đổi vị trí trong nhóm — chỉ ảnh hưởng nhóm trigger đang xem</li>
          <li>Chiến dịch Đang chạy mới luôn tự thêm vào CUỐI nhóm — không chèn giữa</li>
          <li>Chiến dịch Tạm dừng/Đã kết thúc tự gỡ khỏi mọi nhóm</li>
          <li>Badge <strong>"Mới"</strong> đánh dấu chiến dịch vừa tự động thêm vào nhóm trong 24 giờ gần nhất — cần Admin rà soát</li>
        </ul>
        <DialogActions>
          <Button variant="outline" onClick={() => setHelpOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

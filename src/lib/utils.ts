import { type ClassValue, clsx } from 'clsx'
import type { Campaign, CampaignStatus } from '../types'

// ── Nhóm ưu tiên liên-campaign (CR Priority Redesign) ──────────────────────────────────────────
// Xem solution/priority-redesign-solution.md Mục 1.3: KHÔNG nhầm với "Thứ tự trigger nội bộ"
// (Priority trigger trong Advanced mode, UC-CAM-02 bước 2b) — cơ chế đó giữ nguyên, không đụng.
// Cơ chế ở đây là "Nhóm ưu tiên liên-campaign": sắp xếp thứ tự giữa nhiều CAMPAIGN khác nhau
// cùng dùng chung 1 trigger.

export interface PriorityGroupMember {
  campaign: Campaign
  position?: number // chỉ có với campaignType 'limited' — vị trí hiển thị trong bàn kéo-thả
}

export interface PriorityGroup {
  triggerCode: string
  limited: PriorityGroupMember[] // đã sort theo groupPositions tăng dần — đây là bàn kéo-thả
  ongoing: Campaign[] // đã sort theo createdAt sớm hơn trước (tiebreak) — không kéo-thả
}

// Parse "DD/MM/YYYY HH:mm" hoặc "DD/MM/YYYY" — dùng cho tiebreak createdAt (sớm hơn thắng).
function parseVnDateTime(d: string): number {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}))?/.exec(d)
  if (!m) return 0
  const [, dd, mm, yyyy, hh = '00', min = '00'] = m
  return new Date(Number(yyyy), Number(mm) - 1, Number(dd), Number(hh), Number(min)).getTime()
}

// Badge "Mới" (Assumption A2, solution Mục 2.3 + Mục 8) — campaign vừa được tự động thêm vào 1 nhóm
// trigger trong 24 giờ gần nhất. Solution doc dùng timestamp riêng `added_to_group_at`, nhưng mock
// data hiện tại chưa có field này — xấp xỉ bằng `createdAt` của campaign (assumption, không phải
// hành vi chốt: nếu 1 campaign đổi loại hình/gỡ-thêm lại nhóm nhiều lần, createdAt KHÔNG phản ánh
// đúng lần thêm gần nhất; SA/Dev cần field `added_to_group_at` riêng khi lên production thật).
export function isRecentlyAddedToGroup(campaign: Campaign, now: Date = new Date()): boolean {
  const addedAt = parseVnDateTime(campaign.createdAt)
  if (!addedAt) return false
  const diffMs = now.getTime() - addedAt
  return diffMs >= 0 && diffMs <= 24 * 60 * 60 * 1000
}

// Quét toàn bộ campaign Active → gom nhóm theo trigger (solution Mục 2.1, 2.2, 2.5).
// Chỉ campaign Active mới được tính vào nhóm (Draft/Pending/Paused/Ended không tham gia — Mục 2.2, 2.3).
// Trigger không có campaign Active nào dùng → không tạo nhóm (ẩn khỏi màn Cài đặt).
export function buildPriorityGroups(campaigns: Campaign[]): PriorityGroup[] {
  const active = campaigns.filter(c => c.status === 'Active')
  const triggerCodes = Array.from(new Set(active.flatMap(c => c.triggers))).sort()

  return triggerCodes.map(triggerCode => {
    const members = active.filter(c => c.triggers.includes(triggerCode))
    const limited = members
      .filter(c => c.campaignType !== 'ongoing')
      .sort((a, b) => (a.groupPositions?.[triggerCode] ?? 999) - (b.groupPositions?.[triggerCode] ?? 999))
      .map(c => ({ campaign: c, position: c.groupPositions?.[triggerCode] }))
    const ongoing = members
      .filter(c => c.campaignType === 'ongoing')
      .sort((a, b) => parseVnDateTime(a.createdAt) - parseVnDateTime(b.createdAt))
    return { triggerCode, limited, ongoing }
  }).filter(g => g.limited.length > 0 || g.ongoing.length > 0)
}

// Tất cả nhóm (theo mã trigger) mà 1 campaign cụ thể đang tham gia — phục vụ filter theo Campaign
// (solution Mục 2.1) và link điều hướng "Xem/Điều chỉnh tại Cài đặt →" (Mục 2.7).
export function groupsForCampaign(campaigns: Campaign[], campaignId: string): PriorityGroup[] {
  const groups = buildPriorityGroups(campaigns)
  return groups.filter(g =>
    g.limited.some(m => m.campaign.id === campaignId) || g.ongoing.some(c => c.id === campaignId)
  )
}

// Lý do khóa nút [Bật] (kích hoạt lại) của campaign Paused do cờ vô hiệu — null nếu không bị khóa.
// URD Khối 3 + UC-CAM-07: chỉ khóa khi param/điều kiện lọc VẪN đang bị Khóa (locked = true); nếu Admin
// đã Mở khóa lại (locked = false) thì [Bật] hoạt động lại — xem reactivateFlow nhánh 'toPrePauseStatus'.
export function reactivateBlockReason(c: Campaign): string | null {
  if (c.paramInvalid?.locked) return 'Campaign đang có tham số không hợp lệ do trigger đã thay đổi — vui lòng vào [Sửa] để cập nhật nội dung message trước khi gửi duyệt lại'
  if (c.filterInvalid?.locked) return 'Campaign đang có điều kiện lọc không hợp lệ do trigger đã thay đổi thuộc tính lọc — vui lòng vào [Sửa] để cập nhật điều kiện lọc trước khi gửi duyệt lại'
  return null
}

// Kết quả bấm [Bật] trên campaign Paused — 4 nhánh theo URD UC-CAM-07 (V4.13 bổ sung nhánh Mở khóa):
// 'blocked'            — param/điều kiện lọc VẪN đang Khóa, nút [Bật] disabled vĩnh viễn (dùng reactivateBlockReason)
// 'toPrePauseStatus'   — còn cờ PARAM_INVALID/FILTER_INVALID nhưng đã được Admin MỞ KHÓA lại → confirm,
//                        trả về đúng trạng thái gốc trước khi tự Paused (prePauseStatus), không tự Active thẳng
// 'toPending'          — param/điều kiện lọc trigger bị SỬA (không Khóa) trong lúc Paused → phải confirm, về Pending
// 'toActive'           — không có thay đổi gì → bật thẳng Active, không cần confirm (hành vi cũ)
export function reactivateFlow(c: Campaign): 'blocked' | 'toPrePauseStatus' | 'toPending' | 'toActive' {
  if (reactivateBlockReason(c)) return 'blocked'
  if (c.paramInvalid || c.filterInvalid) return 'toPrePauseStatus'
  if (c.pausedConfigChanged) return 'toPending'
  return 'toActive'
}

// Thứ tự ưu tiên hiển thị trạng thái tại Campaign List (URD Screen 2): Active → Pending → Paused → Draft → Ended
const STATUS_ORDER: Record<CampaignStatus, number> = {
  Active: 0, Pending: 1, Paused: 2, Draft: 3, Ended: 4,
}

// Sắp xếp mặc định Campaign List (CR Priority Redesign, solution Mục 3.4 / OQ-3): theo Trạng thái
// (thứ tự cố định ở trên) rồi đến Ngày tạo MỚI NHẤT trước — đổi từ "Ưu tiên tăng dần" cũ vì Ưu tiên
// không còn là 1 số đơn của campaign để sort toàn cục (có thể là N vị trí khác nhau theo nhóm).
export function sortCampaignsForList(campaigns: Campaign[]): Campaign[] {
  return [...campaigns].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (byStatus !== 0) return byStatus
    return parseVnDateTime(b.createdAt) - parseVnDateTime(a.createdAt)
  })
}

// campaign Active nhưng startDate vẫn ở tương lai so với "hôm nay" → vẫn giữ status Active nhưng hiển thị
// thêm badge phụ "Chưa tới ngày bắt đầu" (URD Screen 2 STT 8 / Screen 3 STT 2). Parse định dạng DD/MM/YYYY
// dùng chung trong toàn bộ mock data.
export function parseVnDate(d: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(d)
  if (!m) return null
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
}

export function isBeforeStart(c: Campaign, today: Date = new Date()): boolean {
  const start = parseVnDate(c.startDate)
  if (!start) return false
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return start.getTime() > todayOnly.getTime()
}

// Danh sách campaign đang dùng 1 trigger (theo mã trigger) — phục vụ cảnh báo khi Admin
// sửa/xóa điều kiện lọc của trigger đó. Không lọc theo trạng thái: mọi campaign dùng trigger
// đều liệt kê để Admin nắm phạm vi ảnh hưởng trước khi xác nhận.
export function campaignsUsingTrigger(campaigns: Campaign[], triggerCode: string): Campaign[] {
  return campaigns.filter(c => c.triggers.includes(triggerCode))
}

// Nội dung hiển thị tại field "Độ ưu tiên" (Section 1 Builder + Campaign List) — đúng bảng trạng thái
// Mục 2.7 solution doc. Field này KHÔNG BAO GIỜ cho nhập tay ở bất kỳ trạng thái nào (Assumption A8) —
// chỉ hiển thị dòng chữ tĩnh hoặc link điều hướng sang Cài đặt. kind='link' → component gọi nơi dùng
// tự render <button>/<a> điều hướng; các kind khác chỉ hiển thị text tĩnh.
export function priorityDisplayInfo(c: Campaign): { text: string; kind: 'static' | 'link' } {
  if (c.campaignType === 'ongoing') {
    return { text: 'Chiến dịch vận hành thường trực — không sử dụng cơ chế xếp hạng ưu tiên', kind: 'static' }
  }
  switch (c.status) {
    case 'Draft':
    case 'Pending':
      return { text: 'Độ ưu tiên sẽ được thiết lập tại Cài đặt sau khi chiến dịch được Duyệt và Kích hoạt', kind: 'static' }
    case 'Active':
      return { text: 'Xem/Điều chỉnh tại Cài đặt →', kind: 'link' }
    case 'Paused':
      return { text: 'Tạm dừng — không tham gia xếp hạng ưu tiên', kind: 'static' }
    case 'Ended':
      return { text: 'Đã kết thúc — không còn tham gia xếp hạng ưu tiên', kind: 'static' }
    default:
      return { text: '—', kind: 'static' }
  }
}

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatNumber(n: number): string {
  return n.toLocaleString('vi-VN')
}

export function formatDate(d: string): string {
  return d
}

export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
}

// Ngưỡng ký tự SMS/segment: 70 nếu nội dung có dấu tiếng Việt, 160 nếu không dấu (URD UC-CAM-02 STT 9).
// Phát hiện "có dấu" bằng cách so sánh với bản đã bỏ dấu qua removeVietnameseTones — khác nhau = có dấu.
export function smsSegmentInfo(text: string): { hasAccent: boolean; limit: 70 | 160; length: number; segments: number } {
  const hasAccent = text !== removeVietnameseTones(text)
  const limit = hasAccent ? 70 : 160
  const length = text.length
  const segments = length === 0 ? 1 : Math.ceil(length / limit)
  return { hasAccent, limit, length, segments }
}

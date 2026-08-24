import { type ClassValue, clsx } from 'clsx'
import type { Campaign, CampaignStatus } from '../types'

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

// Sắp xếp mặc định Campaign List: theo Trạng thái (thứ tự cố định ở trên) rồi đến Ưu tiên tăng dần.
export function sortCampaignsForList(campaigns: Campaign[]): Campaign[] {
  return [...campaigns].sort((a, b) => {
    const byStatus = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
    if (byStatus !== 0) return byStatus
    return a.priority - b.priority
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

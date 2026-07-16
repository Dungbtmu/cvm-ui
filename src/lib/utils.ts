import { type ClassValue, clsx } from 'clsx'
import type { Campaign } from '../types'

// Lý do khóa nút [Bật] (kích hoạt lại) của campaign Paused do cờ vô hiệu — null nếu không bị khóa.
// URD Khối 3: campaign còn cờ PARAM_INVALID / FILTER_INVALID không được bật thẳng, phải [Sửa] → gửi duyệt lại.
export function reactivateBlockReason(c: Campaign): string | null {
  if (c.paramInvalid) return 'Campaign đang có tham số không hợp lệ do trigger đã thay đổi — vui lòng vào [Sửa] để cập nhật nội dung message trước khi gửi duyệt lại'
  if (c.filterInvalid) return 'Campaign đang có điều kiện lọc không hợp lệ do trigger đã thay đổi thuộc tính lọc — vui lòng vào [Sửa] để cập nhật điều kiện lọc trước khi gửi duyệt lại'
  return null
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

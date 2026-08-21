export type CampaignStatus = 'Active' | 'Draft' | 'Pending' | 'Paused' | 'Ended'
export type TriggerType = 'Realtime' | 'Near Realtime' | 'Offline'
export type ChannelType = 'Push' | 'Zalo OA' | 'SMS' | 'Banner' | 'Email' | 'USSD'
export type TriggerLogic = 'OR' | 'AND'
export type BlackoutAction = 'discard' | 'delay'

export interface Campaign {
  id: string
  name: string
  code: string
  status: CampaignStatus
  triggers: string[]
  templateIds?: string[]
  startDate: string
  // Rỗng/undefined khi campaign chọn "Vô hạn" (isInfinite = true) — xem URD UC-CAM-02 STT "Thời gian hiệu lực".
  endDate?: string
  // true = không giới hạn ngày kết thúc; campaign chạy đến khi QTV/Admin chủ động [Dừng] (Kill Switch)
  isInfinite?: boolean
  priority: number
  owner: string
  createdAt: string
  submittedAt?: string
  goal?: string
  // Cờ campaign bị vô hiệu do trigger thay đổi — xem policy PARAM_INVALID / FILTER_INVALID (URD Khối 3)
  paramInvalid?: { triggerName: string; paramName: string }
  filterInvalid?: { triggerName: string; filterFieldName: string }
  // true = param/điều kiện lọc của trigger đang dùng bị Admin SỬA (không phải Khóa) trong lúc campaign Paused
  // — khác paramInvalid/filterInvalid (đó là do Khóa/Xóa, khóa vĩnh viễn nút Bật). Trường hợp này chỉ bắt buộc
  // Bật lại phải quay về Chờ duyệt thay vì Active thẳng (xem URD UC-CAM-07).
  pausedConfigChanged?: boolean
}

export interface Trigger {
  id: string
  code: string
  name: string
  source: 'BSS' | 'OCS' | 'SuperApp'
  type: TriggerType
  status: 'Active' | 'Inactive'
  supportedChannels?: ChannelType[]
  params: TriggerParam[]
  filterFields: TriggerFilterField[]
}

export interface TriggerParam {
  name: string
  description: string
  format: 'text' | 'date' | 'number' | 'boolean' | 'currency'
  source: string
  example?: string
  locked?: boolean          // Đã khóa (vô hiệu hóa tạm thời) — thay cho xóa cứng; QTV không chèn được vào message mới
}

// Thuộc tính dùng để lọc phân khúc (Section 3 — Campaign Builder), khai báo cùng lúc với trigger.
// Nguồn chuẩn: .claude/output/bss-mapping/trigger-sub-conditions.md
// operators được khai báo THẲNG per field (không suy máy móc từ dataType) — cùng 1 kiểu decimal
// nhưng mỗi field có thể hỗ trợ bộ toán tử khác nhau tùy nghiệp vụ.
export type FilterFieldDataType =
  | 'enum' | 'string' | 'integer' | 'decimal' | 'float' | 'boolean' | 'date' | 'datetime'

// Toán tử theo đúng danh mục gốc (giữ nguyên ký hiệu tiếng Anh để khớp file nguồn)
export type FilterOperator =
  | '=' | '!=' | '>' | '<' | '>=' | '<=' | 'BETWEEN' | 'IN' | 'NOT IN' | 'CONTAINS'
  | 'AFTER' | 'BEFORE' | 'IS NULL' | 'IS NOT NULL'

// Đơn vị hiển thị đi kèm thuộc tính lọc kiểu Số (integer/decimal/float) — thuộc tính hiển thị,
// không phải kiểu dữ liệu riêng. '%' giới hạn giá trị nhập 0-100; 'GB' chỉ cần >= 0.
export type FilterFieldUnit = 'none' | 'percent' | 'GB'

export interface TriggerFilterField {
  techName: string          // tên trường kỹ thuật — định danh duy nhất trong 1 trigger
  name: string              // tên nghiệp vụ để hiển thị
  dataType: FilterFieldDataType
  operators: string[]       // danh sách toán tử khả dụng, khai báo thẳng
  required: boolean         // Bắt buộc / Tùy chọn
  values: string[]          // chỉ có với enum (danh sách chọn); kiểu khác để trống → nhập tự do
  locked?: boolean          // Đã khóa (vô hiệu hóa tạm thời) — thay cho xóa cứng; QTV không chọn được khi cấu hình campaign mới
  unit?: FilterFieldUnit    // chỉ áp dụng cho kiểu Số — Không có (mặc định) / % / GB
}

export interface TemplateChannelContent {
  title?: string
  body?: string
  cta?: string
  ctaUrl?: string
  imageName?: string
}

export interface Template {
  id: string
  name: string
  description?: string
  channels: ChannelType[]
  usageCount: number
  status: 'Active' | 'Inactive'
  contents?: Partial<Record<ChannelType, TemplateChannelContent>>
  // Trigger áp dụng — không bắt buộc, chỉ dùng để nhóm hiển thị tại UC-TPL-00 (Danh sách Template);
  // KHÔNG giới hạn phạm vi dùng template khi soạn campaign (xem UC-TPL-01 Quy tắc nghiệp vụ).
  // Lưu mã trigger (Trigger.code) để tránh phụ thuộc vòng với danh sách trigger.
  triggerCodes?: string[]
}

// Phạm vi bản ghi Blacklist — 'campaign' (mặc định, theo cặp campaign-kênh) hoặc 'global' (Blacklist
// toàn hệ thống, chỉ Admin thao tác, áp dụng mọi campaign/mọi kênh — xem UC-BL-04/UC-BL-05).
export type BlacklistScope = 'campaign' | 'global'

export interface BlacklistEntry {
  phone: string
  campaign: string
  channel: ChannelType
  source: 'manual' | 'upload' | 'campaign'
  // Mặc định 'campaign' khi không có giá trị (tương thích ngược với mock data cũ) — xem BlacklistScope.
  scope?: BlacklistScope
}

export interface Customer {
  phone: string
  name: string
  simType: 'eSIM' | 'SIM vật lý'
  status: 'Active' | 'Inactive' | 'Suspended'
  hasApp: boolean
  hasDnc: boolean
}

export interface Segment {
  id: string
  name: string
  reach: number
  source: string
}

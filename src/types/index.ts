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
  endDate: string
  priority: number
  owner: string
  createdAt: string
  submittedAt?: string
  goal?: string
  // Cờ campaign bị vô hiệu do trigger thay đổi — xem policy PARAM_INVALID / FILTER_INVALID (URD Khối 3)
  paramInvalid?: { triggerName: string; paramName: string }
  filterInvalid?: { triggerName: string; filterFieldName: string }
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

export interface TriggerFilterField {
  techName: string          // tên trường kỹ thuật — định danh duy nhất trong 1 trigger
  name: string              // tên nghiệp vụ để hiển thị
  dataType: FilterFieldDataType
  operators: string[]       // danh sách toán tử khả dụng, khai báo thẳng
  required: boolean         // Bắt buộc / Tùy chọn
  values: string[]          // chỉ có với enum (danh sách chọn); kiểu khác để trống → nhập tự do
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
}

export interface BlacklistEntry {
  phone: string
  campaign: string
  channel: ChannelType
  source: 'manual' | 'upload' | 'campaign'
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

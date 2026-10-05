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
  // [DEPRECATED] Không còn dùng để hiển thị/tính toán kể từ CR Priority Redesign — giữ tạm field này
  // chỉ để tương thích ngược data cũ trong prototype, thay thế hoàn toàn bằng groupPositions (mô hình
  // "N vị trí độc lập theo nhóm trigger", xem URD II.6.8/UC-PRIORITY-01).
  priority: number
  // Vị trí trong từng nhóm trigger — key = mã trigger, value = index hiển thị (1-based) trong bàn kéo-thả
  // của nhóm đó. Chỉ có ý nghĩa với campaign status = 'Active'. Mô hình khái niệm "Campaign × Nhóm
  // Trigger → Vị trí" (URD II.6.8/UC-PRIORITY-01) — KHÔNG phải 1 số toàn cục. Mọi campaign Active (dù
  // có hay không có endDate) đều tham gia nhóm và bàn kéo-thả theo cùng 1 luật (V4.25).
  groupPositions?: Record<string, number>
  owner: string
  createdAt: string
  submittedAt?: string
  goal?: string
  // Cờ campaign bị vô hiệu do trigger thay đổi — xem policy PARAM_INVALID / FILTER_INVALID (URD Khối 3).
  // locked = true: param/điều kiện lọc VẪN đang bị Khóa — [Bật] khóa vĩnh viễn, chỉ resume qua [Sửa].
  // locked = false: param/điều kiện lọc đã được Admin MỞ KHÓA lại (cờ còn tồn tại) — [Bật] hoạt động lại,
  // trả về đúng trạng thái gốc trước khi tự Paused (prePauseStatus), không tự động chạy thẳng Active
  // (URD UC-CAM-07 nhánh 1c, V4.13).
  paramInvalid?: { triggerName: string; paramName: string; locked: boolean }
  filterInvalid?: { triggerName: string; filterFieldName: string; locked: boolean }
  // Trạng thái campaign trước khi tự động chuyển Paused do PARAM_INVALID/FILTER_INVALID — dùng để trả
  // đúng trạng thái gốc khi nhánh Mở khóa resume (URD UC-CAM-07 nhánh 1c, V4.13).
  prePauseStatus?: CampaignStatus
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
  // Trigger gắn cho template — multi-select, BẮT BUỘC ít nhất 1 trigger khi lưu (URD V4.18, UC-TPL-01).
  // Mục đích: lấy đúng bộ tham số động (hợp/union) của TẤT CẢ trigger đã chọn để soạn nhanh + chính xác,
  // KHÔNG phải để nhóm hiển thị. 1 template có thể tái sử dụng cho nhiều trigger có nội dung tương tự nhau.
  // Optional ở type-level vì lúc đang soạn (trước khi lưu) có thể chưa chọn trigger nào; UI validate bắt buộc
  // ít nhất 1 phần tử khi lưu. Lưu mã trigger (Trigger.code) để tránh phụ thuộc vòng với danh sách trigger.
  triggerCodes: string[]
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

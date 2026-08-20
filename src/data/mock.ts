import type { Campaign, Trigger, Template, BlacklistEntry, Customer, Segment } from '../types'

export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Welcome eSIM Q2/2026',
    code: 'CVM-WELCOME-ESIM-Q2-2026',
    status: 'Draft',
    triggers: ['E01', 'E02'],
    templateIds: ['1', '5'],
    startDate: '01/04/2026',
    endDate: '30/06/2026',
    priority: 1,
    owner: 'QTV Marketing',
    createdAt: '10/05/2026 14:32',
    submittedAt: '12/05/2026 09:15',
    goal: 'Onboard eSIM, nhắc cài app',
  },
  {
    id: '2',
    name: 'Nhắc nạp tiền',
    code: 'CVM-REMIND-TOPUP-05-2026',
    status: 'Active',
    triggers: ['E06'],
    templateIds: ['2'],
    startDate: '01/05/2026',
    endDate: '31/05/2026',
    priority: 2,
    owner: 'QTV Sales',
    createdAt: '28/04/2026 10:00',
  },
  {
    id: '3',
    name: 'Hết hạn gói data',
    code: 'CVM-DATA-EXPIRE-05-2026',
    status: 'Paused',
    triggers: ['U_PRE_EXPIRY'],
    templateIds: ['3'],
    startDate: '01/05/2026',
    endDate: '31/05/2026',
    priority: 3,
    owner: 'QTV Marketing',
    createdAt: '28/04/2026 11:00',
    paramInvalid: { triggerName: 'U_PRE_EXPIRY', paramName: 'ten_goi' },
  },
  {
    id: '4',
    name: 'Chào mừng du lịch',
    code: 'CVM-TRAVEL-PROMO-Q2',
    status: 'Paused',
    triggers: ['U09'],
    templateIds: ['1', '4'],
    startDate: '15/05/2026',
    endDate: '30/06/2026',
    priority: 4,
    owner: 'QTV Marketing',
    createdAt: '14/05/2026 08:00',
    filterInvalid: { triggerName: 'U09', filterFieldName: 'Số ngày gắn bó' },
  },
  {
    // Dính CẢ 2 cờ cùng lúc — dùng để test tooltip [Bật] + banner Builder hiện đồng thời
    // PARAM_INVALID và FILTER_INVALID (khác id 3/4 vốn mỗi cái chỉ dính 1 cờ).
    id: '12',
    name: 'Test dính cả 2 cờ',
    code: 'CVM-TEST-DUAL-FLAG',
    status: 'Paused',
    triggers: ['E01'],
    templateIds: ['1'],
    startDate: '01/06/2026',
    endDate: '31/12/2026',
    priority: 12,
    owner: 'QTV Marketing',
    createdAt: '20/08/2026 09:30',
    paramInvalid: { triggerName: 'E01', paramName: 'package_code' },
    filterInvalid: { triggerName: 'E01', filterFieldName: 'Loại SIM' },
  },
  {
    id: '7',
    name: 'Ưu đãi gói data sinh viên',
    code: 'CVM-STUDENT-DATA-Q2-2026',
    status: 'Pending',
    triggers: ['E01'],
    templateIds: ['1'],
    startDate: '20/05/2026',
    endDate: '31/08/2026',
    priority: 7,
    owner: 'QTV Marketing',
    createdAt: '19/05/2026 10:15',
    submittedAt: '19/05/2026 14:00',
    goal: 'Tăng tỉ lệ đăng ký gói data cho phân khúc sinh viên',
  },
  {
    id: '8',
    name: 'Nhắc gia hạn gói cước tháng 6',
    code: 'CVM-RENEW-PKG-06-2026',
    status: 'Pending',
    triggers: ['U_PRE_EXPIRY'],
    templateIds: ['3'],
    startDate: '25/05/2026',
    endDate: '30/06/2026',
    priority: 8,
    owner: 'QTV Sales',
    createdAt: '20/05/2026 08:00',
    submittedAt: '20/05/2026 11:45',
  },
  {
    id: '9',
    name: 'Khuyến mãi nạp tiền đầu tháng',
    code: 'CVM-TOPUP-PROMO-06-2026',
    status: 'Pending',
    triggers: ['E06'],
    templateIds: ['2'],
    startDate: '01/06/2026',
    endDate: '07/06/2026',
    priority: 9,
    owner: 'QTV Sales',
    createdAt: '21/05/2026 09:00',
    submittedAt: '21/05/2026 15:20',
    goal: 'Kích hoạt lại KH chưa nạp tiền trong 7 ngày',
  },
  {
    id: '10',
    name: 'Cài app nhận quà',
    code: 'CVM-APP-GIFT-06-2026',
    status: 'Pending',
    triggers: ['E02'],
    templateIds: ['5'],
    startDate: '01/06/2026',
    endDate: '15/06/2026',
    priority: 10,
    owner: 'QTV Marketing',
    createdAt: '21/05/2026 13:30',
    submittedAt: '22/05/2026 08:00',
    goal: 'Tăng tỉ lệ cài app trong 24h sau kích hoạt SIM',
  },
  {
    id: '6',
    name: 'Tết Nguyên Đán 2026',
    code: 'CVM-TET-2026-0001',
    status: 'Ended',
    triggers: ['E01', 'E06'],
    templateIds: ['1', '2', '4'],
    startDate: '20/01/2026',
    endDate: '10/02/2026',
    priority: 6,
    owner: 'QTV Marketing',
    createdAt: '15/01/2026 09:00',
    goal: 'Chúc Tết, khuyến mãi gói cước',
  },
  {
    id: '5',
    name: 'Giữ chân KH có nguy cơ rời mạng',
    code: 'CVM-RETENTION-Q2-2026',
    status: 'Active',
    triggers: ['E05', 'E13', 'E08', 'E02', 'U09', 'E06'],
    templateIds: ['2', '3', '5'],
    startDate: '01/05/2026',
    endDate: '30/06/2026',
    priority: 5,
    owner: 'QTV Marketing',
    createdAt: '13/05/2026 09:00',
    goal: 'Giảm churn rate, tăng engagement',
  },
  {
    // Campaign demo — Active, dùng trigger E01, CHƯA gắn cờ. Dùng làm campaign "sạch" để
    // demo trạng thái ban đầu trước khi set cờ thủ công (xem ghi chú DEMO SCRIPT bên dưới),
    // vì prototype UI không tự tính cờ khi Khóa param/filter ở Trigger Admin (giới hạn mock —
    // logic đó là backend thật, quét nội dung message thực tế đối chiếu param/filter bị khóa).
    id: '11',
    name: 'Demo test trigger E01',
    code: 'CVM-DEMO-TRIGGER-E01',
    status: 'Active',
    triggers: ['E01'],
    templateIds: ['1'],
    startDate: '01/06/2026',
    endDate: '31/12/2026',
    priority: 11,
    owner: 'QTV Marketing',
    createdAt: '20/08/2026 09:00',
    goal: 'Dữ liệu demo — test nghiệp vụ Trigger (Thêm/Sửa/Khóa param + điều kiện lọc)',
  },
]

// ── DEMO SCRIPT — hướng dẫn set cờ thủ công để demo chuỗi Trigger → Campaign ──
// Prototype không tự tính PARAM_INVALID/FILTER_INVALID khi Khóa ở Trigger Admin (đó là logic
// backend thật). Để demo "Khóa param/filter → campaign Active tự chuyển Paused + cảnh báo",
// set thủ công 1 trong 2 dòng dưới vào campaign id='11' phía trên rồi build lại:
//   status: 'Paused', paramInvalid: { triggerName: 'E01', paramName: 'package_code' }
//   status: 'Paused', filterInvalid: { triggerName: 'E01', filterFieldName: 'Loại SIM' }
// Sau đó vào Campaign List/Detail xem banner, tooltip [Bật], và mở [Sửa] xem banner trong Builder.

// Danh mục trigger + điều kiện lọc con — nguồn: .claude/output/bss-mapping/trigger-sub-conditions.md
// Điều kiện lọc (filterFields.operators) đồng bộ với file danh mục gốc. Params là dữ liệu mẫu
// cho prototype (danh mục gốc không đặc tả params) — Admin khai báo lại qua Trigger Admin khi cần.
// Danh mục trigger + điều kiện lọc con — trích từ ảnh danh mục CVM (giữ nguyên y ảnh).
// Đồng bộ với .claude/output/bss-mapping/trigger-sub-conditions.md. operators khai báo thẳng per field.
export const mockTriggers: Trigger[] = [
  {
    id: '1',
    code: 'E01',
    name: 'SIM kích hoạt lần đầu',
    source: 'OCS',
    type: 'Near Realtime',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'lifecycle_number', description: 'Số lần kích hoạt', format: 'text', source: 'OCS' },
      { name: 'package_code', description: 'Gói cước hiện tại', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'lifecycle_number', name: 'Số lần kích hoạt', dataType: 'integer',
        operators: ['=', '!=', '>', '>='], required: true, values: [],
      },
      {
        techName: 'activation_date', name: 'Ngày giờ kích hoạt', dataType: 'datetime',
        operators: ['BEFORE', 'AFTER', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'sim_type', name: 'Loại SIM', dataType: 'enum',
        operators: ['=', '!=', 'IN', 'NOT IN'], required: false, values: ['PHYSICAL', 'ESIM'],
      },
      {
        techName: 'package_code', name: 'Gói cước hiện tại', dataType: 'string',
        operators: ['=', '!=', 'IN', 'NOT IN', 'IS NULL'], required: false, values: [],
      },
      {
        techName: 'segment_age', name: 'Phân khúc tuổi', dataType: 'enum',
        operators: ['=', 'IN', 'NOT IN'], required: false, values: ['19-24'],
      },
      {
        techName: 'segment_job', name: 'Phân khúc nghề nghiệp', dataType: 'enum',
        operators: ['IN'], required: false, values: ['STUDENT', 'WORKER', 'OFFICE', 'DRIVER', 'OTHER'],
      },
      {
        techName: 'hours_since_activation', name: 'Số giờ từ khi kích hoạt', dataType: 'integer',
        operators: ['>=', '<='], required: true, values: [],
      },
      {
        techName: 'activation_source', name: 'Nguồn kích hoạt', dataType: 'enum',
        operators: ['IN'], required: false, values: ['AGENT', 'ONLINE', 'ESIM'],
      },
      {
        techName: 'nationality', name: 'Quốc tịch', dataType: 'enum',
        operators: ['IN', 'NOT IN'], required: false, values: ['VN', 'ROW'], locked: true,
      },
    ],
  },
  {
    id: '2',
    code: 'E02',
    name: 'Chưa cài app sau 24h kích hoạt SIM',
    source: 'BSS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['SMS', 'USSD', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'BSS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'BSS' },
      { name: 'sent_count', description: 'Số lần đã gửi trigger', format: 'text', source: 'BSS' },
    ],
    filterFields: [
      {
        techName: 'hours_since_activation', name: 'Số giờ từ khi kích hoạt', dataType: 'decimal',
        operators: ['>', '>=', '<', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'app_installed', name: 'Đã cài ứng dụng', dataType: 'boolean',
        operators: ['='], required: true, values: [],
      },
      {
        techName: 'app_install_time', name: 'Thời điểm cài app', dataType: 'datetime',
        operators: ['IS NULL', 'BEFORE', 'AFTER'], required: false, values: [],
      },
      {
        techName: 'sim_type', name: 'Loại SIM', dataType: 'enum',
        operators: ['IN', 'NOT IN'], required: false, values: ['PHYSICAL', 'ESIM'],
      },
      {
        techName: 'segment_age', name: 'Phân khúc tuổi', dataType: 'enum',
        operators: ['IN'], required: false, values: ['15-18', '19-24', '25-34'],
      },
      {
        techName: 'device_type', name: 'Loại thiết bị', dataType: 'enum',
        operators: ['IN'], required: false, values: ['ANDROID', 'IOS', 'FEATURE'],
      },
      {
        techName: 'sent_count', name: 'Số lần đã gửi trigger', dataType: 'integer',
        operators: ['=', '>=', '<='], required: false, values: [],
      },
    ],
  },
  {
    id: '3',
    code: 'E06',
    name: 'Cuộc gọi thất bại',
    source: 'OCS',
    type: 'Near Realtime',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'balance_amount', description: 'Số dư tài khoản chính', format: 'text', source: 'OCS' },
      { name: 'package_code', description: 'Gói đang dùng', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'call_result', name: 'Kết quả cuộc gọi', dataType: 'enum',
        operators: ['=', 'IN'], required: true, values: ['FAILED', 'BUSY', 'NO_ANSWER'],
      },
      {
        techName: 'failure_reason', name: 'Mã nguyên nhân lỗi', dataType: 'enum',
        operators: ['=', 'IN', 'NOT IN'], required: false, values: ['INSUFFICIENT_BALANCE'],
      },
      {
        techName: 'call_direction', name: 'Chiều cuộc gọi', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['OUTGOING'],
      },
      {
        techName: 'call_type', name: 'Loại cuộc gọi', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['ONNET', 'OFFNET', 'INTERNATIONAL'],
      },
      {
        techName: 'balance_amount', name: 'Số dư tài khoản chính', dataType: 'decimal',
        operators: ['<', '<=', '=', '>'], required: false, values: [],
      },
      {
        techName: 'fail_reason', name: 'Lý do thất bại', dataType: 'enum',
        operators: ['IN', 'NOT IN'], required: false, values: ['INSUFFICIENT_BALANCE', 'POOR_CONNECTION'],
      },
      {
        techName: 'package_code', name: 'Gói đang dùng', dataType: 'string',
        operators: ['IN', 'NOT IN'], required: false, values: [],
      },
    ],
  },
  {
    id: '4',
    code: 'E08',
    name: 'Data ngày sắp hết',
    source: 'OCS',
    type: 'Near Realtime',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'used_percent', description: 'Tỷ lệ data đã sử dụng (%)', format: 'text', source: 'OCS' },
      { name: 'remaining_data_mb', description: 'Dung lượng data còn lại (MB)', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'quota_type', name: 'Loại quota data', dataType: 'enum',
        operators: ['=', 'IN'], required: true, values: ['DAILY_DATA'],
      },
      {
        techName: 'used_percent', name: 'Tỷ lệ data đã sử dụng (%)', dataType: 'decimal',
        operators: ['>', '>=', '=', '<', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'remaining_data_mb', name: 'Dung lượng data còn lại (MB)', dataType: 'decimal',
        operators: ['<', '<=', '=', '>', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'total_quota_mb', name: 'Tổng dung lượng gói (MB)', dataType: 'decimal',
        operators: ['>', '>=', '='], required: false, values: [],
      },
      {
        techName: 'package_code', name: 'Mã gói data', dataType: 'string',
        operators: ['=', '!=', 'IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'threshold_crossed', name: 'Ngưỡng vừa bị vượt', dataType: 'boolean',
        operators: ['='], required: false, values: [],
      },
      {
        techName: 'days_remaining', name: 'Số ngày còn lại trong chu kỳ', dataType: 'integer',
        operators: ['>='], required: false, values: [],
      },
      {
        techName: 'addon_purchased_today', name: 'Đã mua gói bổ sung hôm nay', dataType: 'boolean',
        operators: ['='], required: true, values: [],
      },
      {
        techName: 'cycle_date', name: 'Ngày chu kỳ quota', dataType: 'date',
        operators: ['=', 'BETWEEN'], required: false, values: [],
      },
    ],
  },
  {
    id: '5',
    code: 'E_DATA_100',
    name: 'Hết 100% data',
    source: 'OCS',
    type: 'Near Realtime',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'remaining_data_mb', description: 'Data còn lại (MB)', format: 'text', source: 'OCS' },
      { name: 'used_percent', description: 'Tỷ lệ sử dụng (%)', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'quota_type', name: 'Loại quota', dataType: 'enum',
        operators: ['=', 'IN'], required: true, values: ['DATA'],
      },
      {
        techName: 'remaining_data_mb', name: 'Data còn lại (MB)', dataType: 'decimal',
        operators: ['=', '<=', '<'], required: true, values: [],
      },
      {
        techName: 'used_percent', name: 'Tỷ lệ sử dụng (%)', dataType: 'decimal',
        operators: ['=', '>=', '>'], required: false, values: [],
      },
      {
        techName: 'package_code', name: 'Mã gói', dataType: 'string',
        operators: ['=', 'IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'out_of_package_charge', name: 'Cho phép phát sinh cước ngoài gói', dataType: 'boolean',
        operators: ['='], required: false, values: [],
      },
    ],
  },
  {
    id: '6',
    code: 'E_VOICE_100_ONNET',
    name: 'Hết phút thoại nội mạng',
    source: 'OCS',
    type: 'Near Realtime',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'remaining_minutes', description: 'Số phút còn lại', format: 'text', source: 'OCS' },
      { name: 'package_code', description: 'Mã gói', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'quota_type', name: 'Loại quota thoại', dataType: 'enum',
        operators: ['='], required: true, values: ['VOICE_ONNET'],
      },
      {
        techName: 'remaining_minutes', name: 'Số phút còn lại', dataType: 'decimal',
        operators: ['=', '<=', '<'], required: true, values: [],
      },
      {
        techName: 'package_code', name: 'Mã gói', dataType: 'string',
        operators: ['=', 'IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'days_remaining', name: 'Số ngày còn lại trong chu kỳ', dataType: 'integer',
        operators: ['>='], required: false, values: [],
      },
      {
        techName: 'balance', name: 'Số dư tài khoản (đồng)', dataType: 'decimal',
        operators: ['>='], required: false, values: [],
      },
      {
        techName: 'cycle_end_time', name: 'Thời điểm kết thúc chu kỳ', dataType: 'datetime',
        operators: ['BEFORE', 'AFTER', 'BETWEEN'], required: false, values: [],
      },
    ],
  },
  {
    id: '7',
    code: 'E_VOICE_100_OFFNET',
    name: 'Hết phút thoại ngoại mạng',
    source: 'OCS',
    type: 'Near Realtime',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'remaining_minutes', description: 'Số phút còn lại', format: 'text', source: 'OCS' },
      { name: 'package_code', description: 'Mã gói', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'quota_type', name: 'Loại quota thoại', dataType: 'enum',
        operators: ['='], required: true, values: ['VOICE_OFFNET'],
      },
      {
        techName: 'remaining_minutes', name: 'Số phút còn lại', dataType: 'decimal',
        operators: ['=', '<=', '<'], required: true, values: [],
      },
      {
        techName: 'package_code', name: 'Mã gói', dataType: 'string',
        operators: ['=', 'IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'balance', name: 'Số dư tài khoản (đồng)', dataType: 'decimal',
        operators: ['>='], required: false, values: [],
      },
      {
        techName: 'out_of_package_rate', name: 'Đơn giá ngoài gói', dataType: 'decimal',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
    ],
  },
  {
    id: '8',
    code: 'E_ZERO_BALANCE',
    name: 'Số dư TKC về 0',
    source: 'OCS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'balance_before', description: 'Số dư trước giao dịch', format: 'text', source: 'OCS' },
      { name: 'balance_after', description: 'Số dư sau giao dịch', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'account_type', name: 'Loại tài khoản', dataType: 'enum',
        operators: ['='], required: true, values: ['MAIN'],
      },
      {
        techName: 'balance_before', name: 'Số dư trước giao dịch', dataType: 'decimal',
        operators: ['>', '>='], required: false, values: [],
      },
      {
        techName: 'balance_after', name: 'Số dư sau giao dịch', dataType: 'decimal',
        operators: ['=', '<=', '<'], required: true, values: [],
      },
      {
        techName: 'transaction_type', name: 'Loại giao dịch làm giảm số dư', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['CALL', 'DATA', 'SMS', 'FEE'],
      },
      {
        techName: 'plan_expiry_date', name: 'Ngày hết hạn gói', dataType: 'date',
        operators: ['BEFORE', 'AFTER'], required: false, values: [],
      },
      {
        techName: 'topup_count_30d', name: 'Số lần nạp trong 30 ngày gần nhất', dataType: 'integer',
        operators: ['>=', '<='], required: false, values: [],
      },
      {
        techName: 'package_code', name: 'Gói đang dùng', dataType: 'string',
        operators: ['IN', 'NOT IN'], required: false, values: [],
      },
    ],
  },
  {
    id: '9',
    code: 'E_CANCEL_PLAN',
    name: 'Hủy gói cước',
    source: 'OCS',
    type: 'Near Realtime',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'package_code', description: 'Mã gói bị hủy', format: 'text', source: 'OCS' },
      { name: 'balance', description: 'Số dư tài khoản (đồng)', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'action_type', name: 'Loại hành động gói', dataType: 'enum',
        operators: ['='], required: true, values: ['CANCEL'],
      },
      {
        techName: 'package_code', name: 'Mã gói bị hủy', dataType: 'string',
        operators: ['=', 'IN', 'NOT IN'], required: true, values: [],
      },
      {
        techName: 'cancelled_plan_type', name: 'Loại gói vừa hủy', dataType: 'enum',
        operators: ['IN'], required: false, values: ['DATA', 'VOICE', 'COMBO'],
      },
      {
        techName: 'balance', name: 'Số dư tài khoản (đồng)', dataType: 'decimal',
        operators: ['>=', '<='], required: false, values: [],
      },
      {
        techName: 'subscriber_tenure_days', name: 'Số ngày KH đã dùng mạng', dataType: 'integer',
        operators: ['>=', '<='], required: false, values: [],
      },
      {
        techName: 'cancel_reason', name: 'Lý do hủy', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['CUSTOMER_REQUEST'],
      },
      {
        techName: 'auto_renew', name: 'Gói có tự động gia hạn', dataType: 'boolean',
        operators: ['='], required: false, values: [],
      },
      {
        techName: 'days_used', name: 'Số ngày đã sử dụng gói', dataType: 'integer',
        operators: ['<', '<=', '>', '>=', 'BETWEEN'], required: false, values: [],
      },
    ],
  },
  {
    id: '10',
    code: 'U01',
    name: 'Nạp tiền thành công lần >= 2',
    source: 'OCS',
    type: 'Near Realtime',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'topup_count', description: 'Số lần nạp thành công', format: 'text', source: 'OCS' },
      { name: 'topup_amount', description: 'Số tiền nạp', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'topup_status', name: 'Trạng thái nạp tiền', dataType: 'enum',
        operators: ['='], required: true, values: ['SUCCESS'],
      },
      {
        techName: 'topup_count', name: 'Số lần nạp thành công', dataType: 'integer',
        operators: ['=', '>', '>='], required: true, values: [],
      },
      {
        techName: 'topup_amount', name: 'Số tiền nạp', dataType: 'decimal',
        operators: ['>', '>=', '=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'topup_channel', name: 'Kênh nạp', dataType: 'enum',
        operators: ['=', 'IN', 'NOT IN'], required: false, values: ['APP', 'BANK', 'RETAIL'],
      },
      {
        techName: 'balance_after', name: 'Số dư sau nạp', dataType: 'decimal',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'package_code', name: 'Gói đang dùng', dataType: 'string',
        operators: ['IN', 'NOT IN'], required: false, values: [],
      },
    ],
  },
  {
    id: '11',
    code: 'U03',
    name: 'Tra cứu số dư / gắn gợi ý inline',
    source: 'OCS',
    type: 'Realtime',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'balance_amount', description: 'Số dư hiện tại', format: 'text', source: 'OCS' },
      { name: 'query_count_period', description: 'Số lần tra cứu trong kỳ', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'ussd_code', name: 'Mã USSD truy vấn', dataType: 'string',
        operators: ['=', 'IN'], required: true, values: [],
      },
      {
        techName: 'balance_amount', name: 'Số dư hiện tại', dataType: 'decimal',
        operators: ['<', '<=', '>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'query_count_period', name: 'Số lần tra cứu trong kỳ', dataType: 'integer',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'package_code', name: 'Gói đang dùng', dataType: 'string',
        operators: ['IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'plan_expiry_date', name: 'Ngày hết hạn gói', dataType: 'date',
        operators: ['BEFORE'], required: false, values: [],
      },
      {
        techName: 'data_used_pct', name: '% data chu kỳ đã dùng', dataType: 'float',
        operators: ['>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'response_channel', name: 'Kênh phản hồi', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['USSD'],
      },
    ],
  },
  {
    id: '12',
    code: 'E05',
    name: 'Chưa phát sinh cước sau 72h',
    source: 'OCS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'data_usage_mb', description: 'Tổng data đã dùng', format: 'text', source: 'OCS' },
      { name: 'voice_usage_sec', description: 'Tổng giây thoại', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'hours_since_activation', name: 'Số giờ từ kích hoạt', dataType: 'integer',
        operators: ['>', '>=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'data_usage_mb', name: 'Tổng data đã dùng', dataType: 'decimal',
        operators: ['=', '<=', '<'], required: true, values: [],
      },
      {
        techName: 'voice_usage_sec', name: 'Tổng giây thoại', dataType: 'integer',
        operators: ['=', '<=', '<'], required: true, values: [],
      },
      {
        techName: 'sms_count', name: 'Số SMS', dataType: 'integer',
        operators: ['=', '<=', '<'], required: true, values: [],
      },
      {
        techName: 'charge_amount', name: 'Tổng cước phát sinh', dataType: 'decimal',
        operators: ['=', '<=', '<'], required: false, values: [],
      },
      {
        techName: 'device_type', name: 'Loại thiết bị', dataType: 'enum',
        operators: ['IN'], required: false, values: ['ANDROID', 'IOS', 'FEATURE_PHONE'],
      },
      {
        techName: 'has_app', name: 'Đã cài app chưa', dataType: 'boolean',
        operators: ['='], required: false, values: [],
      },
    ],
  },
  {
    id: '13',
    code: 'E13',
    name: 'Tăng đột biến lưu lượng bất thường',
    source: 'SuperApp',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'Zalo OA', 'SMS'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'current_usage', description: 'Lưu lượng kỳ hiện tại', format: 'text', source: 'SuperApp' },
      { name: 'baseline_avg_30d', description: 'Trung bình 30 ngày', format: 'text', source: 'SuperApp' },
    ],
    filterFields: [
      {
        techName: 'metric_type', name: 'Loại lưu lượng', dataType: 'enum',
        operators: ['=', 'IN'], required: true, values: ['DATA', 'VOICE', 'SMS'],
      },
      {
        techName: 'current_usage', name: 'Lưu lượng kỳ hiện tại', dataType: 'decimal',
        operators: ['>', '>=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'baseline_avg_30d', name: 'Trung bình 30 ngày', dataType: 'decimal',
        operators: ['>', '>=', '='], required: true, values: [],
      },
      {
        techName: 'traffic_spike_mb', name: 'Lưu lượng trong giờ đột biến (MB)', dataType: 'float',
        operators: ['>=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'spike_hour', name: 'Giờ xảy ra đột biến (0–23)', dataType: 'integer',
        operators: ['>=', '<=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'spike_ratio', name: 'Tỷ lệ tăng so với baseline', dataType: 'decimal',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'device_type', name: 'Loại thiết bị', dataType: 'enum',
        operators: ['IN'], required: false, values: ['ANDROID', 'IOS'],
      },
      {
        techName: 'min_absolute_delta', name: 'Mức tăng tuyệt đối tối thiểu', dataType: 'decimal',
        operators: ['>', '>='], required: false, values: [],
      },
    ],
  },
  {
    id: '14',
    code: 'U02',
    name: 'Đăng ký/gia hạn gói thành công lần >= 2',
    source: 'OCS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'success_count', description: 'Số lần thành công', format: 'text', source: 'OCS' },
      { name: 'package_code', description: 'Mã gói', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'transaction_type', name: 'Loại giao dịch gói', dataType: 'enum',
        operators: ['=', 'IN'], required: true, values: ['REGISTER', 'RENEW'],
      },
      {
        techName: 'transaction_status', name: 'Trạng thái giao dịch', dataType: 'enum',
        operators: ['='], required: true, values: ['SUCCESS'],
      },
      {
        techName: 'success_count', name: 'Số lần thành công', dataType: 'integer',
        operators: ['=', '>', '>='], required: true, values: [],
      },
      {
        techName: 'package_code', name: 'Mã gói', dataType: 'string',
        operators: ['=', 'IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'plan_name', name: 'Tên gói đã đăng ký', dataType: 'string',
        operators: ['IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'plan_type', name: 'Loại gói đã đăng ký', dataType: 'enum',
        operators: ['IN'], required: false, values: ['DATA', 'VOICE', 'COMBO'],
      },
      {
        techName: 'plan_expiry_date', name: 'Ngày hết hạn gói', dataType: 'date',
        operators: ['AFTER'], required: false, values: [],
      },
      {
        techName: 'transaction_amount', name: 'Giá trị giao dịch', dataType: 'decimal',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
    ],
  },
  {
    id: '15',
    code: 'U04',
    name: 'Nhận OTP từ app bên thứ 3',
    source: 'OCS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'otp_count', description: 'Số lần nhận OTP trong ngày', format: 'text', source: 'OCS' },
      { name: 'package_code', description: 'Gói data hiện tại', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'otp_detected', name: 'Có phát sinh OTP', dataType: 'boolean',
        operators: ['='], required: true, values: [],
      },
      {
        techName: 'otp_count', name: 'Số lần nhận OTP trong ngày', dataType: 'integer',
        operators: ['>='], required: true, values: [],
      },
      {
        techName: 'app_category', name: 'Danh mục ứng dụng gửi OTP', dataType: 'enum',
        operators: ['IN'], required: false, values: ['BANKING', 'ECOMMERCE', 'TRANSPORT', 'FINANCE', 'SOCIAL'],
      },
      {
        techName: 'package_code', name: 'Gói data hiện tại', dataType: 'string',
        operators: ['IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'sender_brandname', name: 'Brandname gửi OTP', dataType: 'string',
        operators: ['=', 'IN', 'NOT IN', 'CONTAINS'], required: false, values: [],
      },
      {
        techName: 'otp_count_period', name: 'Số OTP trong kỳ', dataType: 'integer',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'period_days', name: 'Số ngày quan sát', dataType: 'integer',
        operators: ['=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'app_category', name: 'Nhóm ứng dụng', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['ECOMMERCE', 'TRANSPORT', 'FINANCE'],
      },
    ],
  },
  {
    id: '16',
    code: 'U05-A',
    name: 'Hết data tháng sớm 2 tháng liên tiếp',
    source: 'OCS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'early_depletion_count', description: 'Số tháng hết data sớm liên tiếp', format: 'text', source: 'OCS' },
      { name: 'depletion_day', description: 'Ngày hết data trong chu kỳ', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'package_cycle', name: 'Chu kỳ gói', dataType: 'enum',
        operators: ['='], required: true, values: ['MONTHLY'],
      },
      {
        techName: 'early_depletion_count', name: 'Số tháng hết data sớm liên tiếp', dataType: 'integer',
        operators: ['>', '>=', '='], required: true, values: [],
      },
      {
        techName: 'depletion_day', name: 'Ngày hết data trong chu kỳ', dataType: 'integer',
        operators: ['<', '<=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'remaining_cycle_days', name: 'Số ngày còn lại khi hết data', dataType: 'integer',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'quota_type', name: 'Loại quota data', dataType: 'enum',
        operators: ['IN'], required: true, values: ['MONTHLY'],
      },
      {
        techName: 'package_code', name: 'Mã gói data tháng', dataType: 'string',
        operators: ['IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'avg_monthly_usage_mb', name: 'Data trung bình tháng', dataType: 'decimal',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
    ],
  },
  {
    id: '17',
    code: 'U05-B',
    name: 'Pattern hết quota data ngày thường xuyên',
    source: 'OCS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'depletion_days_count', description: 'Số ngày hết quota trong kỳ', format: 'text', source: 'OCS' },
      { name: 'observation_days', description: 'Số ngày quan sát', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'package_cycle', name: 'Chu kỳ quota', dataType: 'enum',
        operators: ['='], required: true, values: ['DAILY'],
      },
      {
        techName: 'depletion_days_count', name: 'Số ngày hết quota trong kỳ', dataType: 'integer',
        operators: ['>', '>=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'observation_days', name: 'Số ngày quan sát', dataType: 'integer',
        operators: ['='], required: true, values: [],
      },
      {
        techName: 'depletion_ratio', name: 'Tỷ lệ ngày hết quota', dataType: 'decimal',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'daily_quota_mb', name: 'Hạn mức data ngày của gói (MB)', dataType: 'integer',
        operators: ['>=', '<=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'package_code', name: 'Gói data ngày đang dùng', dataType: 'string',
        operators: ['IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'quota_type', name: 'Loại quota data', dataType: 'enum',
        operators: ['IN'], required: true, values: ['DAILY'],
      },
      {
        techName: 'avg_depletion_hour', name: 'Giờ trung bình hết quota', dataType: 'decimal',
        operators: ['<', '<=', 'BETWEEN'], required: false, values: [],
      },
    ],
  },
  {
    id: '18',
    code: 'U06',
    name: 'Chuyển đổi loại gói thành công',
    source: 'OCS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'price_delta', description: 'Chênh lệch giá gói', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'change_status', name: 'Trạng thái chuyển gói', dataType: 'enum',
        operators: ['='], required: true, values: ['SUCCESS'],
      },
      {
        techName: 'old_package_code', name: 'Mã gói cũ', dataType: 'string',
        operators: ['=', 'IN', 'NOT IN'], required: true, values: [],
      },
      {
        techName: 'new_package_code', name: 'Mã gói mới', dataType: 'string',
        operators: ['=', 'IN', 'NOT IN'], required: true, values: [],
      },
      {
        techName: 'change_type', name: 'Loại chuyển đổi', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['UPGRADE', 'DOWNGRADE', 'LATERAL'],
      },
      {
        techName: 'price_delta', name: 'Chênh lệch giá gói', dataType: 'decimal',
        operators: ['<', '>', '=', 'BETWEEN'], required: false, values: [],
      },
    ],
  },
  {
    id: '19',
    code: 'U07',
    name: 'Chuyển đổi SIM nội mạng',
    source: 'BSS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['SMS', 'USSD', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'BSS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'BSS' },
    ],
    filterFields: [
      {
        techName: 'sim_change_status', name: 'Trạng thái đổi SIM', dataType: 'enum',
        operators: ['='], required: true, values: ['SUCCESS'],
      },
      {
        techName: 'old_sim_type', name: 'Loại SIM cũ', dataType: 'enum',
        operators: ['=', 'IN'], required: true, values: ['PHYSICAL', 'ESIM'],
      },
      {
        techName: 'new_sim_type', name: 'Loại SIM mới', dataType: 'enum',
        operators: ['=', 'IN'], required: true, values: ['PHYSICAL', 'ESIM'],
      },
      {
        techName: 'sim_change_reason', name: 'Lý do đổi SIM', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['LOST', 'DAMAGED', 'ESIM_CONVERSION'],
      },
      {
        techName: 'is_same_msisdn', name: 'Giữ nguyên số thuê bao', dataType: 'boolean',
        operators: ['='], required: false, values: [],
      },
    ],
  },
  {
    id: '20',
    code: 'U09',
    name: 'Sinh nhật / kỷ niệm KH hoặc SIM',
    source: 'BSS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['SMS', 'USSD', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'BSS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'BSS' },
      { name: 'days_to_anniversary', description: 'Số ngày đến dịp kỷ niệm', format: 'text', source: 'BSS' },
      { name: 'customer_tenure_days', description: 'Số ngày gắn bó', format: 'text', source: 'BSS' },
    ],
    filterFields: [
      {
        techName: 'anniversary_type', name: 'Loại ngày kỷ niệm', dataType: 'enum',
        operators: ['=', 'IN'], required: true, values: ['BIRTHDAY', 'SUBSCRIPTION_ANNIVERSARY'],
      },
      {
        techName: 'days_to_anniversary', name: 'Số ngày đến dịp kỷ niệm', dataType: 'integer',
        operators: ['=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'customer_tenure_days', name: 'Số ngày gắn bó', dataType: 'integer',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'date_of_birth', name: 'Ngày sinh', dataType: 'date',
        operators: ['=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'event_date', name: 'Ngày diễn ra sự kiện kỷ niệm', dataType: 'date',
        operators: ['='], required: false, values: [],
      },
      {
        techName: 'activation_date', name: 'Ngày kích hoạt', dataType: 'date',
        operators: ['=', 'BETWEEN'], required: false, values: [],
      },
    ],
  },
  {
    id: '21',
    code: 'U10',
    name: 'Ngày lễ / sự kiện quốc gia',
    source: 'BSS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['SMS', 'USSD', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'BSS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'BSS' },
      { name: 'days_before_event', description: 'Số ngày gửi trước', format: 'text', source: 'BSS' },
    ],
    filterFields: [
      {
        techName: 'holiday_code', name: 'Mã ngày lễ/sự kiện', dataType: 'string',
        operators: ['=', 'IN'], required: true, values: [],
      },
      {
        techName: 'event_date', name: 'Ngày diễn ra', dataType: 'date',
        operators: ['=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'days_before_event', name: 'Số ngày gửi trước', dataType: 'integer',
        operators: ['=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'nationality', name: 'Quốc tịch', dataType: 'enum',
        operators: ['=', 'IN', 'NOT IN'], required: false, values: ['VN'],
      },
      {
        techName: 'region_code', name: 'Khu vực', dataType: 'string',
        operators: ['=', 'IN', 'NOT IN'], required: false, values: [],
      },
    ],
  },
  {
    id: '22',
    code: 'E_USAGE_NEED_ANALYSIS',
    name: 'Phân tích nhu cầu gói theo mức sử dụng',
    source: 'OCS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'depletion_count', description: 'Số lần hết data sớm trong 3 tháng', format: 'text', source: 'OCS' },
      { name: 'package_code', description: 'Gói hiện tại', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'analysis_metric', name: 'Chỉ tiêu phân tích', dataType: 'enum',
        operators: ['=', 'IN'], required: true, values: ['DATA', 'VOICE', 'SMS', 'ARPU'],
      },
      {
        techName: 'depletion_count', name: 'Số lần hết data sớm trong 3 tháng', dataType: 'integer',
        operators: ['>='], required: false, values: [],
      },
      {
        techName: 'package_code', name: 'Gói hiện tại', dataType: 'string',
        operators: ['IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'package_cycle', name: 'Chu kỳ gói', dataType: 'enum',
        operators: ['IN'], required: false, values: ['MONTHLY', 'DAILY', 'WEEKLY'],
      },
      {
        techName: 'avg_usage_30d', name: 'Sử dụng trung bình 30 ngày', dataType: 'decimal',
        operators: ['<', '<=', '>', '>=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'quota_utilization', name: 'Tỷ lệ sử dụng quota', dataType: 'decimal',
        operators: ['<', '<=', '>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'out_of_package_charge_30d', name: 'Cước ngoài gói 30 ngày', dataType: 'decimal',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'recommended_package_code', name: 'Mã gói được đề xuất', dataType: 'string',
        operators: ['=', 'IN'], required: false, values: [],
      },
    ],
  },
  {
    id: '23',
    code: 'E_NO_PLAN_X_DAYS',
    name: 'ACTIVE nhưng không có gói x ngày',
    source: 'OCS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'active_package_count', description: 'Số gói đang hoạt động', format: 'text', source: 'OCS' },
      { name: 'days_without_plan', description: 'Số ngày không có gói', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'active_package_count', name: 'Số gói đang hoạt động', dataType: 'integer',
        operators: ['=', '<=', '<'], required: true, values: [],
      },
      {
        techName: 'days_without_plan', name: 'Số ngày không có gói', dataType: 'integer',
        operators: ['>', '>=', '=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'last_package_code', name: 'Gói đăng ký gần nhất', dataType: 'string',
        operators: ['IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'balance', name: 'Số dư tài khoản (đồng)', dataType: 'decimal',
        operators: ['>='], required: false, values: [],
      },
      {
        techName: 'last_package_end_date', name: 'Ngày gói gần nhất hết hạn', dataType: 'date',
        operators: ['BEFORE', 'AFTER', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'subscriber_status', name: 'Trạng thái thuê bao', dataType: 'enum',
        operators: ['='], required: true, values: ['ACTIVE'],
      },
      {
        techName: 'recent_usage_amount', name: 'Mức sử dụng gần đây', dataType: 'decimal',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
    ],
  },
  {
    id: '24',
    code: 'E_CHURN_RISK',
    name: 'Thuê bao có nguy cơ rời mạng',
    source: 'OCS',
    type: 'Near Realtime',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'no_usage_days', description: 'Số ngày liên tiếp không phát sinh lưu lượng', format: 'text', source: 'OCS' },
      { name: 'no_charge_days', description: 'Số ngày không phát sinh cước', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'no_usage_days', name: 'Số ngày liên tiếp không phát sinh lưu lượng', dataType: 'integer',
        operators: ['>=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'no_charge_days', name: 'Số ngày không phát sinh cước', dataType: 'integer',
        operators: ['>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'revenue_drop_pct', name: '% suy giảm doanh thu so với TB 2 tháng gần nhất', dataType: 'float',
        operators: ['>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'sim_on_off_ratio', name: 'Tỷ lệ bật/tắt sóng của SIM trong kỳ', dataType: 'float',
        operators: ['>=', '<='], required: false, values: [],
      },
      {
        techName: 'churn_risk_level', name: 'Mức độ nguy cơ', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['HIGH', 'MEDIUM'],
      },
      {
        techName: 'current_plan', name: 'Gói đang dùng (nếu còn)', dataType: 'string',
        operators: ['IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'subscriber_tenure_days', name: 'Tuổi thuê bao (số ngày đã dùng mạng)', dataType: 'integer',
        operators: ['>=', '<='], required: false, values: [],
      },
    ],
  },
  {
    id: '25',
    code: 'E_SEGMENT_UPDATE',
    name: 'Cập nhật phân khúc KH',
    source: 'OCS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'segment_score', description: 'Điểm phân khúc', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'old_segment', name: 'Phân khúc cũ', dataType: 'string',
        operators: ['=', 'IN', 'NOT IN'], required: true, values: [],
      },
      {
        techName: 'new_segment', name: 'Phân khúc mới', dataType: 'string',
        operators: ['=', 'IN', 'NOT IN'], required: true, values: [],
      },
      {
        techName: 'segment_changed', name: 'Có thay đổi phân khúc', dataType: 'boolean',
        operators: ['='], required: true, values: [],
      },
      {
        techName: 'segment_score', name: 'Điểm phân khúc', dataType: 'decimal',
        operators: ['>', '>=', '<', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'effective_date', name: 'Ngày hiệu lực phân khúc', dataType: 'date',
        operators: ['BEFORE', 'AFTER', 'BETWEEN'], required: false, values: [],
      },
    ],
  },
  {
    id: '26',
    code: 'E03',
    name: 'Đăng nhập app lần đầu',
    source: 'SuperApp',
    type: 'Realtime',
    status: 'Active',
    supportedChannels: ['Push', 'Zalo OA', 'SMS'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'open_count', description: 'Số lần mở app', format: 'text', source: 'SuperApp' },
      { name: 'registration_age_hours', description: 'Số giờ từ đăng ký/kích hoạt', format: 'text', source: 'SuperApp' },
    ],
    filterFields: [
      {
        techName: 'open_count', name: 'Số lần mở app', dataType: 'integer',
        operators: ['='], required: true, values: [],
      },
      {
        techName: 'login_status', name: 'Trạng thái đăng nhập', dataType: 'enum',
        operators: ['='], required: true, values: ['SUCCESS'],
      },
      {
        techName: 'app_version', name: 'Phiên bản ứng dụng', dataType: 'string',
        operators: ['=', 'IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'device_os', name: 'Hệ điều hành', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['ANDROID', 'IOS'],
      },
      {
        techName: 'registration_age_hours', name: 'Số giờ từ đăng ký/kích hoạt', dataType: 'integer',
        operators: ['<', '<=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'hours_since_activation', name: 'Số giờ từ khi kích hoạt SIM', dataType: 'integer',
        operators: ['>=', '<=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'package_code', name: 'Gói đang dùng', dataType: 'string',
        operators: ['IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'balance', name: 'Số dư TKC tại thời điểm đăng nhập (đồng)', dataType: 'decimal',
        operators: ['>=', '<='], required: false, values: [],
      },
      {
        techName: 'devide_type', name: 'Loại thiết bị', dataType: 'enum',
        operators: ['IN'], required: false, values: ['ANDROID/IOS'],
      },
    ],
  },
  {
    id: '27',
    code: 'E_CONTENT_FAIL',
    name: 'Mua dịch vụ nội dung thất bại',
    source: 'SuperApp',
    type: 'Near Realtime',
    status: 'Active',
    supportedChannels: ['Push', 'Zalo OA', 'SMS'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'purchase_amount', description: 'Giá trị giao dịch', format: 'text', source: 'SuperApp' },
      { name: 'balance', description: 'Số dư TKC tại thời điểm thất bại (đồng)', format: 'text', source: 'SuperApp' },
    ],
    filterFields: [
      {
        techName: 'purchase_status', name: 'Trạng thái mua dịch vụ', dataType: 'enum',
        operators: ['='], required: true, values: ['FAILED'],
      },
      {
        techName: 'content_code', name: 'Mã dịch vụ nội dung', dataType: 'string',
        operators: ['=', 'IN', 'NOT IN'], required: true, values: [],
      },
      {
        techName: 'failure_reason', name: 'Nguyên nhân thất bại', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['INSUFFICIENT_BALANCE', 'TIMEOUT'],
      },
      {
        techName: 'purchase_amount', name: 'Giá trị giao dịch', dataType: 'decimal',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'balance', name: 'Số dư TKC tại thời điểm thất bại (đồng)', dataType: 'decimal',
        operators: ['>=', '<='], required: false, values: [],
      },
      {
        techName: 'content_type', name: 'Loại dịch vụ nội dung', dataType: 'enum',
        operators: ['IN'], required: false, values: ['MUSIC', 'VIDEO', 'GAME', 'NEWS'],
      },
      {
        techName: 'retry_count', name: 'Số lần thử lại', dataType: 'integer',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
    ],
  },
  {
    id: '28',
    code: 'E_APP_RATING',
    name: 'KH đánh giá app',
    source: 'SuperApp',
    type: 'Near Realtime',
    status: 'Active',
    supportedChannels: ['Push', 'Zalo OA', 'SMS'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'rating_score', description: 'Điểm đánh giá', format: 'text', source: 'SuperApp' },
      { name: 'rating_count', description: 'Số lần đã đánh giá', format: 'text', source: 'SuperApp' },
    ],
    filterFields: [
      {
        techName: 'rating_score', name: 'Điểm đánh giá', dataType: 'integer',
        operators: ['=', '<=', '<', '>', '>=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'has_comment', name: 'Có bình luận', dataType: 'boolean',
        operators: ['='], required: false, values: [],
      },
      {
        techName: 'rating_topic', name: 'Chủ đề đánh giá', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['QUALITY', 'PRICE', 'UX'],
      },
      {
        techName: 'app_version', name: 'Phiên bản ứng dụng', dataType: 'string',
        operators: ['=', 'IN'], required: false, values: [],
      },
      {
        techName: 'rating_count', name: 'Số lần đã đánh giá', dataType: 'integer',
        operators: ['=', '<', '>'], required: false, values: [],
      },
    ],
  },
  {
    id: '29',
    code: 'E04',
    name: 'Cài app nhưng chưa mở sau 24h',
    source: 'SuperApp',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'Zalo OA', 'SMS'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'app_open_count', description: 'Số lần mở app', format: 'text', source: 'SuperApp' },
      { name: 'hours_since_install', description: 'Số giờ từ cài đặt', format: 'text', source: 'SuperApp' },
    ],
    filterFields: [
      {
        techName: 'app_installed', name: 'Đã cài app', dataType: 'boolean',
        operators: ['='], required: true, values: [],
      },
      {
        techName: 'app_open_count', name: 'Số lần mở app', dataType: 'integer',
        operators: ['=', '<=', '<'], required: true, values: [],
      },
      {
        techName: 'hours_since_install', name: 'Số giờ từ cài đặt', dataType: 'integer',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'push_token_available', name: 'Có push token', dataType: 'boolean',
        operators: ['='], required: false, values: [],
      },
      {
        techName: 'sent_count', name: 'Số lần đã gửi', dataType: 'integer',
        operators: ['='], required: false, values: [],
      },
      {
        techName: 'firebase_token', name: 'Firebase push token', dataType: 'string',
        operators: ['IS NOT NULL'], required: true, values: [],
      },
      {
        techName: 'device_type', name: 'Loại thiết bị', dataType: 'enum',
        operators: ['IN'], required: false, values: ['ANDROID', 'IOS'],
      },
      {
        techName: 'segment_age', name: 'Phân khúc tuổi', dataType: 'enum',
        operators: ['IN'], required: false, values: ['15-18', '19-24', '25-34'],
      },
      {
        techName: 'os_version', name: 'Phiên bản hệ điều hành', dataType: 'string',
        operators: ['IN', 'CONTAINS'], required: false, values: [],
      },
    ],
  },
  {
    id: '30',
    code: 'E07',
    name: 'Milestone 7 ngày / khảo sát ngắn',
    source: 'SuperApp',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'Zalo OA', 'SMS'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'days_since_activation', description: 'Số ngày từ kích hoạt', format: 'text', source: 'SuperApp' },
      { name: 'engagement_score', description: 'Điểm gắn kết', format: 'text', source: 'SuperApp' },
    ],
    filterFields: [
      {
        techName: 'days_since_activation', name: 'Số ngày từ kích hoạt', dataType: 'integer',
        operators: ['=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'engagement_score', name: 'Điểm gắn kết', dataType: 'decimal',
        operators: ['<', '<=', '>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'app_open_count_7d', name: 'Số lần mở app 7 ngày', dataType: 'integer',
        operators: ['<', '<=', '>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'usage_days_7d', name: 'Số ngày có sử dụng dịch vụ', dataType: 'integer',
        operators: ['<', '<=', '>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'survey_completed', name: 'Đã hoàn thành khảo sát', dataType: 'boolean',
        operators: ['='], required: false, values: [],
      },
      {
        techName: 'package_code', name: 'Mã gói hiện tại', dataType: 'string',
        operators: ['IN', 'NOT IN'], required: false, values: [],
      },
    ],
  },
  {
    id: '31',
    code: 'E09',
    name: 'Xem màn hình đổi gói nhưng chưa đăng ký',
    source: 'SuperApp',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'Zalo OA', 'SMS'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'time_on_screen_sec', description: 'Thời gian KH xem màn hình đổi gói (giây)', format: 'text', source: 'SuperApp' },
      { name: 'package_code', description: 'Gói đang dùng', format: 'text', source: 'SuperApp' },
    ],
    filterFields: [
      {
        techName: 'screen_code', name: 'Mã màn hình đã xem', dataType: 'string',
        operators: ['='], required: true, values: [],
      },
      {
        techName: 'time_on_screen_sec', name: 'Thời gian KH xem màn hình đổi gói (giây)', dataType: 'integer',
        operators: ['>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'package_code', name: 'Gói đang dùng', dataType: 'string',
        operators: ['IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'total_data_30d_mb', name: 'Tổng data dùng 30 ngày (MB)', dataType: 'float',
        operators: ['>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'view_count', name: 'Số lần xem màn hình', dataType: 'integer',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'package_register_after_view', name: 'Có đăng ký sau khi xem', dataType: 'boolean',
        operators: ['='], required: true, values: [],
      },
      {
        techName: 'hours_since_last_view', name: 'Số giờ từ lần xem cuối', dataType: 'integer',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'candidate_package_code', name: 'Mã gói đã xem', dataType: 'string',
        operators: ['=', 'IN'], required: false, values: [],
      },
    ],
  },
  {
    id: '32',
    code: 'E11',
    name: 'Tổng kết ngày 30',
    source: 'SuperApp',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'Zalo OA', 'SMS'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'days_since_activation', description: 'Số ngày từ kích hoạt', format: 'text', source: 'SuperApp' },
      { name: 'total_revenue_30d', description: 'Doanh thu 30 ngày', format: 'text', source: 'SuperApp' },
    ],
    filterFields: [
      {
        techName: 'days_since_activation', name: 'Số ngày từ kích hoạt', dataType: 'integer',
        operators: ['=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'total_revenue_30d', name: 'Doanh thu 30 ngày', dataType: 'decimal',
        operators: ['<', '<=', '>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'active_days_30d', name: 'Số ngày hoạt động', dataType: 'integer',
        operators: ['<', '<=', '>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'engagement_score', name: 'Điểm gắn kết', dataType: 'decimal',
        operators: ['<', '<=', '>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'topup_after_score', name: 'Số lần nạp tiền trong 30 ngày', dataType: 'integer',
        operators: ['>='], required: false, values: [],
      },
      {
        techName: 'total_data_30d_mb', name: 'Tổng data dùng trong 30 ngày (MB)', dataType: 'decimal',
        operators: ['>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'target_group', name: 'Nhóm đích sau đánh giá', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['G4', 'RETENTION'],
      },
    ],
  },
  {
    id: '33',
    code: 'E_APP_INACTIVE_X_DAYS',
    name: 'X ngày KH không truy cập app',
    source: 'SuperApp',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'Zalo OA', 'SMS'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'SuperApp' },
      { name: 'days_since_last_open', description: 'Số ngày từ lần mở app cuối', format: 'text', source: 'SuperApp' },
      { name: 'inactive_campaign_sent_count', description: 'Số lần đã nhắc', format: 'text', source: 'SuperApp' },
    ],
    filterFields: [
      {
        techName: 'days_since_last_open', name: 'Số ngày từ lần mở app cuối', dataType: 'integer',
        operators: ['>', '>=', '=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'last_open_time', name: 'Thời điểm mở app gần nhất', dataType: 'datetime',
        operators: ['BEFORE', 'AFTER', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'app_installed', name: 'App còn được cài', dataType: 'boolean',
        operators: ['='], required: false, values: [],
      },
      {
        techName: 'push_token_available', name: 'Có push token', dataType: 'boolean',
        operators: ['='], required: false, values: [],
      },
      {
        techName: 'inactive_campaign_sent_count', name: 'Số lần đã nhắc', dataType: 'integer',
        operators: ['<', '<='], required: false, values: [],
      },
    ],
  },
  {
    id: '34',
    code: 'U08',
    name: 'Gia hạn gói liên tiếp / vinh danh trung thành',
    source: 'OCS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'consecutive_renewal_count', description: 'Số kỳ gia hạn liên tiếp', format: 'text', source: 'OCS' },
      { name: 'package_code', description: 'Mã gói', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'renewal_status', name: 'Trạng thái gia hạn', dataType: 'enum',
        operators: ['='], required: true, values: ['SUCCESS'],
      },
      {
        techName: 'consecutive_renewal_count', name: 'Số kỳ gia hạn liên tiếp', dataType: 'integer',
        operators: ['>', '>=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'package_code', name: 'Mã gói', dataType: 'string',
        operators: ['=', 'IN', 'NOT IN'], required: false, values: [],
      },
      {
        techName: 'total_tenure_days', name: 'Số ngày gắn bó', dataType: 'integer',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'plan_cycle', name: 'Chu kỳ gói được gia hạn liên tiếp', dataType: 'enum',
        operators: ['IN'], required: false, values: ['DAILY', 'WEEKLY', 'MONTHLY'],
      },
      {
        techName: 'renewal_amount', name: 'Tổng tiền gia hạn trong chuỗi (đồng)', dataType: 'decimal',
        operators: ['>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'subscriber_tenure_days', name: 'Tổng ngày gắn kết với mạng', dataType: 'integer',
        operators: ['>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'renewal_channel', name: 'Kênh gia hạn', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['AUTO', 'APP', 'USSD'],
      },
    ],
  },
  {
    id: '35',
    code: 'U_PRE_EXPIRY',
    name: 'Trước khi gói hết hạn x ngày',
    source: 'BSS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['SMS', 'USSD', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'BSS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'BSS' },
      { name: 'days_to_expiry', description: 'Số ngày đến hết hạn', format: 'text', source: 'BSS' },
      { name: 'main_balance', description: 'Số dư tài khoản chính', format: 'text', source: 'BSS' },
    ],
    filterFields: [
      {
        techName: 'days_to_expiry', name: 'Số ngày đến hết hạn', dataType: 'integer',
        operators: ['=', '<', '<=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'auto_renew', name: 'Có tự động gia hạn', dataType: 'boolean',
        operators: ['='], required: false, values: [],
      },
      {
        techName: 'main_balance', name: 'Số dư tài khoản chính', dataType: 'decimal',
        operators: ['<', '<=', '=', '>', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'renewal_fee', name: 'Phí gia hạn', dataType: 'decimal',
        operators: ['>', '>=', '='], required: false, values: [],
      },
      {
        techName: 'plan_type', name: 'Loại gói', dataType: 'enum',
        operators: ['IN'], required: false, values: ['DATA', 'VOICE', 'COMBO'],
      },
      {
        techName: 'package_code', name: 'Mã gói sắp hết hạn', dataType: 'string',
        operators: ['=', 'IN', 'NOT IN'], required: true, values: [],
      },
    ],
  },
  {
    id: '36',
    code: 'U_POST_EXPIRY',
    name: 'Sau khi gói hết hạn x ngày chưa gia hạn',
    source: 'BSS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['SMS', 'USSD', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'BSS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'BSS' },
      { name: 'days_since_expiry', description: 'Số ngày từ khi hết hạn', format: 'text', source: 'BSS' },
      { name: 'current_active_package_count', description: 'Số gói hiện đang active', format: 'text', source: 'BSS' },
    ],
    filterFields: [
      {
        techName: 'days_since_expiry', name: 'Số ngày từ khi hết hạn', dataType: 'integer',
        operators: ['=', '>', '>=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'renewed_after_expiry', name: 'Đã gia hạn lại', dataType: 'boolean',
        operators: ['='], required: true, values: [],
      },
      {
        techName: 'expired_package_code', name: 'Mã gói đã hết hạn', dataType: 'string',
        operators: ['=', 'IN'], required: true, values: [],
      },
      {
        techName: 'current_active_package_count', name: 'Số gói hiện đang active', dataType: 'integer',
        operators: ['=', '<=', '<'], required: false, values: [],
      },
      {
        techName: 'recent_usage_after_expiry', name: 'Sử dụng sau hết hạn', dataType: 'decimal',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
    ],
  },
  {
    id: '37',
    code: 'E_LOCK_2C',
    name: 'Khóa 2 chiều',
    source: 'OCS',
    type: 'Near Realtime',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'days_in_lock', description: 'Số ngày ở trạng thái khóa 2 chiều', format: 'text', source: 'OCS' },
      { name: 'balance', description: 'Số dư TKC khi bị khóa (đồng)', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'old_status', name: 'Trạng thái cũ', dataType: 'enum',
        operators: ['=', 'IN'], required: true, values: ['LOCK_1C', 'ACTIVE'],
      },
      {
        techName: 'lock_direction', name: 'Chiều khóa', dataType: 'enum',
        operators: ['IN'], required: true, values: ['BOTH', 'INCOMING'],
      },
      {
        techName: 'days_in_lock', name: 'Số ngày ở trạng thái khóa 2 chiều', dataType: 'integer',
        operators: ['>=', '<=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'balance', name: 'Số dư TKC khi bị khóa (đồng)', dataType: 'decimal',
        operators: ['>=', '<='], required: false, values: [],
      },
      {
        techName: 'new_status', name: 'Trạng thái mới', dataType: 'enum',
        operators: ['='], required: true, values: ['LOCK_2C'],
      },
      {
        techName: 'lock_reason', name: 'Lý do khóa', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['DEBT', 'KYC', 'CUSTOMER_REQUEST'],
      },
      {
        techName: 'lock_time', name: 'Thời điểm khóa', dataType: 'datetime',
        operators: ['BEFORE', 'AFTER', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'recoverable', name: 'Có thể tự khôi phục', dataType: 'boolean',
        operators: ['='], required: false, values: [],
      },
    ],
  },
  {
    id: '38',
    code: 'E_LOCK_1C',
    name: 'Khóa 1 chiều',
    source: 'OCS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['Push', 'SMS', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'OCS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'OCS' },
      { name: 'days_in_lock_1c', description: 'Số ngày đã khóa 1 chiều', format: 'text', source: 'OCS' },
      { name: 'outstanding_amount', description: 'Số tiền còn thiếu/nợ', format: 'text', source: 'OCS' },
    ],
    filterFields: [
      {
        techName: 'lock_direction', name: 'Chiều khóa', dataType: 'enum',
        operators: ['=', 'IN'], required: true, values: ['OUTGOING', 'INCOMING'],
      },
      {
        techName: 'lock_reason', name: 'Lý do khóa', dataType: 'enum',
        operators: ['=', 'IN'], required: true, values: ['DEBT', 'INACTIVE', 'ADMIN'],
      },
      {
        techName: 'days_in_lock_1c', name: 'Số ngày đã khóa 1 chiều', dataType: 'integer',
        operators: ['=', '>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'outstanding_amount', name: 'Số tiền còn thiếu/nợ', dataType: 'decimal',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'balance', name: 'Số dư TKC (đồng)', dataType: 'decimal',
        operators: ['>=', '<='], required: false, values: [],
      },
      {
        techName: 'days_until_lock_2c', name: 'Số ngày còn lại đến khi bị khóa 2 chiều', dataType: 'integer',
        operators: ['>=', '<=', 'BETWEEN'], required: false, values: [],
      },
      {
        techName: 'scheduled_lock_2c_date', name: 'Ngày dự kiến khóa 2 chiều', dataType: 'date',
        operators: ['BEFORE', 'AFTER', 'BETWEEN'], required: false, values: [],
      },
    ],
  },
  {
    id: '39',
    code: 'E_PRE_LOCK_2C',
    name: 'Trước khi khóa 2 chiều x ngày',
    source: 'BSS',
    type: 'Offline',
    status: 'Active',
    supportedChannels: ['SMS', 'USSD', 'Zalo OA'],
    params: [
      { name: 'ten_kh', description: 'Họ tên đầy đủ của khách hàng', format: 'text', source: 'BSS' },
      { name: 'so_dt', description: 'Số điện thoại khách hàng', format: 'text', source: 'BSS' },
      { name: 'days_to_lock_2c', description: 'Số ngày đến khóa 2 chiều', format: 'text', source: 'BSS' },
      { name: 'balance', description: 'Số dư TKC (đồng)', format: 'text', source: 'BSS' },
    ],
    filterFields: [
      {
        techName: 'current_status', name: 'Trạng thái hiện tại', dataType: 'enum',
        operators: ['='], required: true, values: ['LOCK_1C'],
      },
      {
        techName: 'days_to_lock_2c', name: 'Số ngày đến khóa 2 chiều', dataType: 'integer',
        operators: ['=', '<', '<=', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'scheduled_lock_2c_date', name: 'Ngày dự kiến khóa 2 chiều', dataType: 'date',
        operators: ['BEFORE', 'AFTER', 'BETWEEN'], required: true, values: [],
      },
      {
        techName: 'lock_reason', name: 'Lý do dự kiến khóa', dataType: 'enum',
        operators: ['=', 'IN'], required: false, values: ['DEBT', 'INACTIVE'],
      },
      {
        techName: 'balance', name: 'Số dư TKC (đồng)', dataType: 'decimal',
        operators: ['>=', '<='], required: false, values: [],
      },
      {
        techName: 'required_recovery_amount', name: 'Số tiền cần bổ sung/thanh toán', dataType: 'decimal',
        operators: ['>', '>=', 'BETWEEN'], required: false, values: [],
      },
    ],
  },
]

export const mockTemplates: Template[] = [
  {
    id: '1', name: 'Chào mừng SIM', channels: ['Push', 'Zalo OA'], usageCount: 3, status: 'Active',
    description: 'Gửi khi khách hàng kích hoạt SIM mới — chào đón và giới thiệu gói cước',
    contents: {
      Push: { title: 'Chào mừng {{ten_kh}} đến với VietnamPost!', body: 'SIM {{loai_sim}} của bạn đã kích hoạt thành công vào {{ngay_kich_hoat}}. Khám phá các gói cước ưu đãi dành riêng cho bạn ngay hôm nay.' },
      'Zalo OA': { body: 'Xin chào {{ten_kh}},\n\nChúc mừng bạn đã kích hoạt thành công SIM {{loai_sim}} của VietnamPost vào ngày {{ngay_kich_hoat}}.\n\nSố dư hiện tại: {{so_du}} đ\nSố điện thoại: {{so_dt}}\n\nCảm ơn bạn đã tin tùy chọn VietnamPost. Chúc bạn có trải nghiệm tuyệt vời!' },
    },
  },
  {
    id: '2', name: 'Nhắc nạp thẻ', channels: ['SMS', 'USSD'], usageCount: 3, status: 'Active',
    description: 'Nhắc khách hàng nạp tiền khi số dư tài khoản thấp hoặc sắp hết hạn gói',
    contents: {
      SMS: { body: 'VietnamPost: Tai khoan {{so_dt}} con {{so_du}}d, het han {{ngay_het_han}}. Nap the ngay de khong bi gian doan lien lac. Hotline: 1800 xxxx.' },
      USSD: { body: 'VietnamPost thong bao: So du con {{so_du}}d. Het han {{ngay_het_han}}. Nap the de tiep tuc su dung dich vu.' },
    },
  },
  {
    id: '3', name: 'Sắp hết data', channels: ['Push', 'SMS'], usageCount: 2, status: 'Active',
    description: 'Cảnh báo khi data gói cước còn dưới ngưỡng — khuyến khích mua thêm data',
    contents: {
      Push: { title: 'Data của bạn sắp hết!', body: 'Gói data còn {{data_con_lai}} MB — sắp hết rồi {{ten_kh}} ơi. Mua thêm data ngay để lướt net không bị gián đoạn.' },
      SMS: { body: 'VietnamPost: Goi data cua {{so_dt}} chi con {{data_con_lai}}MB. Mua them data tai *098# hoac lien he hotline 1800 xxxx.' },
    },
  },
  {
    id: '4', name: 'Sinh nhật KH', channels: ['Zalo OA', 'Email'], usageCount: 2, status: 'Active',
    description: 'Gửi lời chúc sinh nhật kèm ưu đãi đặc biệt dành riêng cho khách hàng',
    contents: {
      'Zalo OA': { body: 'Chúc mừng sinh nhật {{ten_kh}}! 🎂\n\nNhân dịp sinh nhật, VietnamPost tặng bạn ưu đãi đặc biệt: 1GB data miễn phí trong hôm nay.\n\nSố dư hiện tại: {{so_du}} đ\nSố điện thoại: {{so_dt}}\n\nTrân trọng,\nĐội ngũ VietnamPost' },
      Email: {
        title: 'Chúc mừng sinh nhật {{ten_kh}} — Quà tặng đặc biệt từ VietnamPost',
        body: 'Kính gửi {{ten_kh}},\n\nNhân dịp sinh nhật của bạn, toàn thể đội ngũ VietnamPost xin gửi lời chúc mừng nồng nhiệt nhất!\n\nĐể tri ân sự đồng hành của bạn, chúng tôi xin tặng bạn:\n• 1GB data miễn phí (hiệu lực trong 24 giờ)\n• Ưu đãi giảm 20% khi nâng cấp gói cước trong tháng sinh nhật\n\nThông tin tài khoản:\nSố điện thoại: {{so_dt}}\nLoại SIM: {{loai_sim}}\nSố dư hiện tại: {{so_du}} đ\n\nTrân trọng,\nĐội ngũ chăm sóc khách hàng VietnamPost',
        imageName: 'banner-birthday.jpg',
      },
    },
  },
  {
    id: '5', name: 'Cài app nhắc nhở', channels: ['Push'], usageCount: 2, status: 'Inactive',
    description: 'Nhắc khách hàng chưa cài ứng dụng VietnamPost Mobile',
    contents: {
      Push: { title: 'Quản lý tài khoản dễ dàng hơn!', body: 'Xin chào {{ten_kh}}, hãy tải app VietnamPost để nạp tiền, kiểm tra số dư và đăng ký gói cước mọi lúc mọi nơi. Tải ngay — hoàn toàn miễn phí!' },
    },
  },
]

export const mockBlacklist: BlacklistEntry[] = [
  { phone: '0987654001', campaign: 'Nhắc nạp tiền',              channel: 'Push',    source: 'campaign' },
  { phone: '0912345002', campaign: 'Nhắc nạp tiền',              channel: 'SMS',     source: 'upload' },
  { phone: '0965432003', campaign: 'Nhắc nạp tiền',              channel: 'Zalo OA', source: 'manual' },
  { phone: '0976543004', campaign: 'Welcome eSIM Q2/2026',        channel: 'Push',    source: 'campaign' },
  { phone: '0933221005', campaign: 'Welcome eSIM Q2/2026',        channel: 'Zalo OA', source: 'upload' },
  { phone: '0901122006', campaign: 'Welcome eSIM Q2/2026',        channel: 'Email',   source: 'manual' },
  { phone: '0918765007', campaign: 'Hết hạn gói data',           channel: 'SMS',     source: 'upload' },
  { phone: '0977889008', campaign: 'Hết hạn gói data',           channel: 'USSD',    source: 'upload' },
  { phone: '0944556009', campaign: 'Hết hạn gói data',           channel: 'Push',    source: 'campaign' },
  { phone: '0908877010', campaign: 'Chào mừng du lịch',          channel: 'Banner',  source: 'manual' },
  { phone: '0961234011', campaign: 'Chào mừng du lịch',          channel: 'Zalo OA', source: 'campaign' },
  { phone: '0923456012', campaign: 'Giữ chân KH có nguy cơ rời mạng', channel: 'SMS', source: 'upload' },
  { phone: '0934567013', campaign: 'Giữ chân KH có nguy cơ rời mạng', channel: 'Push', source: 'campaign' },
  { phone: '0945678014', campaign: 'Giữ chân KH có nguy cơ rời mạng', channel: 'Email', source: 'manual' },
  { phone: '0956789015', campaign: 'Tết Nguyên Đán 2026',        channel: 'Banner',  source: 'upload' },
]

export const mockCustomers: Customer[] = [
  { phone: '0987 xxx 001', name: 'Nguyễn Văn An', simType: 'eSIM', status: 'Active', hasApp: true, hasDnc: false },
  { phone: '0912 xxx 002', name: 'Trần Thị Bình', simType: 'SIM vật lý', status: 'Active', hasApp: false, hasDnc: false },
  { phone: '0965 xxx 003', name: 'Lê Văn Cường', simType: 'eSIM', status: 'Inactive', hasApp: true, hasDnc: true },
  { phone: '0976 xxx 004', name: 'Phạm Thị Dung', simType: 'SIM vật lý', status: 'Active', hasApp: false, hasDnc: false },
]

export const mockSegments: Segment[] = [
  { id: '1', name: 'Gen Z User (18–25)', reach: 18450, source: 'Customer 360' },
  { id: '2', name: 'Sắp hết data', reach: 8920, source: 'OCS' },
  { id: '3', name: 'ARPU cao', reach: 5600, source: 'BSS' },
  { id: '4', name: 'Nguy cơ rời mạng', reach: 2150, source: 'BSS' },
  { id: '5', name: 'VIP', reach: 3200, source: 'CRM' },
]

export const recentTriggerEvents = [
  { time: '09:44:52', code: 'E08', phone: '0987 xxx 001', result: 'Matched · Push sent', type: 'success' },
  { time: '09:44:38', code: 'E01', phone: '0912 xxx 002', result: 'Matched · Zalo sent', type: 'success' },
  { time: '09:44:21', code: 'E02', phone: '0965 xxx 003', result: 'No match', type: 'neutral' },
  { time: '09:44:05', code: 'E06', phone: '0976 xxx 004', result: 'Blacklist blocked', type: 'blocked' },
  { time: '09:43:58', code: 'E08', phone: '0988 xxx 005', result: 'Matched · DNC blocked', type: 'blocked' },
]

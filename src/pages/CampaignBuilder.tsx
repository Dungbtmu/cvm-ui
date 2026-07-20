import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, X, GripVertical, ChevronDown, ChevronRight, AlertCircle, RefreshCw, Upload, ImagePlus } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card, SectionHeader } from '../components/ui/Card'
import { StatusBadge, TriggerChip, ParamChip } from '../components/ui/Badge'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { mockTriggers, mockSegments, mockCampaigns, mockTemplates } from '../data/mock'
import { removeVietnameseTones } from '../lib/utils'
import type { ChannelType, TriggerLogic, BlackoutAction, TriggerFilterField, FilterFieldDataType } from '../types'

const CHANNELS: ChannelType[] = ['Push', 'Zalo OA', 'SMS', 'Banner', 'Email', 'USSD']

const MOCK_SUBSCRIBERS = [
  { phone: '0987 xxx 001', name: 'Nguyễn Văn A', status: 'Active' },
  { phone: '0912 xxx 002', name: 'Trần Thị B', status: 'Active' },
  { phone: '0965 xxx 003', name: 'Lê Văn C', status: 'Inactive' },
  { phone: '0976 xxx 004', name: 'Phạm Thị D', status: 'Active' },
  { phone: '0988 xxx 005', name: 'Hoàng Văn E', status: 'Active' },
  { phone: '0911 xxx 006', name: 'Đặng Thị F', status: 'Active' },
]

const CHANNEL_LIMITS: Record<ChannelType, { title?: number; body: number; hasImage: boolean; imageRequired?: boolean }> = {
  'Push':    { title: 65,  body: 240,  hasImage: true },
  'Zalo OA': { title: undefined, body: 1000, hasImage: true },
  'SMS':     { title: undefined, body: 160,  hasImage: false },
  'USSD':    { title: undefined, body: 182,  hasImage: false },
  'Banner':  { title: 65,  body: 120,  hasImage: true, imageRequired: true },
  'Email':   { title: 100, body: 99999, hasImage: true },
}

const CHANNEL_GUIDES: Record<ChannelType, string[]> = {
  'Push': ['Title: tối đa 65 ký tự. Hỗ trợ biến {{...}}.', 'Body: tối đa 240 ký tự. Hỗ trợ biến {{...}}.', 'Image: optional, tỉ lệ 1:1, tối đa 1MB.', 'Nếu biến null/trống → hiển thị chuỗi rỗng.', 'Đầu mối: Team Mobile / Push Gateway'],
  'Zalo OA': ['Nội dung: tối đa 1000 ký tự. Hỗ trợ biến {{...}}.', 'Image: optional, tỉ lệ tự do, khuyến nghị 16:9 hoặc 1:1.', 'OA phải được liên kết và phê duyệt trước khi gửi.', 'Đầu mối: Team Zalo OA'],
  'SMS': ['Body: tối đa 160 ký tự/segment. Vượt 160 → tính thêm segment.', 'Chỉ plain text — không hỗ trợ ảnh.', 'Biến dài có thể đẩy tin vượt 160 ký tự — kiểm tra bộ đếm.', 'Đầu mối: Team SMS / SMSC'],
  'USSD': ['Body: tối đa 182 ký tự. Chỉ plain text, không dấu tiếng Việt.', 'Không hỗ trợ ảnh, link, ký tự đặc biệt.', 'Giá trị biến cũng phải không dấu.', 'Đầu mối: Team USSD'],
  'Banner': ['Image: BẮT BUỘC, tỉ lệ 16:9, tối đa 2MB.', 'Title: tối đa 65 ký tự. Body: tối đa 120 ký tự.', 'CTA Label + CTA URL: bắt buộc.', 'Đầu mối: Team App / Banner'],
  'Email': ['Subject: tối đa 100 ký tự. Hỗ trợ biến {{...}}.', 'Body: plain text, không giới hạn. Hỗ trợ biến {{...}}.', 'Header image: optional, banner ngang, tối đa 1MB.', 'Đầu mối: Team Email'],
}

interface TriggerEntry { id: string; code: string; name: string }
interface FilterCondition {
  field: string       // techName — định danh duy nhất trong 1 trigger
  fieldLabel: string  // tên nghiệp vụ để hiển thị
  triggerCode?: string
  op: string
  value: string
  value2?: string     // vế thứ 2 cho toán tử BETWEEN
}

interface SegmentEntry {
  id: string
  name: string
  reach: number
  filters?: FilterCondition[]
  filterExpanded?: boolean
}

interface VariantContent { title?: string; body?: string; cta?: string; ctaUrl?: string; imageName?: string; sampleValues?: Record<string, string> }
interface TriggerCardData {
  variants: Array<{ segmentId: string | null; segmentName: string; content: VariantContent }>
}
// channelCards[channel][triggerCode] = TriggerCardData
type ChannelCards = Record<string, Record<string, TriggerCardData>>

function defaultVariant(): { segmentId: null; segmentName: string; content: VariantContent } {
  return { segmentId: null, segmentName: 'Tất cả (dự phòng)', content: {} }
}

function interpolate(text: string | undefined, sampleValues: Record<string, string> | undefined): string {
  if (!text) return ''
  return text.replace(/\{\{(\w+)\}\}/g, (_, key) => sampleValues?.[key] ?? `{{${key}}}`)
}

function ChannelPreview({ ch, content }: { ch: ChannelType; content: VariantContent }) {
  const title = interpolate(content.title, content.sampleValues)
  const body = interpolate(content.body, content.sampleValues)
  const cta = content.cta
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
      {ch === 'Push' && (
        <>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded-sm flex items-center justify-center text-white text-[10px]">A</div>
            <span className="font-medium">{title || 'Title...'}</span>
          </div>
          <div className="text-slate-500">{body || 'Body...'}</div>
        </>
      )}
      {ch === 'SMS' && (
        <>
          <div className="text-slate-400 font-medium text-[10px]">VietnamPost</div>
          <div className="bg-slate-100 rounded p-2 text-slate-700">{body || 'Nội dung SMS...'}</div>
          <div className="text-slate-400">{(body ?? '').length}/160 · {Math.ceil(Math.max(1, (body ?? '').length) / 160)} SMS segment</div>
        </>
      )}
      {ch === 'Zalo OA' && (
        <>
          <div className="font-medium text-blue-700">🟦 VietnamPost</div>
          <div className="bg-blue-50 rounded p-2 text-slate-700">{body || 'Nội dung...'}</div>
        </>
      )}
      {ch === 'USSD' && (
        <div className="font-mono bg-black text-green-400 rounded p-2 text-[11px] whitespace-pre-wrap">
          {body || 'USSD content...'}
        </div>
      )}
      {ch === 'Banner' && (
        <>
          <div className="bg-slate-200 rounded h-16 flex items-center justify-center text-slate-400 text-[10px]">Image 16:9</div>
          <div className="font-medium">{title || 'Title...'}</div>
          <div className="text-slate-500">{body || 'Body...'}</div>
          {cta && <div className="bg-blue-500 text-white rounded px-2 py-0.5 text-center">{cta}</div>}
        </>
      )}
      {ch === 'Email' && (
        <>
          <div className="text-slate-400 text-[10px]">From: VietnamPost</div>
          <div className="font-medium border-b border-slate-100 pb-1">{title || 'Subject...'}</div>
          <div className="text-slate-500">{body || 'Body...'}</div>
        </>
      )}
    </div>
  )
}

interface TriggerCardProps {
  trig: TriggerEntry
  ti: number
  ch: ChannelType
  availableSegments: SegmentEntry[]
  data: TriggerCardData
  onChange: (d: TriggerCardData) => void
  guideOpen: boolean
  onGuideToggle: () => void
  canShowVariant: boolean
}

function TriggerCard({ trig, ti, ch, availableSegments, data, onChange, guideOpen, onGuideToggle, canShowVariant }: TriggerCardProps) {
  const trigData = mockTriggers.find(x => x.code === trig.code)
  const [activeVariant, setActiveVariant] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const limits = CHANNEL_LIMITS[ch]
  const variant = data.variants[activeVariant] ?? data.variants[0]
  const content = variant?.content ?? {}

  const updateContent = (field: keyof VariantContent, value: string) => {
    const newVariants = data.variants.map((v, i) =>
      i === activeVariant ? { ...v, content: { ...v.content, [field]: value } } : v
    )
    onChange({ ...data, variants: newVariants })
  }


  const insertParam = (paramName: string) => {
    const tag = `{{${paramName}}}`
    // insert at cursor in body textarea (fallback: append)
    const el = bodyRef.current
    if (el) {
      const start = el.selectionStart ?? (content.body ?? '').length
      const end = el.selectionEnd ?? start
      const newVal = (content.body ?? '').slice(0, start) + tag + (content.body ?? '').slice(end)
      updateContent('body', newVal)
      setTimeout(() => { el.focus(); el.setSelectionRange(start + tag.length, start + tag.length) }, 0)
    } else {
      updateContent('body', (content.body ?? '') + tag)
    }
  }

  const addVariant = () => {
    const newV = { segmentId: null as null, segmentName: `Biến thể ${data.variants.length}`, content: {} }
    onChange({ ...data, variants: [...data.variants, newV] })
    setActiveVariant(data.variants.length)
  }

  const removeVariant = (idx: number) => {
    const newVariants = data.variants.filter((_, i) => i !== idx)
    onChange({ ...data, variants: newVariants })
    setActiveVariant(Math.max(0, activeVariant - 1))
  }

  const assignSegment = (variantIdx: number, seg: SegmentEntry | null) => {
    const newVariants = data.variants.map((v, i) =>
      i === variantIdx ? { ...v, segmentId: seg?.id ?? null, segmentName: seg?.name ?? 'Tất cả (dự phòng)' } : v
    )
    onChange({ ...data, variants: newVariants })
  }

  const isComplete = !!(content.body || content.title)

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      {/* Card header */}
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-bold ${isComplete ? 'text-green-600' : 'text-slate-400'}`}>
            {isComplete ? '✓' : '○'}
          </span>
          <span className="text-sm font-medium">T{ti + 1} · {trig.code}</span>
          <div className="flex gap-1 flex-wrap">
            {trigData?.params.map(p => (
              <div key={p.name} className="relative group">
                <ParamChip name={p.name} onClick={() => insertParam(p.name)} />
                <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-30">
                  {p.description} · {p.format}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Guide (collapsible) */}
      <div className="border-b border-slate-100">
        <button
          onClick={onGuideToggle}
          className="flex items-center gap-2 px-4 py-1.5 text-xs text-blue-600 hover:bg-blue-50 w-full text-left"
        >
          {guideOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          ℹ Hướng dẫn khai báo {ch}
        </button>
        {guideOpen && (
          <div className="px-4 pb-3 text-xs text-slate-600 space-y-1 bg-blue-50">
            {CHANNEL_GUIDES[ch].map((g, i) => <div key={i}>• {g}</div>)}
          </div>
        )}
      </div>

      {/* Audience variant tabs */}
      {(
        <div className="border-b border-slate-200 px-4 py-2 flex items-center gap-2 flex-wrap bg-slate-50">
          <span className="text-xs text-slate-500">Đối tượng:</span>
          {data.variants.map((v, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <button
                onClick={() => setActiveVariant(idx)}
                className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                  activeVariant === idx
                    ? 'bg-white border-blue-400 text-blue-700 font-medium'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {v.segmentName}
                {v.content.body || v.content.title ? ' ●' : ' ○'}
              </button>
              {idx > 0 && (
                <button onClick={() => removeVariant(idx)} className="text-slate-300 hover:text-red-400">
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
          {canShowVariant && (
            <button
              onClick={addVariant}
              className="text-xs px-2 py-1 border border-dashed border-slate-300 rounded-full text-slate-400 hover:border-blue-400 hover:text-blue-500"
            >
              + Biến thể đối tượng
            </button>
          )}
        </div>
      )}

      {/* Assign segment to current variant (if variant idx > 0) */}
      {activeVariant > 0 && (
        <div className="px-4 py-2 border-b border-slate-100 bg-amber-50">
          <label className="text-xs text-slate-500 font-medium mr-2">Phân khúc:</label>
          <select
            value={variant.segmentId ?? ''}
            onChange={e => {
              const seg = availableSegments.find(s => s.id === e.target.value) ?? null
              assignSegment(activeVariant, seg ? { id: seg.id, name: seg.name, reach: seg.reach } : null)
            }}
            className="text-xs border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-blue-400"
          >
            <option value="">Chọn phân khúc...</option>
            {availableSegments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* 2-col compose / preview */}
      <div className="grid grid-cols-[55%_45%]">
        {/* LEFT: compose */}
        <div className="p-4 border-r border-slate-100 space-y-3">
          {/* Image upload */}
          {limits.hasImage && (
            <div>
              <div className="text-xs text-slate-500 font-medium mb-1">
                Image {limits.imageRequired ? '** bắt buộc **' : '(optional)'}
                {ch === 'Push' ? ' · 1:1' : ch === 'Banner' ? ' · 16:9' : ch === 'Email' ? ' · banner ngang' : ''}
              </div>
              {content.imageName ? (
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs">
                  <ImagePlus size={12} className="text-slate-400" />
                  <span className="text-slate-600 flex-1 truncate">{content.imageName}</span>
                  <button onClick={() => updateContent('imageName', '')} className="text-slate-300 hover:text-red-400">Xóa</button>
                  <button onClick={() => updateContent('imageName', 'sample-image.jpg')} className="text-blue-500">Đổi</button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => updateContent('imageName', 'sample-image.jpg')}
                    className="w-full border-2 border-dashed border-slate-200 rounded-lg py-3 text-xs text-slate-400 hover:border-blue-300 hover:text-blue-500 flex items-center justify-center gap-2"
                  >
                    <Upload size={12} /> Kéo thả hoặc Tải lên · Chọn thư viện
                  </button>
                  <div className="text-xs text-slate-400 mt-1">Định dạng: JPG, PNG, WebP · Tối đa 5MB</div>
                </>
              )}
              {limits.imageRequired && !content.imageName && (
                <div className="text-xs text-orange-500 mt-1">⚠ Chưa upload image → không thể lưu</div>
              )}
            </div>
          )}

          {/* Template picker */}
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1">Template</label>
            <select
              className="w-full text-xs border border-slate-200 rounded px-2 py-1.5 focus:outline-none focus:border-blue-400"
              onChange={e => {
                const tpl = mockTemplates.find(t => t.id === e.target.value)
                if (tpl) updateContent('title', tpl.name)
              }}
              defaultValue=""
            >
              <option value="">Chọn template...</option>
              {mockTemplates.filter(t => t.status === 'Active' && t.channels.includes(ch)).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Title / Subject */}
          {limits.title !== undefined && (
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">
                {ch === 'Email' ? 'Subject *' : 'Title *'}
                <span className="float-right text-slate-400">{(content.title ?? '').length}/{limits.title}</span>
              </label>
              <input
                ref={titleRef}
                value={content.title ?? ''}
                onChange={e => updateContent('title', e.target.value)}
                maxLength={limits.title}
                placeholder={ch === 'Email' ? 'VD: Ưu đãi đặc biệt dành cho bạn' : 'VD: Gói data hết hạn hôm nay!'}
                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400"
              />
            </div>
          )}

          {/* Body */}
          <div>
            <label className="text-xs text-slate-500 font-medium block mb-1">
              {ch === 'Zalo OA' ? 'Nội dung *' : ch === 'Email' ? 'Body * (plain text)' : 'Nội dung *'}
              <span className={`float-right ${limits.body !== 99999 && (content.body ?? '').length > limits.body ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                {(content.body ?? '').length}{limits.body !== 99999 ? `/${limits.body}` : ''}
              </span>
            </label>
            <textarea
              ref={bodyRef}
              rows={ch === 'Email' ? 5 : 3}
              value={content.body ?? ''}
              onChange={e => {
                const val = ch === 'USSD' ? removeVietnameseTones(e.target.value) : e.target.value
                updateContent('body', val)
              }}
              placeholder="Nhập nội dung tin nhắn. Dùng {{ten_bien}} để chèn tham số động."
              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400 resize-none"
            />
            {ch === 'SMS' && (content.body ?? '').length > 160 && (
              <div className="text-xs text-orange-500 mt-1">
                {Math.ceil((content.body ?? '').length / 160)} SMS segments · chi phí nhân {Math.ceil((content.body ?? '').length / 160)}×
              </div>
            )}
            {ch === 'USSD' && (
              <div className="text-xs text-slate-400 mt-1">⚠ USSD không hỗ trợ tiếng Việt có dấu — tự động chuyển sang không dấu</div>
            )}
          </div>

          {/* CTA (Banner) */}
          {ch === 'Banner' && (
            <>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">
                  CTA Label *
                  <span className="float-right text-slate-400">{(content.cta ?? '').length}/30</span>
                </label>
                <input value={content.cta ?? ''} onChange={e => updateContent('cta', e.target.value)}
                  placeholder="VD: Đăng ký ngay" maxLength={30}
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">CTA URL *</label>
                <input value={content.ctaUrl ?? ''} onChange={e => updateContent('ctaUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400" />
              </div>
            </>
          )}
        </div>

        {/* RIGHT: preview */}
        <div className="p-4 bg-slate-50 space-y-3">
          <div className="text-xs text-slate-500 font-medium">XEM TRƯỚC</div>
          {showPreview ? (
            <ChannelPreview ch={ch} content={content} />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center justify-center text-xs text-slate-400 h-24">
              Nhấn [↻ Xem trước] để làm mới
            </div>
          )}


          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 border border-blue-200 rounded px-2 py-1"
          >
            <RefreshCw size={10} /> Xem trước
          </button>
        </div>
      </div>
    </div>
  )
}

// ── SegmentCard: hiển thị phân khúc + nhiều điều kiện lọc ──
// Thuộc tính điều kiện lọc con lấy trực tiếp từ trigger.filterFields (khai báo tại màn Trigger Admin).
// Toán tử khả dụng KHAI BÁO THẲNG per field (field.operators) — không suy từ kiểu dữ liệu.
// Nhãn hiển thị tiếng Việt cho toán tử, nhưng giá trị lưu vẫn là ký hiệu gốc để khớp danh mục.
const OP_LABEL: Record<string, string> = {
  '=': '=', '!=': '≠', '>=': '≥', '<=': '≤', 'BETWEEN': 'trong khoảng',
  'IN': 'thuộc', 'NOT IN': 'không thuộc', 'CONTAINS': 'chứa',
  'AFTER': 'sau', 'BEFORE': 'trước', 'IS NULL': 'trống', 'IS NOT NULL': 'có giá trị',
}
const opLabel = (op: string) => OP_LABEL[op] ?? op
// Toán tử không cần nhập giá trị (chỉ kiểm tra tồn tại)
const NO_VALUE_OPS = new Set(['IS NULL', 'IS NOT NULL'])

interface FilterFieldGroup {
  triggerCode: string
  fields: TriggerFilterField[]
}

interface SegmentCardProps {
  seg: SegmentEntry
  onChange: (updated: SegmentEntry) => void
  onRemove: () => void
  fieldGroups: FilterFieldGroup[]
}

function SegmentCard({ seg, onChange, onRemove, fieldGroups }: SegmentCardProps) {
  const filters = seg.filters ?? []
  const noTriggerSelected = fieldGroups.length === 0
  // Trigger đã chọn nhưng không trigger nào khai báo điều kiện lọc → không có thuộc tính khả dụng để lọc
  const hasAnyField = fieldGroups.some(g => g.fields.length > 0)
  const filterDisabled = noTriggerSelected || !hasAnyField
  const firstGroup = fieldGroups.find(g => g.fields.length > 0)
  const firstField = firstGroup?.fields[0]

  // tra 1 field theo đúng trigger + techName (định danh duy nhất)
  const fieldOf = (triggerCode: string | undefined, techName: string) =>
    fieldGroups.find(g => g.triggerCode === triggerCode)?.fields.find(f => f.techName === techName)
  const opsOf = (triggerCode: string | undefined, techName: string) =>
    fieldOf(triggerCode, techName)?.operators ?? ['=']
  const valuesOf = (triggerCode: string | undefined, techName: string) =>
    fieldOf(triggerCode, techName)?.values ?? []
  const typeOf = (triggerCode: string | undefined, techName: string): FilterFieldDataType =>
    fieldOf(triggerCode, techName)?.dataType ?? 'string'

  // giá trị mặc định khi chọn field/toán tử mới: enum → phần tử đầu; kiểu khác → rỗng để nhập tay
  const defaultValue = (triggerCode: string | undefined, techName: string) => {
    const vals = valuesOf(triggerCode, techName)
    return vals[0] ?? ''
  }

  const addFilter = () => {
    if (!firstField) return
    onChange({
      ...seg,
      filters: [...filters, {
        field: firstField.techName,
        fieldLabel: firstField.name,
        triggerCode: firstGroup?.triggerCode,
        op: firstField.operators[0] ?? '=',
        value: defaultValue(firstGroup?.triggerCode, firstField.techName),
      }],
      filterExpanded: true,
    })
  }

  // select value = "triggerCode::techName" để phân biệt field trùng tên giữa các trigger
  // đổi thuộc tính → reset toán tử (theo field mới) + giá trị hợp lệ
  const updateFilterField = (i: number, selectValue: string) => {
    const sep = selectValue.indexOf('::')
    const triggerCode = selectValue.slice(0, sep)
    const techName = selectValue.slice(sep + 2)
    const fld = fieldOf(triggerCode, techName)
    const next = filters.map((f, idx) => idx === i ? {
      ...f,
      field: techName,
      fieldLabel: fld?.name ?? techName,
      triggerCode,
      op: fld?.operators[0] ?? '=',
      value: defaultValue(triggerCode, techName),
      value2: undefined,
    } : f)
    onChange({ ...seg, filters: next })
  }

  const updateFilter = (i: number, patch: Partial<FilterCondition>) => {
    const next = filters.map((f, idx) => idx === i ? { ...f, ...patch } : f)
    onChange({ ...seg, filters: next })
  }

  const removeFilter = (i: number) => {
    onChange({ ...seg, filters: filters.filter((_, idx) => idx !== i) })
  }

  const applyFilters = () => {
    onChange({ ...seg, filterExpanded: false })
  }

  const cancelFilters = () => {
    onChange({ ...seg, filterExpanded: false })
  }

  const summaryValue = (f: FilterCondition) =>
    NO_VALUE_OPS.has(f.op) ? '' : f.op === 'BETWEEN' ? `${f.value} – ${f.value2 ?? ''}` : f.value
  const filterSummary = filters.length > 0
    ? filters.map(f => `${f.fieldLabel} ${opLabel(f.op)} ${summaryValue(f)}`.trim()).join(' · ')
    : null

  // reach sau lọc — giả lập giảm ~20% mỗi điều kiện
  const reachAfter = Math.round(seg.reach * Math.pow(0.8, filters.length))

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="p-3 space-y-1.5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">{seg.name}</span>
          <button onClick={onRemove} className="text-slate-300 hover:text-red-400">
            <X size={14} />
          </button>
        </div>

        {/* Reach */}
        <div className="text-xs text-slate-500">
          {seg.reach.toLocaleString('vi-VN')} KH
          {filters.length > 0 && (
            <span className="ml-2 text-slate-400">
              → Sau lọc: <span className="font-medium text-blue-600">~{reachAfter.toLocaleString('vi-VN')} KH</span>
            </span>
          )}
        </div>

        {/* Filter summary + toggle */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-400">Điều kiện lọc:</span>
          {filterSummary ? (
            <div className="flex flex-wrap gap-1">
              {filters.map((f, i) => (
                <span key={i} className="bg-blue-50 text-blue-700 rounded px-1.5 py-0.5">
                  {f.fieldLabel} {opLabel(f.op)} {summaryValue(f)}
                  {fieldGroups.length > 1 && f.triggerCode && (
                    <span className="ml-1 text-blue-400 font-mono">[{f.triggerCode}]</span>
                  )}
                </span>
              ))}
            </div>
          ) : noTriggerSelected ? (
            <span className="text-slate-400 italic">Chọn trigger ở mục 2 để xem điều kiện lọc khả dụng</span>
          ) : !hasAnyField ? (
            <span className="text-slate-400 italic">Trigger đã chọn chưa khai báo điều kiện lọc nào — phân khúc dùng toàn bộ audience của trigger</span>
          ) : (
            <span className="text-slate-400">(chưa có)</span>
          )}
          {!filterDisabled && (
            <button
              onClick={() => onChange({ ...seg, filterExpanded: !seg.filterExpanded })}
              className="text-blue-500 hover:text-blue-700 ml-1"
            >
              {seg.filterExpanded ? '▸ Thu gọn' : (filterSummary ? '▸ Sửa' : '+ Thêm lọc')}
            </button>
          )}
        </div>
      </div>

      {/* Expanded filter editor */}
      {seg.filterExpanded && !filterDisabled && (
        <div className="border-t border-slate-100 bg-slate-50 p-3 space-y-2">
          {/* Filter rows */}
          {filters.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              {/* AND badge sau dòng đầu */}
              {i > 0 && (
                <span className="text-xs font-medium text-slate-400 w-8 text-center flex-shrink-0">VÀ</span>
              )}
              {i === 0 && <div className="w-8 flex-shrink-0" />}

              <select
                value={`${f.triggerCode}::${f.field}`}
                onChange={e => updateFilterField(i, e.target.value)}
                className="flex-1 min-w-0 border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white"
              >
                {fieldGroups.filter(g => g.fields.length > 0).map(g => (
                  <optgroup key={g.triggerCode} label={g.triggerCode}>
                    {g.fields.map(opt => (
                      <option key={`${g.triggerCode}::${opt.techName}`} value={`${g.triggerCode}::${opt.techName}`}>{opt.name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>

              {/* Badge nguồn trigger — luôn hiển thị để phân biệt field trùng tên giữa các trigger */}
              {fieldGroups.length > 1 && f.triggerCode && (
                <span
                  className="flex-shrink-0 text-xs font-mono bg-slate-200 text-slate-600 rounded px-1.5 py-0.5 max-w-[6rem] truncate"
                  title={`Thuộc tính này thuộc trigger ${f.triggerCode}`}
                >
                  {f.triggerCode}
                </span>
              )}

              <select
                value={f.op}
                onChange={e => updateFilter(i, { op: e.target.value, value2: e.target.value === 'BETWEEN' ? (f.value2 ?? '') : undefined })}
                className="flex-shrink-0 border border-slate-200 rounded px-1 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white"
              >
                {opsOf(f.triggerCode, f.field).map(op => <option key={op} value={op}>{opLabel(op)}</option>)}
              </select>

              {/* Ô giá trị — render theo kiểu: enum → dropdown; kiểu khác → nhập tay; BETWEEN → 2 ô; IS NULL → không ô */}
              {NO_VALUE_OPS.has(f.op) ? (
                <div className="flex-1 min-w-0" />
              ) : valuesOf(f.triggerCode, f.field).length > 0 ? (
                <select
                  value={f.value}
                  onChange={e => updateFilter(i, { value: e.target.value })}
                  className="flex-1 min-w-0 border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white"
                >
                  {valuesOf(f.triggerCode, f.field).map(v => <option key={v}>{v}</option>)}
                </select>
              ) : (
                <div className="flex-1 min-w-0 flex items-center gap-1">
                  <input
                    type={['integer', 'decimal', 'float'].includes(typeOf(f.triggerCode, f.field)) ? 'number' : typeOf(f.triggerCode, f.field) === 'date' ? 'date' : 'text'}
                    value={f.value}
                    onChange={e => updateFilter(i, { value: e.target.value })}
                    placeholder="Nhập giá trị"
                    className="flex-1 min-w-0 border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white"
                  />
                  {f.op === 'BETWEEN' && (
                    <>
                      <span className="text-slate-400 text-xs">–</span>
                      <input
                        type={['integer', 'decimal', 'float'].includes(typeOf(f.triggerCode, f.field)) ? 'number' : typeOf(f.triggerCode, f.field) === 'date' ? 'date' : 'text'}
                        value={f.value2 ?? ''}
                        onChange={e => updateFilter(i, { value2: e.target.value })}
                        placeholder="đến"
                        className="flex-1 min-w-0 border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-400 bg-white"
                      />
                    </>
                  )}
                </div>
              )}

              <button
                onClick={() => removeFilter(i)}
                className="text-slate-300 hover:text-red-400 flex-shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {/* Add condition */}
          <button
            onClick={addFilter}
            className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1"
          >
            <Plus size={10} /> Thêm điều kiện
          </button>

          <div className="text-xs text-slate-400">
            ⓘ Thuộc tính danh mục (enum) chọn từ danh sách; thuộc tính số/ngày nhập trực tiếp. Toán tử khả dụng theo khai báo của từng thuộc tính.
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={applyFilters}
              className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Áp dụng
            </button>
            <button
              onClick={cancelFilters}
              className="text-xs px-3 py-1.5 border border-slate-200 rounded hover:bg-white"
            >
              Hủy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── SuppressionSection: dùng chung cho BL và WL ──
interface SuppressionProps {
  title: string
  mode: 'none' | 'list' | 'upload'
  onMode: (m: 'none' | 'list' | 'upload') => void
  selected: string[]
  onSelected: (s: string[]) => void
  channels: ChannelType[]
  onChannels: (c: ChannelType[]) => void
  uploadDone: boolean
  onUpload: () => void
  activeChannels: ChannelType[]
  syncNote: string
}

function SuppressionSection({ title, mode, onMode, selected, onSelected, uploadDone, onUpload, activeChannels, syncNote }: SuppressionProps) {
  const [activeTab, setActiveTab] = useState<ChannelType | null>(null)
  const [searchPerCh, setSearchPerCh] = useState<Record<string, string>>({})

  const currentTab = activeTab && activeChannels.includes(activeTab) ? activeTab : activeChannels[0] ?? null

  const searchVal = currentTab ? (searchPerCh[currentTab] ?? '') : ''
  const setSearchVal = (val: string) => {
    if (!currentTab) return
    setSearchPerCh(prev => ({ ...prev, [currentTab]: val }))
  }

  const filteredSubs = MOCK_SUBSCRIBERS.filter(s =>
    !searchVal || s.phone.includes(searchVal) || s.name.toLowerCase().includes(searchVal.toLowerCase())
  )
  const toggle = (phone: string) =>
    onSelected(selected.includes(phone) ? selected.filter(p => p !== phone) : [...selected, phone])

  return (
    <div className="space-y-2 pt-3 border-t border-slate-100">
      <div className="text-sm font-medium text-slate-600">{title}</div>

      {/* Radio options */}
      <div className="space-y-1.5">
        {(['none', 'list', 'upload'] as const).map(m => (
          <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="radio" checked={mode === m} onChange={() => onMode(m)} className="accent-blue-500" />
            <span>{{ none: 'Không dùng', list: 'Chọn từ danh sách thuê bao theo kênh', upload: 'Upload tệp' }[m]}</span>
          </label>
        ))}
      </div>

      {/* ── Chọn từ danh sách ── */}
      {mode === 'list' && (
        <div className="ml-4 border border-slate-200 rounded-lg overflow-hidden">
          {activeChannels.length === 0 ? (
            <div className="px-3 py-3 text-xs text-slate-400 italic">Chưa có kênh nào — thêm kênh trong Message Matrix trước</div>
          ) : (
            <>
              {/* Tab kênh — clickable */}
              <div className="flex border-b border-slate-200 bg-slate-50">
                {activeChannels.map(ch => (
                  <button
                    key={ch}
                    onClick={() => setActiveTab(ch)}
                    className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
                      currentTab === ch
                        ? 'border-blue-500 text-blue-600 bg-white'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {ch}
                    {selected.length > 0 && (
                      <span className="ml-1 text-[10px] text-blue-400">
                        ({selected.length})
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Search cho tab đang chọn */}
              <div className="px-3 py-2 border-b border-slate-100">
                <input
                  value={searchVal}
                  onChange={e => setSearchVal(e.target.value)}
                  placeholder={`🔍 Tìm số thuê bao cho kênh ${currentTab}...`}
                  className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Danh sách checkbox */}
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-50">
                {MOCK_SUBSCRIBERS.length === 0 ? (
                  <div className="px-3 py-4 text-xs text-slate-400 text-center leading-relaxed">
                    Không có thuê bao nào trong danh sách —<br />
                    <button
                      onClick={() => onMode('upload')}
                      className="text-blue-500 hover:text-blue-700 underline mt-0.5 inline-block"
                    >
                      vui lòng Upload tệp thay thế
                    </button>
                  </div>
                ) : (
                  <>
                    {filteredSubs.map(sub => (
                      <label key={sub.phone} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selected.includes(sub.phone)}
                          onChange={() => toggle(sub.phone)}
                          className="accent-blue-500 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-mono text-slate-700">{sub.phone}</span>
                          <span className="text-xs text-slate-400 ml-2">· {sub.name}</span>
                        </div>
                        <span className={`text-xs flex-shrink-0 ${sub.status === 'Active' ? 'text-green-600' : 'text-slate-400'}`}>
                          {sub.status}
                        </span>
                      </label>
                    ))}
                    {filteredSubs.length === 0 && (
                      <div className="px-3 py-3 text-xs text-slate-400 text-center">Không tìm thấy</div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 flex items-center gap-2">
                <span>Đã chọn: <span className="font-medium text-slate-700">{selected.length} số</span></span>
                {selected.length > 0 && (
                  <button onClick={() => onSelected([])} className="text-red-400 hover:text-red-600">Bỏ chọn tất cả</button>
                )}
              </div>
              <div className="px-3 py-1.5 text-xs text-blue-600 bg-blue-50">
                ⓘ {syncNote}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Upload tệp ── */}
      {mode === 'upload' && (
        <div className="ml-4 border border-slate-200 rounded-lg overflow-hidden">
          {/* Kênh áp dụng — checkbox */}
          <div className="px-3 pt-2.5 pb-2 border-b border-slate-100">
            <div className="text-xs text-slate-500 mb-1.5">Kênh áp dụng <span className="text-red-400">*</span></div>
            {activeChannels.length > 0 ? (
              <div className="flex gap-3 flex-wrap">
                {activeChannels.map(ch => (
                  <label key={ch} className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="checkbox" defaultChecked className="accent-blue-500" />
                    <span>{ch}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic">Chưa có kênh nào — chọn kênh gửi trước</div>
            )}
          </div>
          {/* Drop zone + format info */}
          {!uploadDone ? (
            <div className="m-3 space-y-2">
              <div
                onClick={onUpload}
                className="border-2 border-dashed border-slate-200 rounded-lg p-5 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/40 transition-colors"
              >
                <Upload size={18} className="mx-auto text-slate-300 mb-2" />
                <div className="text-xs text-slate-500">Kéo thả file CSV vào đây hoặc</div>
                <div className="text-xs text-blue-500 font-medium mt-1">Chọn file</div>
              </div>
              <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-2.5 text-xs text-slate-500 space-y-1">
                <div className="font-medium text-slate-600 flex items-center gap-1">ℹ Yêu cầu file CSV:</div>
                <div>• 1 cột <code className="bg-white px-1 rounded border border-slate-200">so_dien_thoai</code>, có hoặc không cần header</div>
                <div>• Mỗi dòng 1 số — 10 chữ số, bắt đầu bằng <code className="bg-white px-1 rounded border border-slate-200">0</code></div>
                <div>• Hợp lệ: <code className="bg-white px-1 rounded border border-slate-200">0901234567</code></div>
                <div className="text-red-400">• Sai: +84901234567 · 090-123-4567 · 901234567</div>
                <div>• Tối đa 100.000 dòng · Encoding UTF-8</div>
              </div>
              <button className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1">
                📥 Tải file mẫu (blacklist_mau.csv)
              </button>
            </div>
          ) : (
            <div className="m-3 space-y-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <div className="text-green-700 font-medium">Hợp lệ: 320</div>
                <div className="text-orange-500">Trùng: 8</div>
                <div className="text-red-500">Sai định dạng: 2</div>
                <div className="text-slate-400 pt-0.5">⚠ Sai định dạng: không phải 10 chữ số / không bắt đầu bằng 0</div>
                <button onClick={() => {}} className="text-slate-400 hover:text-slate-600 mt-1 block">
                  📄 blacklist_upload.csv · <span className="text-red-400 hover:text-red-600">Thay file</span>
                </button>
              </div>
              <button className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1">
                📥 Tải file mẫu (blacklist_mau.csv)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ScheduleBlockProps {
  scheduleType: 'now' | 'after' | 'at'
  onScheduleType: (v: 'now' | 'after' | 'at') => void
  blackoutOn: boolean
  onBlackoutOn: (v: boolean) => void
  blackoutAction: BlackoutAction
  onBlackoutAction: (v: BlackoutAction) => void
  namePrefix: string
}

function TTooltip() {
  return (
    <span className="relative group/tt inline-flex flex-shrink-0">
      <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-200 text-slate-500 text-[9px] font-bold cursor-help leading-none">i</span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-56 rounded bg-slate-800 px-2 py-1.5 text-[11px] text-white leading-snug opacity-0 group-hover/tt:opacity-100 transition-opacity z-50 whitespace-normal shadow-lg">
        T = thời điểm trigger kích hoạt cho từng khách hàng (mỗi KH có T riêng)
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
      </span>
    </span>
  )
}

function ScheduleBlock({ scheduleType, onScheduleType, blackoutOn, onBlackoutOn, blackoutAction, onBlackoutAction, namePrefix }: ScheduleBlockProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        Thời gian gửi:
        <TTooltip />
      </div>
      {(['now', 'after', 'at'] as const).map((opt, i) => (
        <label key={opt} className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="radio" name={`schedule-${namePrefix}`} checked={scheduleType === opt} onChange={() => onScheduleType(opt)} />
          <span>{['Gửi ngay sau khi trigger kích hoạt', 'Sau X phút/giờ/ngày kể từ T', 'Vào lúc HH:MM ngày T+N'][i]}</span>
        </label>
      ))}
      {scheduleType === 'after' && (
        <div className="pl-4 flex items-center gap-2 text-xs">
          <span>Sau</span>
          <input type="number" defaultValue="30" className="w-14 px-1.5 py-1 border border-slate-200 rounded text-center" />
          <select className="border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none">
            <option>phút</option><option>giờ</option><option>ngày</option>
          </select>
          <span className="text-slate-400">kể từ T</span>
          <TTooltip />
        </div>
      )}
      {scheduleType === 'at' && (
        <div className="pl-4 flex items-center gap-2 text-xs flex-wrap">
          <span>Lúc</span>
          <input type="time" defaultValue="08:00" className="px-1.5 py-1 border border-slate-200 rounded" />
          <span>ngày T+</span>
          <input type="number" defaultValue="1" className="w-12 px-1.5 py-1 border border-slate-200 rounded text-center" />
          <TTooltip />
        </div>
      )}

      <div className="space-y-1 pt-2 border-t border-slate-100">
        <div className="text-xs font-medium text-slate-500">Giờ giới nghiêm (Blackout):</div>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="radio" name={`blackout-${namePrefix}`} checked={!blackoutOn} onChange={() => onBlackoutOn(false)} />
          Không áp dụng
        </label>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="radio" name={`blackout-${namePrefix}`} checked={blackoutOn} onChange={() => onBlackoutOn(true)} />
          Bật
        </label>
        {blackoutOn && (
          <div className="pl-4 space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <input type="time" defaultValue="22:00" className="px-1.5 py-1 border border-slate-200 rounded w-20" />
              <span>—</span>
              <input type="time" defaultValue="08:00" className="px-1.5 py-1 border border-slate-200 rounded w-20" />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Xử lý:</span>
              <select
                value={blackoutAction}
                onChange={e => onBlackoutAction(e.target.value as BlackoutAction)}
                className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none"
              >
                <option value="discard">Hủy luôn</option>
                <option value="delay">Hoãn đến đầu khung giờ</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function CampaignBuilder() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { toast } = useToast()
  const existing = id ? mockCampaigns.find(c => c.id === id) : null

  // S1
  const [name, setName] = useState(existing?.name ?? '')
  const [goal, setGoal] = useState(existing?.goal ?? '')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [priority, setPriority] = useState('12')
  const [s1Collapsed, setS1Collapsed] = useState(false)

  // S2
  const [triggerMode, setTriggerMode] = useState<'basic' | 'advanced'>('advanced')
  const [selectedTriggers, setSelectedTriggers] = useState<TriggerEntry[]>(
    existing ? existing.triggers.map(code => {
      const t = mockTriggers.find(x => x.code === code)
      return { id: code, code, name: t?.name ?? code }
    }) : []
  )
  const [triggerLogic, setTriggerLogic] = useState<TriggerLogic>('OR')
  const [triggerDropdown, setTriggerDropdown] = useState(false)
  const [triggerSearch, setTriggerSearch] = useState('')
  const [andConfirm, setAndConfirm] = useState(false)
  const [segmentAndConfirm, setSegmentAndConfirm] = useState(false)
  const [s2Collapsed, setS2Collapsed] = useState(false)

  // S3 (right col)
  const [segments, setSegments] = useState<SegmentEntry[]>([])
  const [segmentDropdown, setSegmentDropdown] = useState(false)
  const [segmentLogic, setSegmentLogic] = useState<'OR' | 'AND'>('OR')
  const [tallConfirm, setTallConfirm] = useState(false)

  // Channels & schedule (right col)
  const [activeChannels, setActiveChannels] = useState<ChannelType[]>([])
  const [schedulePer, setSchedulePer] = useState<'common' | 'per'>('common')
  const [scheduleType, setScheduleType] = useState<'now' | 'after' | 'at'>('now')
  const [blackoutOn, setBlackoutOn] = useState(false)
  const [blackoutAction, setBlackoutAction] = useState<BlackoutAction>('discard')
  const [perChannelSchedule, setPerChannelSchedule] = useState<Record<string, boolean>>({})
  const [scheduleCommonConfirm, setScheduleCommonConfirm] = useState(false)

  // S4
  const [activeChannelTab, setActiveChannelTab] = useState<ChannelType>('Push')
  const [channelCards, setChannelCards] = useState<ChannelCards>({})
  const [removeChannelTarget, setRemoveChannelTarget] = useState<ChannelType | null>(null)
  const [guideOpen, setGuideOpen] = useState<Record<string, boolean>>({})
  const [s4Collapsed, setS4Collapsed] = useState(false)

  // S6
  const [dncOn, setDncOn] = useState(true)
  const [blMode, setBlMode] = useState<'none' | 'list' | 'upload'>('none')
  const [wlMode, setWlMode] = useState<'none' | 'list' | 'upload'>('none')

  const [blSelected, setBlSelected] = useState<string[]>([])
  const [wlSelected, setWlSelected] = useState<string[]>([])
  const [blUploadDone, setBlUploadDone] = useState(false)
  const [wlUploadDone, setWlUploadDone] = useState(false)
  const [blChannel, setBlChannel] = useState<ChannelType[]>([])
  const [wlChannel, setWlChannel] = useState<ChannelType[]>([])
  const [dncConfirm, setDncConfirm] = useState(false)
  const [s6Collapsed, setS6Collapsed] = useState(false)

  // Per-channel schedule state (proper)
  const [perChScheduleType, setPerChScheduleType] = useState<Record<string, 'now' | 'after' | 'at'>>({})
  const [perChBlackoutOn, setPerChBlackoutOn] = useState<Record<string, boolean>>({})
  const [perChBlackoutAction, setPerChBlackoutAction] = useState<Record<string, BlackoutAction>>({})

  // Dialogs
  const [submitConfirm, setSubmitConfirm] = useState(false)
  const [touched, setTouched] = useState(false)

  // Derived
  const hasVariants = Object.values(channelCards).some(byTrig =>
    Object.values(byTrig).some(card => card.variants.length > 1)
  )

  // Issues
  const issues: string[] = []
  if (!name.trim()) issues.push('Chưa nhập tên campaign')
  if (selectedTriggers.length === 0) issues.push('Chưa chọn trigger')
  if (activeChannels.length === 0) issues.push('Chưa chọn kênh gửi')
  if (blMode !== 'none' && activeChannels.length === 0) issues.push('Blacklist: chưa có kênh nào được chọn')
  // Cờ vô hiệu là blocking issue độc lập — chặn Gửi duyệt cho đến khi QTV sửa (URD Khối 3)
  if (existing?.paramInvalid) issues.push('Còn tham số không hợp lệ do trigger đã thay đổi — sửa nội dung message')
  if (existing?.filterInvalid) issues.push('Còn điều kiện lọc không hợp lệ do trigger đã thay đổi — sửa điều kiện lọc ở mục 3')

  // ---- Trigger helpers ----
  const canAddTrigger = triggerMode === 'advanced' || selectedTriggers.length === 0

  const addTrigger = (t: typeof mockTriggers[0]) => {
    if (!canAddTrigger) return
    if (selectedTriggers.find(x => x.code === t.code)) return
    setSelectedTriggers(prev => [...prev, { id: t.id, code: t.code, name: t.name }])
    setTriggerDropdown(false)
    setTriggerSearch('')
    setTouched(true)
  }
  const removeTrigger = (code: string) => {
    setSelectedTriggers(prev => prev.filter(t => t.code !== code))
    // remove from cards
    setChannelCards(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(ch => { delete next[ch][code] })
      return next
    })
  }

  // ---- Channel helpers ----
  const getCardData = (ch: ChannelType, trigCode: string): TriggerCardData => {
    return channelCards[ch]?.[trigCode] ?? { variants: [defaultVariant()] }
  }
  const setCardData = (ch: ChannelType, trigCode: string, data: TriggerCardData) => {
    setChannelCards(prev => ({
      ...prev,
      [ch]: { ...(prev[ch] ?? {}), [trigCode]: data }
    }))
  }

  const addChannel = (ch: ChannelType) => {
    if (activeChannels.includes(ch)) return
    setActiveChannels(prev => [...prev, ch])
    setActiveChannelTab(ch)
    setTouched(true)
  }

  const tryRemoveChannel = (ch: ChannelType) => {
    const hasContent = selectedTriggers.some(t => {
      const card = channelCards[ch]?.[t.code]
      return card?.variants.some(v => v.content.body || v.content.title)
    })
    if (hasContent) {
      setRemoveChannelTarget(ch)
    } else {
      doRemoveChannel(ch)
    }
  }
  const doRemoveChannel = (ch: ChannelType) => {
    setActiveChannels(prev => {
      const next = prev.filter(x => x !== ch)
      if (activeChannelTab === ch) setActiveChannelTab(next[0] ?? 'Push')
      return next
    })
    setChannelCards(prev => { const n = { ...prev }; delete n[ch]; return n })
    setRemoveChannelTarget(null)
  }

  // ---- AND confirm ----
  const handleAndSwitch = () => {
    if (hasVariants) {
      setAndConfirm(true)
    } else {
      setTriggerLogic('AND')
    }
  }
  const confirmAndSwitch = () => {
    setTriggerLogic('AND')
    // remove all variants beyond index 0
    setChannelCards(prev => {
      const next: ChannelCards = {}
      Object.entries(prev).forEach(([ch, byTrig]) => {
        next[ch] = {}
        Object.entries(byTrig).forEach(([code, card]) => {
          next[ch][code] = { variants: [card.variants[0] ?? defaultVariant()] }
        })
      })
      return next
    })
    setAndConfirm(false)
  }

  const handleSegmentAndSwitch = () => {
    if (hasVariants) {
      setSegmentAndConfirm(true)
    } else {
      setSegmentLogic('AND')
    }
  }

  const confirmSegmentAndSwitch = () => {
    setSegmentLogic('AND')
    setChannelCards(prev => {
      const next: ChannelCards = {}
      Object.entries(prev).forEach(([ch, byTrig]) => {
        next[ch] = {}
        Object.entries(byTrig).forEach(([code, card]) => {
          next[ch][code] = { variants: [card.variants[0] ?? defaultVariant()] }
        })
      })
      return next
    })
    setSegmentAndConfirm(false)
  }

  // ---- Schedule ----
  const handleSwitchToCommon = () => {
    if (schedulePer === 'per') {
      setScheduleCommonConfirm(true)
    } else {
      setSchedulePer('common')
    }
  }

  // ---- Submit ----
  const handleSubmit = () => {
    if (issues.length) return
    if (segments.length === 0) {
      setTallConfirm(true)
    } else {
      setSubmitConfirm(true)
    }
  }
  const confirmSubmit = () => {
    toast('Đã gửi duyệt ✓', 'success')
    navigate('/campaigns')
  }

  const activeTriggers = mockTriggers.filter(t => t.status === 'Active')
  const filteredTriggers = activeTriggers.filter(t =>
    !selectedTriggers.find(x => x.code === t.code) &&
    (t.code.toLowerCase().includes(triggerSearch.toLowerCase()) ||
      t.name.toLowerCase().includes(triggerSearch.toLowerCase()))
  )

  const reach = segments.reduce((s, seg) => s + seg.reach, 0)

  // Channel completion indicator
  const channelCompletion = (ch: ChannelType): { done: number; total: number } => {
    if (triggerLogic === 'AND') {
      const card = channelCards[ch]?.['__AND__']
      const done = (card?.variants[0]?.content.body || card?.variants[0]?.content.title) ? 1 : 0
      return { done, total: 1 }
    }
    const total = selectedTriggers.length
    const done = selectedTriggers.filter(t => {
      const card = channelCards[ch]?.[t.code]
      return !!(card?.variants[0]?.content.body || card?.variants[0]?.content.title)
    }).length
    return { done, total }
  }

  // Triggers to render in S4 (AND = single pseudo-trigger)
  const s4Triggers = triggerLogic === 'AND'
    ? [{ id: '__AND__', code: '__AND__', name: 'Tất cả trigger (AND)' }]
    : selectedTriggers

  return (
    <div className="flex flex-col h-[calc(100vh-56px-48px)]">
      {/* Sticky sub-header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between -mx-6 -mt-6 mb-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/campaigns')} className="text-slate-500 hover:text-slate-700">
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-800">{name || 'Campaign mới'}</span>
              <StatusBadge status="Draft" />
            </div>
            <div className="text-xs text-slate-400 font-mono">CVM-{new Date().getFullYear()}{String(new Date().getMonth()+1).padStart(2,'0')}-NEW</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => toast('Đã lưu nháp ✓', 'success')}>Lưu Nháp</Button>
          <div className="relative group">
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={issues.length > 0}
            >
              {issues.length > 0 && <AlertCircle size={12} className="text-red-300" />}
              Gửi duyệt →
              {issues.length > 0 && (
                <span className="ml-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
                  {issues.length}
                </span>
              )}
            </Button>
            {issues.length > 0 && (
              <div className="absolute right-0 top-full mt-1 bg-slate-800 text-white text-xs rounded-lg px-3 py-2 hidden group-hover:block z-30 w-56 space-y-1">
                {issues.map((issue, i) => <div key={i}>• {issue}</div>)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Banner cảnh báo PARAM_INVALID */}
      {existing?.paramInvalid && (
        <div className="mt-6 -mb-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            Campaign đang có tham số không hợp lệ do trigger <strong>{existing.paramInvalid.triggerName}</strong> đã
            thay đổi tham số <strong>{existing.paramInvalid.paramName}</strong> — vui lòng cập nhật nội dung message
            trước khi gửi duyệt lại.
          </span>
        </div>
      )}

      {/* Banner cảnh báo FILTER_INVALID */}
      {existing?.filterInvalid && (
        <div className="mt-6 -mb-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 flex items-start gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            Campaign đang có điều kiện lọc không hợp lệ do trigger <strong>{existing.filterInvalid.triggerName}</strong> đã
            thay đổi thuộc tính lọc <strong>{existing.filterInvalid.filterFieldName}</strong> — vui lòng cập nhật điều kiện lọc
            ở mục 3 (Phân khúc) trước khi gửi duyệt lại.
          </span>
        </div>
      )}

      {/* 2-col body */}
      <div className="flex flex-1 overflow-hidden mt-6">
        {/* ─── LEFT ─── */}
        <div className="w-[60%] overflow-y-auto pr-6 space-y-4">

          {/* S1 */}
          <Card amber>
            <SectionHeader title="1. Thông tin Campaign" collapsed={s1Collapsed} onToggle={() => setS1Collapsed(!s1Collapsed)} />
            {!s1Collapsed && (
              <div className="mt-4 space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Tên campaign *</label>
                  <input value={name} onChange={e => { setName(e.target.value); setTouched(true) }} placeholder="Nhập tên campaign..."
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">Mã kịch bản (tự sinh, chỉ đọc)</label>
                  <div className="px-3 py-2 text-sm border border-slate-100 rounded-md bg-slate-50 text-slate-400 font-mono">
                    CVM-{new Date().getFullYear()}{String(new Date().getMonth()+1).padStart(2,'0')}-0042
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Mục tiêu</label>
                    <input value={goal} onChange={e => setGoal(e.target.value)} placeholder="VD: Tăng tỉ lệ cài app sau kích hoạt SIM"
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Độ ưu tiên</label>
                    <input type="number" value={priority} onChange={e => setPriority(e.target.value)} placeholder="VD: 1"
                      min="1" max="9999"
                      className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:border-blue-400 ${priority !== '' && (Number(priority) < 1 || Number(priority) > 9999 || !Number.isInteger(Number(priority))) ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} />
                    {priority !== '' && (Number(priority) < 1 || Number(priority) > 9999 || !Number.isInteger(Number(priority))) && (
                      <div className="text-xs text-red-500 mt-1">Độ ưu tiên phải là số nguyên từ 1 đến 9999</div>
                    )}
                    <div className="text-xs text-slate-400 mt-1">Số nhỏ hơn = ưu tiên cao hơn · mặc định = max+1</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Ngày bắt đầu</label>
                    <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setTouched(true) }}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-1 block">Ngày kết thúc</label>
                    <input type="date" value={endDate} onChange={e => { setEndDate(e.target.value); setTouched(true) }}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400" />
                  </div>
                </div>
                <div className="text-xs text-slate-500">Người tạo: QTV Marketing</div>
              </div>
            )}
          </Card>

          {/* S2 */}
          <Card amber>
            <SectionHeader title="2. Trigger & Logic" collapsed={s2Collapsed} onToggle={() => setS2Collapsed(!s2Collapsed)} />
            {!s2Collapsed && (
              <div className="mt-4 space-y-4">
                {/* Mode radio */}
                <div className="flex gap-4 text-sm">
                  {(['basic', 'advanced'] as const).map(m => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" checked={triggerMode === m}
                        onChange={() => {
                          setTriggerMode(m)
                          if (m === 'basic' && selectedTriggers.length > 1) {
                            setSelectedTriggers(prev => [prev[0]])
                          }
                        }} />
                      <span>{m === 'basic' ? 'Cơ bản (1 trigger)' : 'Nâng cao (nhiều trigger + logic)'}</span>
                    </label>
                  ))}
                </div>

                {/* Add trigger */}
                <div className="relative">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => canAddTrigger && setTriggerDropdown(!triggerDropdown)}
                    disabled={!canAddTrigger}
                    title={!canAddTrigger ? 'Chế độ cơ bản chỉ cho phép 1 trigger' : undefined}
                  >
                    <Plus size={12} /> Chọn trigger
                    <ChevronDown size={12} />
                  </Button>
                  {!canAddTrigger && (
                    <span className="ml-2 text-xs text-slate-400">Chế độ cơ bản: chỉ 1 trigger</span>
                  )}
                  {triggerDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-96 bg-white border border-slate-200 rounded-lg shadow-lg z-20">
                      <div className="p-2 border-b border-slate-100">
                        <input autoFocus value={triggerSearch} onChange={e => setTriggerSearch(e.target.value)}
                          placeholder="Tìm trigger code hoặc tên..."
                          className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none" />
                      </div>
                      <div className="max-h-48 overflow-y-auto py-1">
                        {filteredTriggers.map(t => (
                          <button key={t.code} onClick={() => addTrigger(t)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-start gap-2">
                            <span className="font-mono text-xs text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded mt-0.5">{t.code}</span>
                            <div>
                              <div className="text-slate-700">{t.name}</div>
                              <div className="text-xs text-slate-400">{t.source} · {t.type}</div>
                            </div>
                          </button>
                        ))}
                        {activeTriggers.length === 0 && (
                          <div className="px-3 py-2 text-sm text-slate-400">Không có trigger nào đang hoạt động</div>
                        )}
                        {activeTriggers.length > 0 && filteredTriggers.length === 0 && (
                          <div className="px-3 py-2 text-sm text-slate-400">Không tìm thấy trigger</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Trigger list */}
                {selectedTriggers.length === 0 ? (
                  <div className="text-sm text-slate-400 text-center py-4 border border-dashed border-slate-200 rounded-lg">
                    ⓘ Chưa có trigger. Nhấn "+ Chọn trigger" để bắt đầu.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedTriggers.map((t, i) => (
                      <div key={t.code} className="flex items-center gap-3 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50">
                        <span className="text-xs text-slate-400 w-4 font-bold">{i + 1}</span>
                        <GripVertical size={14} className="text-slate-300 cursor-grab" />
                        <TriggerChip code={t.code} />
                        <span className="text-sm text-slate-600 flex-1 truncate">{t.name}</span>
                        <button onClick={() => removeTrigger(t.code)} className="text-slate-300 hover:text-red-400 flex-shrink-0">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Logic (Advanced + ≥ 2 triggers) */}
                {triggerMode === 'advanced' && selectedTriggers.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-600">Logic:</div>
                    <div className="flex gap-4 text-sm">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={triggerLogic === 'OR'} onChange={() => setTriggerLogic('OR')} />
                        OR
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" checked={triggerLogic === 'AND'} onChange={handleAndSwitch} />
                        AND
                      </label>
                    </div>
                    <div className="text-xs text-slate-500 bg-blue-50 rounded p-2">
                      {triggerLogic === 'OR'
                        ? (<>Mỗi trigger có message riêng. KH match trigger nào → nhận message của trigger đó.<br />
                            <span className="font-medium">Nếu KH khớp nhiều trigger cùng lúc → chỉ gửi trigger có thứ tự ưu tiên cao nhất (số 1).</span></>)
                        : 'KH phải thỏa đồng thời tất cả trigger mới được gửi tin. Tất cả trigger dùng chung 1 message cho mỗi kênh.'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* S4 */}
          <Card amber>
            <SectionHeader title="4. Message Matrix · Trigger × Kênh" collapsed={s4Collapsed} onToggle={() => setS4Collapsed(!s4Collapsed)} />
            {!s4Collapsed && (
              <div className="mt-4 space-y-4">
                <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1.5">
                  ⓘ Thời gian gửi và giờ giới nghiêm được cấu hình trong "Kênh & Lịch gửi" ở cột phải.
                </div>

                {activeChannels.length === 0 ? (
                  <div className="text-sm text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-lg space-y-2">
                    <div>Chưa có kênh nào.</div>
                    <div className="flex justify-center">
                      <select
                        onChange={e => { if (e.target.value) { addChannel(e.target.value as ChannelType); (e.target as HTMLSelectElement).value = '' }}}
                        className="text-sm border border-blue-300 rounded px-3 py-1.5 text-blue-600 cursor-pointer focus:outline-none bg-blue-50 hover:bg-blue-100"
                        value=""
                      >
                        <option value="">+ Thêm kênh gửi</option>
                        {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Progress */}
                    <div className="flex gap-2 items-center flex-wrap text-xs">
                      <span className="text-slate-500 font-medium">TIẾN ĐỘ NỘI DUNG:</span>
                      {activeChannels.map(ch => {
                        const { done, total } = channelCompletion(ch)
                        const dots = Array.from({ length: total }, (_, i) => i < done ? '●' : '○').join('')
                        return (
                          <span key={ch} className={done === total ? 'text-green-600 font-medium' : done > 0 ? 'text-orange-500' : 'text-slate-400'}>
                            {ch} {dots}
                          </span>
                        )
                      })}
                    </div>

                    {/* Channel tabs */}
                    <div className="flex gap-1 flex-wrap border-b border-slate-200 pb-0">
                      {activeChannels.map(ch => {
                        const { done, total } = channelCompletion(ch)
                        const dots = Array.from({ length: total }, (_, i) => i < done ? '●' : '○').join('')
                        return (
                          <div
                            key={ch}
                            onClick={() => setActiveChannelTab(ch)}
                            className={`flex items-center gap-1 px-3 py-1.5 text-xs cursor-pointer border-b-2 transition-colors ${
                              activeChannelTab === ch
                                ? 'border-blue-500 text-blue-700 font-medium'
                                : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                          >
                            {ch} <span className={done === total && total > 0 ? 'text-green-600' : done > 0 ? 'text-orange-500' : 'text-slate-300'}>{dots}</span>
                            <button
                              onClick={e => { e.stopPropagation(); tryRemoveChannel(ch) }}
                              className="ml-1 hover:text-red-400 text-slate-300"
                            >
                              <X size={10} />
                            </button>
                          </div>
                        )
                      })}
                      <select
                        onChange={e => { if (e.target.value) { addChannel(e.target.value as ChannelType); (e.target as HTMLSelectElement).value = '' }}}
                        className="text-xs border border-dashed border-slate-300 rounded px-2 py-1 text-slate-500 cursor-pointer focus:outline-none mb-0.5"
                        value=""
                      >
                        <option value="">+ Kênh</option>
                        {CHANNELS.filter(ch => !activeChannels.includes(ch)).map(ch => (
                          <option key={ch} value={ch}>{ch}</option>
                        ))}
                      </select>
                    </div>

                    {/* Message cards */}
                    {selectedTriggers.length === 0 ? (
                      <div className="text-sm text-slate-400 text-center py-4">
                        Chưa có trigger. Hãy thêm trigger ở Section 2.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {s4Triggers.map((trig, ti) => {
                          const guideKey = `${activeChannelTab}-${trig.code}`
                          const cardData = getCardData(activeChannelTab, trig.code)
                          // For AND mode, use a merged params list from all triggers
                          const displayTrig = triggerLogic === 'AND'
                            ? { ...trig, code: 'ALL TRIGGERS (AND)', name: 'Dùng chung cho tất cả trigger' }
                            : trig
                          return (
                            <TriggerCard
                              key={trig.code}
                              trig={displayTrig}
                              ti={ti}
                              ch={activeChannelTab}
                              availableSegments={segments}
                              data={cardData}
                              onChange={d => setCardData(activeChannelTab, trig.code, d)}
                              guideOpen={!!guideOpen[guideKey]}
                              onGuideToggle={() => setGuideOpen(prev => ({ ...prev, [guideKey]: !prev[guideKey] }))}
                              canShowVariant={triggerLogic === 'OR' && segmentLogic === 'OR'}
                            />
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </Card>

          {/* S6 */}
          <Card amber>
            <SectionHeader title="6. An toàn" collapsed={s6Collapsed} onToggle={() => setS6Collapsed(!s6Collapsed)} />
            {!s6Collapsed && (
              <div className="mt-4 space-y-4">
                <div className="text-xs text-blue-600 bg-blue-50 rounded px-2 py-1.5">
                  ⓘ Giờ giới nghiêm (Blackout) được cấu hình trong "Kênh &amp; Lịch gửi" — theo từng kênh hoặc lịch chung.
                </div>

                <div className="border border-slate-200 rounded-lg p-3 space-y-4">
                  {/* DNC */}
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={dncOn}
                      onChange={e => { if (!e.target.checked) setDncConfirm(true) }}
                      className="accent-blue-500" />
                    <span>Check DNC toàn hệ thống (luôn bật mặc định)</span>
                  </label>

                  {/* ── Blacklist ── */}
                  <SuppressionSection
                    title="Blacklist campaign — theo kênh"
                    mode={blMode}
                    onMode={setBlMode}
                    selected={blSelected}
                    onSelected={setBlSelected}
                    channels={blChannel.length ? blChannel : activeChannels}
                    onChannels={setBlChannel}
                    uploadDone={blUploadDone}
                    onUpload={() => setBlUploadDone(true)}
                    activeChannels={activeChannels}
                    syncNote="Danh sách này sẽ tự đồng bộ sang Blacklist Management"
                  />

                  {/* ── Whitelist ── */}
                  <SuppressionSection
                    title="Whitelist campaign — theo kênh"
                    mode={wlMode}
                    onMode={setWlMode}
                    selected={wlSelected}
                    onSelected={setWlSelected}
                    channels={wlChannel.length ? wlChannel : activeChannels}
                    onChannels={setWlChannel}
                    uploadDone={wlUploadDone}
                    onUpload={() => setWlUploadDone(true)}
                    activeChannels={activeChannels}
                    syncNote="Chỉ gửi cho những số trong whitelist"
                  />

                  {/* Reach cuối */}
                  <div className="pt-2 border-t border-slate-100 text-sm">
                    <span className="text-slate-500">Reach cuối cùng: </span>
                    <span className="font-semibold text-blue-600">
                      ~{Math.max(0, reach - (blMode !== 'none' ? 320 : 0)).toLocaleString('vi-VN')} KH
                    </span>
                    <div className="text-xs text-slate-400 mt-0.5">
                      = {reach.toLocaleString('vi-VN')} → trừ DNC → trừ BL → giao WL
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 rounded px-2 py-1.5">
                  ⓘ Giới hạn tần suất nhận tin (frequency cap) được cấu hình tại Settings
                  <button onClick={() => navigate('/settings')} className="ml-1 text-blue-500 hover:text-blue-700">
                    Đến Settings →
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ─── RIGHT ─── */}
        <div className="w-[40%] pl-6 border-l border-slate-200 overflow-y-auto space-y-4">

          {/* Summary */}
          <Card className="space-y-2">
            <div className="text-sm font-semibold text-slate-700">Tóm tắt Campaign</div>
            {!touched ? null : issues.length > 0 ? (
              <div className="space-y-1">
                {issues.map((issue, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                    <AlertCircle size={10} /> {issue}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-green-600 flex items-center gap-1">✓ Sẵn sàng gửi duyệt</div>
            )}
            <div className="text-xs text-slate-500">
              Reach ước tính: <span className="font-semibold text-slate-700">~{reach.toLocaleString('vi-VN')} KH</span>
            </div>
            <div className="text-xs text-slate-400">
              Reach cuối cùng: ~{Math.max(0, reach - (blMode !== 'none' ? 320 : 0)).toLocaleString('vi-VN')} KH
            </div>
          </Card>

          {/* S3 Audience */}
          <Card amber className="space-y-4">
            <div className="text-sm font-semibold text-slate-700">3. Audience / Phân khúc</div>
            <div className="text-xs text-slate-500">
              Nguồn: Customer 360 · Team Data · BSS · OCS
              <br />Reach ước tính tại: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </div>

            {/* Segment picker */}
            <div className="relative">
              <button onClick={() => setSegmentDropdown(!segmentDropdown)}
                className="flex items-center gap-2 w-full text-sm px-3 py-2 border border-slate-200 rounded-md hover:border-blue-400 focus:outline-none text-slate-500">
                <span className="flex-1 text-left">🔍 Tìm phân khúc...</span>
                <ChevronDown size={14} />
              </button>
              {segmentDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                  {mockSegments.filter(s => !segments.find(x => x.id === s.id)).map(s => (
                    <button key={s.id}
                      onClick={() => { setSegments(prev => [...prev, { id: s.id, name: s.name, reach: s.reach }]); setSegmentDropdown(false) }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50">
                      <div className="font-medium text-slate-700">{s.name}</div>
                      <div className="text-xs text-slate-400">{s.reach.toLocaleString('vi-VN')} KH · {s.source}</div>
                    </button>
                  ))}
                  {mockSegments.filter(s => !segments.find(x => x.id === s.id)).length === 0 && (
                    <div className="px-3 py-2 text-sm text-slate-400">Đã chọn tất cả phân khúc</div>
                  )}
                </div>
              )}
            </div>

            {/* Selected segments */}
            {segments.length === 0 ? (
              <div className="text-xs text-slate-400 text-center py-2">Chưa chọn phân khúc nào</div>
            ) : (
              <div className="space-y-2">
                {segments.map(seg => (
                  <SegmentCard
                    key={seg.id}
                    seg={seg}
                    onChange={updated => setSegments(prev => prev.map(x => x.id === seg.id ? updated : x))}
                    onRemove={() => setSegments(prev => prev.filter(x => x.id !== seg.id))}
                    fieldGroups={selectedTriggers.map(t => ({
                      triggerCode: t.code,
                      fields: mockTriggers.find(mt => mt.code === t.code)?.filterFields ?? [],
                    }))}
                  />
                ))}
              </div>
            )}

            {/* Segment logic */}
            {segments.length > 1 && (
              <div className="flex gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={segmentLogic === 'OR'} onChange={() => setSegmentLogic('OR')} />
                  Bất kỳ phân khúc nào (OR)
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="radio" checked={segmentLogic === 'AND'} onChange={handleSegmentAndSwitch} />
                  Tất cả phân khúc (AND)
                </label>
              </div>
            )}

            {/* Reach */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
              <div className="text-xs">
                <span className="text-slate-500">Reach ước tính: </span>
                <span className="font-semibold text-blue-600">~{reach.toLocaleString('vi-VN')} KH</span>
              </div>
              <button className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                <RefreshCw size={10} /> Tính lại
              </button>
            </div>
            <div className="text-xs text-slate-400 bg-blue-50 rounded px-2 py-1.5">
              ⓘ Reach ước tính tại thời điểm hiện tại. Phân khúc được đánh giá lại khi trigger kích hoạt — KH có thể vào/ra phân khúc theo thời gian.
            </div>
          </Card>

          {/* Kênh & Lịch gửi */}
          <Card amber className="space-y-3">
            <div className="text-sm font-semibold text-slate-700">5. Kênh &amp; Lịch gửi</div>

            {activeChannels.length === 0 ? (
              <div className="text-xs text-slate-400 bg-slate-50 rounded px-3 py-2">
                Chưa có kênh — thêm kênh trong Message Matrix để cấu hình lịch.
              </div>
            ) : (
              <div className="text-xs text-slate-500">
                Kênh đang có: <span className="font-medium text-slate-700">{activeChannels.join(' · ')}</span>
              </div>
            )}

            {/* Schedule type radio */}
            {activeChannels.length > 0 && (
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <div className="text-xs font-medium text-slate-600">Lịch gửi:</div>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="radio" checked={schedulePer === 'common'} onChange={handleSwitchToCommon} />
                  Lịch chung (áp dụng cho tất cả kênh)
                </label>
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="radio" checked={schedulePer === 'per'} onChange={() => setSchedulePer('per')} />
                  Lịch riêng theo kênh
                </label>

                {/* ── Lịch chung ── */}
                {schedulePer === 'common' && (
                  <div className="pl-4 space-y-2 mt-1 border-l-2 border-slate-100">
                    <ScheduleBlock
                      scheduleType={scheduleType}
                      onScheduleType={setScheduleType}
                      blackoutOn={blackoutOn}
                      onBlackoutOn={setBlackoutOn}
                      blackoutAction={blackoutAction}
                      onBlackoutAction={setBlackoutAction}
                      namePrefix="common"
                    />
                  </div>
                )}

                {/* ── Lịch riêng theo kênh — accordion ── */}
                {schedulePer === 'per' && activeChannels.length > 0 && (
                  <div className="space-y-2 mt-1">
                    {activeChannels.map(ch => (
                      <div key={ch} className="border border-slate-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setPerChannelSchedule(prev => ({ ...prev, [ch]: !prev[ch] }))}
                          className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100"
                        >
                          <span>{ch}</span>
                          <span className="text-slate-400">{perChannelSchedule[ch] ? '▼' : '▶'}</span>
                        </button>
                        {perChannelSchedule[ch] && (
                          <div className="p-3">
                            <ScheduleBlock
                              scheduleType={perChScheduleType[ch] ?? 'now'}
                              onScheduleType={v => setPerChScheduleType(prev => ({ ...prev, [ch]: v }))}
                              blackoutOn={!!perChBlackoutOn[ch]}
                              onBlackoutOn={v => setPerChBlackoutOn(prev => ({ ...prev, [ch]: v }))}
                              blackoutAction={perChBlackoutAction[ch] ?? 'discard'}
                              onBlackoutAction={v => setPerChBlackoutAction(prev => ({ ...prev, [ch]: v }))}
                              namePrefix={ch}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <Dialog open={tallConfirm} onClose={() => setTallConfirm(false)} title="Gửi đến tất cả khách hàng?">
        <p className="text-sm text-slate-600">
          Không chọn phân khúc nào — hệ thống sẽ gửi đến <strong>TẤT CẢ khách hàng (T-ALL)</strong>. Xác nhận?
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setTallConfirm(false)}>Hủy</Button>
          <Button variant="primary" onClick={() => { setTallConfirm(false); setSubmitConfirm(true) }}>Xác nhận T-ALL</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={andConfirm} onClose={() => setAndConfirm(false)} title="Chuyển sang logic AND?">
        <p className="text-sm text-slate-600">
          Chuyển sang logic AND sẽ xóa toàn bộ Biến thể đối tượng đã tạo. Tiếp tục?
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setAndConfirm(false)}>Hủy</Button>
          <Button variant="primary" onClick={confirmAndSwitch}>Xác nhận</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={segmentAndConfirm} onClose={() => setSegmentAndConfirm(false)} title="Chuyển sang Tất cả phân khúc (AND)?">
        <p className="text-sm text-slate-600">
          Chuyển sang logic AND sẽ xóa toàn bộ Biến thể đối tượng đã thiết lập. Hành động này không thể hoàn tác. Xác nhận chuyển đổi?
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setSegmentAndConfirm(false)}>Hủy</Button>
          <Button variant="primary" onClick={confirmSegmentAndSwitch}>Xác nhận</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={dncConfirm} onClose={() => setDncConfirm(false)} title="Tắt DNC?">
        <p className="text-sm text-slate-600">Tắt DNC có thể vi phạm quy định gửi tin. Chắc chắn?</p>
        <DialogActions>
          <Button variant="outline" onClick={() => setDncConfirm(false)}>Hủy</Button>
          <Button variant="danger" onClick={() => { setDncOn(false); setDncConfirm(false) }}>Tắt</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!removeChannelTarget} onClose={() => setRemoveChannelTarget(null)} title={`Bỏ kênh ${removeChannelTarget}?`}>
        <p className="text-sm text-slate-600">Nội dung đã soạn cho kênh này sẽ mất. Không thể hoàn tác.</p>
        <DialogActions>
          <Button variant="outline" onClick={() => setRemoveChannelTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={() => removeChannelTarget && doRemoveChannel(removeChannelTarget)}>Bỏ kênh</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={scheduleCommonConfirm} onClose={() => setScheduleCommonConfirm(false)} title="Chuyển về lịch chung?">
        <p className="text-sm text-slate-600">Chuyển về lịch chung sẽ ghi đè cấu hình lịch của tất cả kênh. Tiếp tục?</p>
        <DialogActions>
          <Button variant="outline" onClick={() => setScheduleCommonConfirm(false)}>Hủy</Button>
          <Button variant="primary" onClick={() => { setSchedulePer('common'); setScheduleCommonConfirm(false) }}>Xác nhận</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={submitConfirm} onClose={() => setSubmitConfirm(false)} title="Gửi campaign để duyệt?">
        <p className="text-sm text-slate-600">Campaign sẽ chuyển sang trạng thái Pending và gửi đến Admin để duyệt.</p>
        <DialogActions>
          <Button variant="outline" onClick={() => setSubmitConfirm(false)}>Hủy</Button>
          <Button variant="primary" onClick={confirmSubmit}>Gửi duyệt</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

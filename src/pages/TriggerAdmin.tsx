import { useState } from 'react'
import { Search, Plus, X, CheckCircle, Copy, Trash2 } from 'lucide-react'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { Button } from '../components/ui/Button'
import { useToast } from '../components/ui/Toast'
import { mockTriggers, mockCampaigns } from '../data/mock'
import { campaignsUsingTrigger } from '../lib/utils'
import type { Trigger, TriggerType, TriggerParam, TriggerFilterField, FilterFieldDataType } from '../types'

const TYPE_BADGE: Record<TriggerType, string> = {
  Realtime: 'bg-green-100 text-green-700',
  'Near Realtime': 'bg-blue-100 text-blue-700',
  Offline: 'bg-slate-100 text-slate-600',
}

const SOURCE_OPTIONS = ['BSS', 'OCS', 'SuperApp'] as const
const TYPE_OPTIONS: TriggerType[] = ['Realtime', 'Near Realtime', 'Offline']

// Kiểu dữ liệu điều kiện lọc — đồng bộ danh mục gốc trigger-sub-conditions.md
const DATA_TYPE_OPTIONS: { value: FilterFieldDataType; label: string }[] = [
  { value: 'enum', label: 'Danh mục (enum)' },
  { value: 'string', label: 'Chuỗi (string)' },
  { value: 'integer', label: 'Số nguyên (integer)' },
  { value: 'decimal', label: 'Số thập phân (decimal)' },
  { value: 'float', label: 'Số thực (float)' },
  { value: 'boolean', label: 'Đúng/Sai (boolean)' },
  { value: 'date', label: 'Ngày (date)' },
  { value: 'datetime', label: 'Ngày giờ (datetime)' },
]
const DATA_TYPE_LABEL: Record<FilterFieldDataType, string> = {
  enum: 'enum', string: 'string', integer: 'integer', decimal: 'decimal',
  float: 'float', boolean: 'boolean', date: 'date', datetime: 'datetime',
}

// Toán tử khai báo được cho mỗi điều kiện lọc — Admin tick những cái áp dụng.
// Hiển thị nhãn tiếng Việt dễ hiểu, lưu vẫn là ký hiệu gốc (op) để khớp danh mục + dev đối chiếu.
const OPERATOR_OPTIONS: { op: string; label: string }[] = [
  { op: '=', label: 'Bằng' },
  { op: '!=', label: 'Khác' },
  { op: '>', label: 'Lớn hơn' },
  { op: '<', label: 'Nhỏ hơn' },
  { op: '>=', label: 'Lớn hơn hoặc bằng' },
  { op: '<=', label: 'Nhỏ hơn hoặc bằng' },
  { op: 'BETWEEN', label: 'Trong khoảng' },
  { op: 'IN', label: 'Thuộc danh sách' },
  { op: 'NOT IN', label: 'Không thuộc danh sách' },
  { op: 'CONTAINS', label: 'Có chứa' },
  { op: 'AFTER', label: 'Sau ngày' },
  { op: 'BEFORE', label: 'Trước ngày' },
  { op: 'IS NULL', label: 'Bỏ trống' },
  { op: 'IS NOT NULL', label: 'Có giá trị' },
]
const OP_LABEL: Record<string, string> = Object.fromEntries(OPERATOR_OPTIONS.map(o => [o.op, o.label]))
const opLabel = (op: string) => OP_LABEL[op] ?? op

// Bản nháp form khai báo điều kiện lọc — dùng chung cho cả tạo mới lẫn xem/sửa
// Admin chỉ nhập tên nghiệp vụ; techName (mã kỹ thuật để trao đổi với dev) hệ thống tự sinh.
type FilterFieldDraft = {
  name: string
  dataType: FilterFieldDataType
  operators: string[]
  required: boolean
  values: string   // enum: danh sách cách nhau bằng dấu phẩy
}
type FfErrors = { name?: string; operators?: string; values?: string }

function emptyFfDraft(): FilterFieldDraft {
  return { name: '', dataType: 'enum', operators: [], required: false, values: '' }
}

// slug tên nghiệp vụ → snake_case không dấu, làm techName tự sinh cho dev tham chiếu
function slugTechName(name: string): string {
  return name.trim().toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    || 'field'
}

// validate + build 1 TriggerFilterField từ draft; `existing` để check trùng theo tên nghiệp vụ
function validateFf(d: FilterFieldDraft, existing: TriggerFilterField[]): FfErrors {
  const e: FfErrors = {}
  if (!d.name.trim()) e.name = 'Bắt buộc'
  else if (existing.some(f => f.name.trim().toLowerCase() === d.name.trim().toLowerCase())) e.name = 'Thuộc tính đã tồn tại'
  if (d.operators.length === 0) e.operators = 'Chọn ít nhất 1 toán tử'
  if (d.dataType === 'enum') {
    // Enum là giá trị nghiệp vụ tự do — KHÔNG ép định dạng (số/chữ/khoảng đều hợp lệ).
    // Chỉ validate: có ít nhất 1 giá trị, và không trùng nhau.
    const vals = d.values.split(',').map(v => v.trim()).filter(Boolean)
    if (vals.length === 0) e.values = 'Kiểu danh mục cần danh sách giá trị'
    else {
      const seen = new Set<string>()
      const dup = vals.find(v => { const k = v.toLowerCase(); if (seen.has(k)) return true; seen.add(k); return false })
      if (dup) e.values = `Giá trị "${dup}" bị lặp — mỗi giá trị chỉ khai báo 1 lần`
    }
  }
  return e
}
function buildFf(d: FilterFieldDraft, existing: TriggerFilterField[]): TriggerFilterField {
  // đảm bảo techName không trùng: thêm hậu tố _2, _3... nếu cần
  let base = slugTechName(d.name)
  let techName = base
  let n = 2
  while (existing.some(f => f.techName === techName)) techName = `${base}_${n++}`
  return {
    techName,
    name: d.name.trim(),
    dataType: d.dataType,
    operators: d.operators,
    required: d.required,
    values: d.dataType === 'enum' ? d.values.split(',').map(v => v.trim()).filter(Boolean) : [],
  }
}

// Form khai báo 1 điều kiện lọc — dùng chung cho modal Tạo mới và Xem/Sửa
function FilterFieldForm({ draft, errors, onChange, onSave, onCancel }: {
  draft: FilterFieldDraft
  errors: FfErrors
  onChange: (d: FilterFieldDraft) => void
  onSave: () => void
  onCancel: () => void
}) {
  const toggleOp = (op: string) =>
    onChange({ ...draft, operators: draft.operators.includes(op) ? draft.operators.filter(o => o !== op) : [...draft.operators, op] })
  return (
    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="text-xs text-slate-500 mb-0.5 block">Tên thuộc tính <span className="text-red-400">*</span></label>
          <input
            value={draft.name}
            onChange={e => onChange({ ...draft, name: e.target.value })}
            placeholder="vd: Phân khúc tuổi"
            className={`w-full px-2.5 py-1.5 text-xs border rounded focus:outline-none focus:border-blue-400 ${errors.name ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-0.5">{errors.name}</p>}
        </div>
        <div className="w-44">
          <label className="text-xs text-slate-500 mb-0.5 block">Kiểu dữ liệu</label>
          <select
            value={draft.dataType}
            onChange={e => onChange({ ...draft, dataType: e.target.value as FilterFieldDataType })}
            className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-400"
          >
            {DATA_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-slate-600 pb-1.5 cursor-pointer">
          <input type="checkbox" checked={draft.required} onChange={e => onChange({ ...draft, required: e.target.checked })} className="accent-blue-500" />
          Bắt buộc
        </label>
      </div>
      {/* Toán tử hỗ trợ — tick nhiều */}
      <div>
        <label className="text-xs text-slate-500 mb-1 block">Toán tử hỗ trợ <span className="text-red-400">*</span> <span className="text-slate-400 font-normal">(tick những toán tử áp dụng)</span></label>
        <div className="flex flex-wrap gap-1.5">
          {OPERATOR_OPTIONS.map(({ op, label }) => {
            const on = draft.operators.includes(op)
            return (
              <button
                key={op}
                type="button"
                onClick={() => toggleOp(op)}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded border transition-colors ${on ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-200 text-slate-600 hover:bg-white'}`}
              >
                {label}
                <span className={`font-mono text-[10px] ${on ? 'text-blue-100' : 'text-slate-400'}`}>{op}</span>
              </button>
            )
          })}
        </div>
        {errors.operators && <p className="text-xs text-red-500 mt-0.5">{errors.operators}</p>}
      </div>
      {/* Danh sách giá trị — chỉ với enum */}
      {draft.dataType === 'enum' && (
        <div>
          <label className="text-xs text-slate-500 mb-0.5 block">Danh sách giá trị <span className="text-red-400">*</span> <span className="text-slate-400 font-normal">(cách nhau bằng dấu phẩy)</span></label>
          <input
            value={draft.values}
            onChange={e => onChange({ ...draft, values: e.target.value })}
            placeholder="vd: eSIM, Vật lý — hoặc 12MB, 24MB — hoặc 15-18, 19-24"
            className={`w-full px-2.5 py-1.5 text-xs border rounded focus:outline-none focus:border-blue-400 ${errors.values ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
          />
          {errors.values && <p className="text-xs text-red-500 mt-0.5">{errors.values}</p>}
        </div>
      )}
      {draft.dataType !== 'enum' && (
        <p className="text-xs text-slate-500">Kiểu này QTV nhập giá trị trực tiếp khi lọc — không cần khai báo danh sách sẵn.</p>
      )}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1">Hủy</button>
        <button type="button" onClick={onSave} className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Lưu</button>
      </div>
    </div>
  )
}

// Bảng liệt kê điều kiện lọc đã khai báo — dùng chung
function FilterFieldTable({ fields, onDelete }: { fields: TriggerFilterField[]; onDelete?: (techName: string) => void }) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-slate-500">
            <th className="text-left px-3 py-2 font-medium">Thuộc tính</th>
            <th className="text-left px-3 py-2 font-medium">Kiểu</th>
            <th className="text-left px-3 py-2 font-medium">Toán tử</th>
            <th className="text-left px-3 py-2 font-medium">Giá trị / Bắt buộc</th>
            <th className="px-3 py-2 font-medium w-8"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {fields.length === 0 && (
            <tr><td colSpan={5} className="px-3 py-4 text-slate-400 text-center italic">Chưa có điều kiện lọc nào</td></tr>
          )}
          {fields.map(f => (
            <tr key={f.techName} className="hover:bg-slate-50 group align-top">
              <td className="px-3 py-2">
                <div className="font-medium text-slate-700">{f.name}</div>
                <div className="font-mono text-slate-400">{f.techName}</div>
              </td>
              <td className="px-3 py-2"><span className="text-slate-500 bg-slate-100 rounded px-1.5 py-0.5 font-mono">{DATA_TYPE_LABEL[f.dataType]}</span></td>
              <td className="px-3 py-2">
                <div className="flex flex-wrap gap-1">
                  {f.operators.map(op => (
                    <span key={op} className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5" title={op}>{opLabel(op)}</span>
                  ))}
                </div>
              </td>
              <td className="px-3 py-2 text-slate-600">
                {f.dataType === 'enum'
                  ? f.values.join(', ')
                  : f.dataType === 'boolean'
                    ? <span className="text-slate-500">Đúng / Sai</span>
                    : <span className="text-slate-400 italic">nhập tay</span>}
                {f.required && <span className="ml-1 text-amber-600 text-[10px] font-medium">· Bắt buộc</span>}
              </td>
              <td className="px-3 py-2">
                {onDelete && (
                  <button onClick={() => onDelete(f.techName)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500" title="Xóa điều kiện lọc">
                    <Trash2 size={12} />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const EMPTY_FORM = {
  code: '',
  name: '',
  type: 'Realtime' as TriggerType,
  source: 'BSS' as Trigger['source'],
}

export function TriggerAdmin() {
  const { toast } = useToast()
  const [triggers, setTriggers] = useState<Trigger[]>(mockTriggers)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [typeFilter, setTypeFilter] = useState<TriggerType[]>([])

  // Modal xem + quản lý params
  const [editTarget, setEditTarget] = useState<Trigger | null>(null)
  const [copiedParam, setCopiedParam] = useState<string | null>(null)

  // Form thêm param
  const [addParamOpen, setAddParamOpen] = useState(false)
  const [newParamName, setNewParamName] = useState('')
  const [newParamDesc, setNewParamDesc] = useState('')
  const [paramErrors, setParamErrors] = useState<{ name?: string; desc?: string }>({})

  // Form thêm điều kiện lọc phân khúc (trigger đang xem)
  const [addFilterFieldOpen, setAddFilterFieldOpen] = useState(false)
  const [ffDraft, setFfDraft] = useState<FilterFieldDraft>(emptyFfDraft())
  const [filterFieldErrors, setFilterFieldErrors] = useState<FfErrors>({})
  // Xác nhận trước khi xóa điều kiện lọc của trigger đang tồn tại — cảnh báo campaign bị ảnh hưởng
  const [confirmDeleteFf, setConfirmDeleteFf] = useState<TriggerFilterField | null>(null)

  // Modal tạo trigger mới
  const [createOpen, setCreateOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState<{ code?: string; name?: string }>({})
  const [createParams, setCreateParams] = useState<TriggerParam[]>([])
  const [createParamName, setCreateParamName] = useState('')
  const [createParamDesc, setCreateParamDesc] = useState('')
  const [createParamErrors, setCreateParamErrors] = useState<{ name?: string; desc?: string }>({})
  const [createParamFormOpen, setCreateParamFormOpen] = useState(false)

  // Điều kiện lọc phân khúc trong modal tạo trigger mới
  const [createFilterFields, setCreateFilterFields] = useState<TriggerFilterField[]>([])
  const [createFfDraft, setCreateFfDraft] = useState<FilterFieldDraft>(emptyFfDraft())
  const [createFilterFieldErrors, setCreateFilterFieldErrors] = useState<FfErrors>({})
  const [createFilterFieldFormOpen, setCreateFilterFieldFormOpen] = useState(false)

  const filtered = triggers.filter(t => {
    const matchSearch =
      !search ||
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'Tất cả' || t.status === statusFilter
    const matchType = typeFilter.length === 0 || typeFilter.includes(t.type)
    return matchSearch && matchStatus && matchType
  })

  const toggleTypeFilter = (type: TriggerType) => {
    setTypeFilter(prev =>
      prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type]
    )
  }

  const handleCopyParam = (paramName: string) => {
    navigator.clipboard.writeText(`{{${paramName}}}`).catch(() => {})
    setCopiedParam(paramName)
    setTimeout(() => setCopiedParam(null), 1800)
  }

  // Tạo trigger mới
  const validateForm = () => {
    const errors: { code?: string; name?: string } = {}
    if (!form.code.trim()) errors.code = 'Bắt buộc'
    else if (!/^[A-Z0-9_]+$/.test(form.code.trim())) errors.code = 'Chỉ dùng chữ hoa, số, dấu gạch dưới'
    else if (triggers.some(t => t.code === form.code.trim())) errors.code = 'Code đã tồn tại'
    if (!form.name.trim()) errors.name = 'Bắt buộc'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateCreateParam = () => {
    const errors: { name?: string; desc?: string } = {}
    if (!createParamName.trim()) errors.name = 'Bắt buộc'
    else if (!/^[a-z0-9_]+$/.test(createParamName.trim())) errors.name = 'Chỉ dùng chữ thường, số, dấu gạch dưới'
    else if (createParams.some(p => p.name === createParamName.trim())) errors.name = 'Tham số đã tồn tại'
    if (!createParamDesc.trim()) errors.desc = 'Bắt buộc'
    setCreateParamErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddCreateParam = () => {
    if (!validateCreateParam()) return
    setCreateParams(prev => [...prev, { name: createParamName.trim(), description: createParamDesc.trim(), format: 'text', source: form.source }])
    setCreateParamName('')
    setCreateParamDesc('')
    setCreateParamErrors({})
    setCreateParamFormOpen(false)
  }

  const handleCreate = () => {
    if (!validateForm()) return
    const newTrigger: Trigger = {
      id: String(Date.now()),
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      type: form.type,
      source: form.source,
      status: 'Active',
      params: createParams,
      filterFields: createFilterFields,
    }
    setTriggers(prev => [...prev, newTrigger])
    toast('Đã thêm trigger ✓', 'success')
    setCreateOpen(false)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setCreateParams([])
    setCreateParamName('')
    setCreateParamDesc('')
    setCreateParamFormOpen(false)
    setCreateFilterFields([])
    setCreateFfDraft(emptyFfDraft())
    setCreateFilterFieldFormOpen(false)
  }

  // Điều kiện lọc phân khúc — modal tạo trigger mới
  const handleAddCreateFilterField = () => {
    const errs = validateFf(createFfDraft, createFilterFields)
    if (Object.keys(errs).length > 0) { setCreateFilterFieldErrors(errs); return }
    setCreateFilterFields(prev => [...prev, buildFf(createFfDraft, prev)])
    setCreateFfDraft(emptyFfDraft())
    setCreateFilterFieldErrors({})
    setCreateFilterFieldFormOpen(false)
  }

  // Thêm param vào trigger đang xem
  const validateParam = () => {
    const errors: { name?: string; desc?: string } = {}
    if (!newParamName.trim()) errors.name = 'Bắt buộc'
    else if (!/^[a-z0-9_]+$/.test(newParamName.trim())) errors.name = 'Chỉ dùng chữ thường, số, dấu gạch dưới'
    else if (editTarget?.params.some(p => p.name === newParamName.trim())) errors.name = 'Tham số đã tồn tại'
    if (!newParamDesc.trim()) errors.desc = 'Bắt buộc'
    setParamErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAddParam = () => {
    if (!validateParam() || !editTarget) return
    const newParam: TriggerParam = {
      name: newParamName.trim(),
      description: newParamDesc.trim(),
      format: 'text',
      source: editTarget.source,
    }
    const updated = { ...editTarget, params: [...editTarget.params, newParam] }
    setTriggers(prev => prev.map(t => t.id === updated.id ? updated : t))
    setEditTarget(updated)
    toast('Đã thêm tham số ✓', 'success')
    setAddParamOpen(false)
    setNewParamName('')
    setNewParamDesc('')
    setParamErrors({})
  }

  const handleDeleteParam = (paramName: string) => {
    if (!editTarget) return
    const updated = { ...editTarget, params: editTarget.params.filter(p => p.name !== paramName) }
    setTriggers(prev => prev.map(t => t.id === updated.id ? updated : t))
    setEditTarget(updated)
    toast('Đã xóa tham số', 'warning')
  }

  // Điều kiện lọc phân khúc vào trigger đang xem
  const handleAddFilterField = () => {
    if (!editTarget) return
    const errs = validateFf(ffDraft, editTarget.filterFields)
    if (Object.keys(errs).length > 0) { setFilterFieldErrors(errs); return }
    const updated = { ...editTarget, filterFields: [...editTarget.filterFields, buildFf(ffDraft, editTarget.filterFields)] }
    setTriggers(prev => prev.map(t => t.id === updated.id ? updated : t))
    setEditTarget(updated)
    toast('Đã thêm điều kiện lọc ✓', 'success')
    setAddFilterFieldOpen(false)
    setFfDraft(emptyFfDraft())
    setFilterFieldErrors({})
  }

  // Click [Xóa] một điều kiện lọc → mở dialog xác nhận (cảnh báo campaign bị ảnh hưởng) thay vì xóa ngay
  const handleDeleteFilterField = (techName: string) => {
    if (!editTarget) return
    const ff = editTarget.filterFields.find(f => f.techName === techName)
    if (ff) setConfirmDeleteFf(ff)
  }

  // Người dùng xác nhận trong dialog → thực sự xóa
  const confirmDeleteFilterField = () => {
    if (!editTarget || !confirmDeleteFf) return
    const updated = { ...editTarget, filterFields: editTarget.filterFields.filter(f => f.techName !== confirmDeleteFf.techName) }
    setTriggers(prev => prev.map(t => t.id === updated.id ? updated : t))
    setEditTarget(updated)
    toast('Đã xóa điều kiện lọc', 'warning')
    setConfirmDeleteFf(null)
  }

  return (
    <div className="space-y-4">
      {/* Search + filter + nút thêm */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm trigger code hoặc tên..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400"
            />
          </div>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded px-2 py-2 focus:outline-none"
          >
            {['Tất cả', 'Active', 'Inactive'].map(s => <option key={s}>{s}</option>)}
          </select>
          <Button onClick={() => { setForm(EMPTY_FORM); setFormErrors({}); setCreateOpen(true) }}>
            <Plus size={14} /> Thêm trigger
          </Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-400">Kiểu chạy:</span>
          {TYPE_OPTIONS.map(type => (
            <button
              key={type}
              onClick={() => toggleTypeFilter(type)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                typeFilter.includes(type)
                  ? 'bg-blue-50 border-blue-300 text-blue-700 font-medium'
                  : 'border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {type}
            </button>
          ))}
          {typeFilter.length > 0 && (
            <button
              onClick={() => setTypeFilter([])}
              className="text-xs text-blue-600 hover:underline ml-1"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Bảng trigger */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-100">
            <tr className="text-xs text-slate-500">
              <th className="text-left px-4 py-2 font-medium">Code</th>
              <th className="text-left px-4 py-2 font-medium">Tên</th>
              <th className="text-left px-4 py-2 font-medium">Kiểu chạy</th>
              <th className="text-left px-4 py-2 font-medium">Nguồn sự kiện</th>
              <th className="text-left px-4 py-2 font-medium">Trạng thái</th>
              <th className="text-right px-4 py-2 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(t => (
              <tr key={t.id} className={`hover:bg-slate-50 ${t.status === 'Inactive' ? 'opacity-60' : ''}`}>
                <td className="px-4 py-2.5">
                  <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${search && t.code.toLowerCase().includes(search.toLowerCase()) ? 'bg-yellow-100 text-yellow-800' : 'bg-amber-50 text-amber-700'}`}>
                    {t.code}
                  </span>
                </td>
                <td className={`px-4 py-2.5 text-slate-700 ${search && t.name.toLowerCase().includes(search.toLowerCase()) ? 'bg-yellow-50' : ''}`}>
                  {t.name}
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[t.type]}`}>
                    {t.type}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{t.source}</td>
                <td className="px-4 py-2.5">
                  {t.status === 'Active'
                    ? <span className="text-xs font-medium text-green-600">● Active</span>
                    : <span className="text-xs font-medium text-slate-400">○ Không còn sử dụng</span>}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => setEditTarget(t)}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    Xem / Sửa
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-sm text-slate-400 text-center">Không tìm thấy trigger nào</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Modal xem + quản lý params ── */}
      <Dialog
        open={!!editTarget}
        onClose={() => { setEditTarget(null); setAddParamOpen(false) }}
        title="Chi tiết Sự kiện kích hoạt"
        className="max-w-2xl"
      >
        {editTarget && (
          <div className="space-y-5 text-sm">

            {/* A — Định danh */}
            <section>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">A. Định danh</h3>
              <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                  <div>
                    <span className="text-xs text-slate-400">Code</span>
                    <div className="font-mono text-sm font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-0.5 inline-block">
                      {editTarget.code}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Kiểu chạy</span>
                    <div className="mt-0.5">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_BADGE[editTarget.type]}`}>
                        {editTarget.type}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Nguồn sự kiện</span>
                    <div className="text-sm font-medium text-slate-700 mt-0.5">{editTarget.source}</div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400">Trạng thái</span>
                    <div className="mt-0.5">
                      {editTarget.status === 'Active'
                        ? <span className="text-xs font-medium text-green-600">● Active</span>
                        : <span className="text-xs font-medium text-slate-400">○ Không còn sử dụng</span>}
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Tên</span>
                  <div className="text-sm font-medium text-slate-800 mt-0.5">{editTarget.name}</div>
                </div>
              </div>
            </section>

            {/* B — Tham số đầu ra */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">B. Tham số đầu ra</h3>
                <button
                  onClick={() => { setAddParamOpen(true); setNewParamName(''); setNewParamDesc(''); setParamErrors({}) }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Plus size={12} /> Thêm tham số
                </button>
              </div>

              {/* Inline form thêm param */}
              {addParamOpen && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-slate-500 mb-0.5 block">Tên tham số <span className="text-red-400">*</span></label>
                      <input
                        value={newParamName}
                        onChange={e => setNewParamName(e.target.value)}
                        placeholder="vd: ten_kh"
                        className={`w-full px-2.5 py-1.5 text-xs font-mono border rounded focus:outline-none focus:border-blue-400 ${paramErrors.name ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
                      />
                      {paramErrors.name && <p className="text-xs text-red-500 mt-0.5">{paramErrors.name}</p>}
                    </div>
                    <div className="flex-[2]">
                      <label className="text-xs text-slate-500 mb-0.5 block">Mô tả <span className="text-red-400">*</span></label>
                      <input
                        value={newParamDesc}
                        onChange={e => setNewParamDesc(e.target.value)}
                        placeholder="vd: Họ tên đầy đủ của khách hàng"
                        className={`w-full px-2.5 py-1.5 text-xs border rounded focus:outline-none focus:border-blue-400 ${paramErrors.desc ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
                      />
                      {paramErrors.desc && <p className="text-xs text-red-500 mt-0.5">{paramErrors.desc}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setAddParamOpen(false)} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1">Hủy</button>
                    <button onClick={handleAddParam} className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Lưu</button>
                  </div>
                </div>
              )}

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-slate-500">
                      <th className="text-left px-3 py-2 font-medium">Tham số</th>
                      <th className="text-left px-3 py-2 font-medium">Mô tả</th>
                      <th className="px-3 py-2 font-medium w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editTarget.params.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-3 py-4 text-slate-400 text-center italic">Chưa có tham số nào</td>
                      </tr>
                    )}
                    {editTarget.params.map(p => (
                      <tr key={p.name} className="hover:bg-slate-50 group">
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleCopyParam(p.name)}
                            className="flex items-center gap-1 font-mono text-blue-600 hover:text-blue-800"
                            title="Nhấn để copy cú pháp"
                          >
                            <span>{`{{${p.name}}}`}</span>
                            {copiedParam === p.name
                              ? <CheckCircle size={10} className="text-green-500" />
                              : <Copy size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-slate-600">{p.description}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleDeleteParam(p.name)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                            title="Xóa tham số"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                <Copy size={10} /> Nhấn vào tên tham số để copy cú pháp vào clipboard
              </p>
            </section>

            {/* C — Điều kiện lọc phân khúc */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">C. Điều kiện lọc phân khúc</h3>
                <button
                  onClick={() => { setAddFilterFieldOpen(true); setFfDraft(emptyFfDraft()); setFilterFieldErrors({}) }}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  <Plus size={12} /> Thêm điều kiện lọc
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-2">Thuộc tính dùng để lọc phân khúc khách hàng khi tạo campaign — không dùng để chèn vào nội dung tin nhắn. Toán tử hỗ trợ khai báo riêng cho từng thuộc tính.</p>

              {addFilterFieldOpen && (
                <FilterFieldForm
                  draft={ffDraft}
                  errors={filterFieldErrors}
                  onChange={setFfDraft}
                  onSave={handleAddFilterField}
                  onCancel={() => setAddFilterFieldOpen(false)}
                />
              )}

              <FilterFieldTable fields={editTarget.filterFields} onDelete={handleDeleteFilterField} />
            </section>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100 mt-4">
          <button
            onClick={() => { setEditTarget(null); setAddParamOpen(false) }}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-3 py-1.5"
          >
            <X size={13} /> Đóng
          </button>
        </div>
      </Dialog>

      {/* ── Dialog xác nhận xóa điều kiện lọc — cảnh báo campaign bị ảnh hưởng ── */}
      <Dialog
        open={!!confirmDeleteFf}
        onClose={() => setConfirmDeleteFf(null)}
        title="Xóa điều kiện lọc?"
      >
        {confirmDeleteFf && editTarget && (() => {
          const affected = campaignsUsingTrigger(mockCampaigns, editTarget.code)
          return (
            <div className="text-sm text-slate-600 space-y-3">
              <p>
                Bạn đang xóa điều kiện lọc <span className="font-medium text-slate-800">{confirmDeleteFf.name}</span> khỏi trigger{' '}
                <span className="font-mono text-amber-700">{editTarget.code}</span>.
              </p>
              {affected.length > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                  <p className="text-amber-800">
                    <span className="font-medium">{affected.length} chiến dịch</span> đang dùng trigger này sẽ bị đánh dấu cần rà soát lại điều kiện lọc:
                  </p>
                  <ul className="space-y-1">
                    {affected.map(c => (
                      <li key={c.id} className="flex items-center gap-1.5 text-xs text-slate-700">
                        <span className="w-1 h-1 rounded-full bg-amber-500" />
                        <span className="font-medium">{c.name}</span>
                        <span className="font-mono text-slate-400">{c.code}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-amber-700">
                    Chiến dịch đang chạy sẽ tự chuyển <span className="font-medium">Tạm dừng</span> và phải cập nhật điều kiện lọc trước khi bật lại.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Chưa có chiến dịch nào dùng trigger này — xóa không ảnh hưởng chiến dịch đang chạy.</p>
              )}
            </div>
          )
        })()}
        <DialogActions>
          <button
            onClick={() => setConfirmDeleteFf(null)}
            className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-3 py-1.5"
          >
            Hủy
          </button>
          <Button variant="danger" onClick={confirmDeleteFilterField}>Xác nhận xóa</Button>
        </DialogActions>
      </Dialog>

      {/* ── Modal tạo trigger mới ── */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Thêm Trigger mới"
        className="max-w-lg"
      >
        <div className="space-y-4 text-sm">
          {/* Code */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Trigger Code <span className="text-red-400">*</span>
              <span className="ml-1 text-slate-400 font-normal">(chữ hoa, số, dấu gạch dưới)</span>
            </label>
            <input
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="vd: SIM_ACTIVATED"
              className={`w-full px-3 py-2 text-sm font-mono border rounded focus:outline-none focus:border-blue-400 ${formErrors.code ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {formErrors.code && <p className="text-xs text-red-500 mt-0.5">{formErrors.code}</p>}
          </div>

          {/* Tên */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Tên <span className="text-red-400">*</span></label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="vd: Kích hoạt SIM thành công"
              className={`w-full px-3 py-2 text-sm border rounded focus:outline-none focus:border-blue-400 ${formErrors.name ? 'border-red-400 bg-red-50' : 'border-slate-200'}`}
            />
            {formErrors.name && <p className="text-xs text-red-500 mt-0.5">{formErrors.name}</p>}
          </div>

          {/* Kiểu chạy + Nguồn */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Kiểu chạy</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value as TriggerType }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400"
              >
                {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-slate-600 mb-1">Nguồn sự kiện</label>
              <select
                value={form.source}
                onChange={e => setForm(f => ({ ...f, source: e.target.value as Trigger['source'] }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400"
              >
                {SOURCE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Tham số đầu ra */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-600">Tham số đầu ra</label>
              <button
                type="button"
                onClick={() => { setCreateParamFormOpen(true); setCreateParamName(''); setCreateParamDesc(''); setCreateParamErrors({}) }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                <Plus size={12} /> Thêm tham số
              </button>
            </div>

            {createParamFormOpen && (
              <div className="mb-2 p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-xs text-slate-500 mb-0.5 block">Tên tham số <span className="text-red-400">*</span></label>
                    <input
                      value={createParamName}
                      onChange={e => setCreateParamName(e.target.value)}
                      placeholder="vd: ten_kh"
                      className={`w-full px-2.5 py-1.5 text-xs font-mono border rounded focus:outline-none focus:border-blue-400 ${createParamErrors.name ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
                    />
                    {createParamErrors.name && <p className="text-xs text-red-500 mt-0.5">{createParamErrors.name}</p>}
                  </div>
                  <div className="flex-[2]">
                    <label className="text-xs text-slate-500 mb-0.5 block">Mô tả <span className="text-red-400">*</span></label>
                    <input
                      value={createParamDesc}
                      onChange={e => setCreateParamDesc(e.target.value)}
                      placeholder="vd: Họ tên đầy đủ của khách hàng"
                      className={`w-full px-2.5 py-1.5 text-xs border rounded focus:outline-none focus:border-blue-400 ${createParamErrors.desc ? 'border-red-400 bg-red-50' : 'border-slate-200 bg-white'}`}
                    />
                    {createParamErrors.desc && <p className="text-xs text-red-500 mt-0.5">{createParamErrors.desc}</p>}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setCreateParamFormOpen(false)} className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1">Hủy</button>
                  <button type="button" onClick={handleAddCreateParam} className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">Lưu</button>
                </div>
              </div>
            )}

            {createParams.length > 0 ? (
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr className="text-slate-500">
                      <th className="text-left px-3 py-2 font-medium">Tham số</th>
                      <th className="text-left px-3 py-2 font-medium">Mô tả</th>
                      <th className="px-3 py-2 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {createParams.map(p => (
                      <tr key={p.name} className="hover:bg-slate-50 group">
                        <td className="px-3 py-2 font-mono text-blue-600">{`{{${p.name}}}`}</td>
                        <td className="px-3 py-2 text-slate-600">{p.description}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => setCreateParams(prev => prev.filter(x => x.name !== p.name))}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-red-500"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Chưa có tham số — có thể thêm sau khi tạo</p>
            )}
          </div>

          {/* Điều kiện lọc phân khúc */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-600">Điều kiện lọc phân khúc</label>
              <button
                type="button"
                onClick={() => { setCreateFilterFieldFormOpen(true); setCreateFfDraft(emptyFfDraft()); setCreateFilterFieldErrors({}) }}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                <Plus size={12} /> Thêm điều kiện lọc
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-1.5">Thuộc tính dùng để lọc phân khúc khách hàng khi tạo campaign — không dùng để chèn vào nội dung tin nhắn. Toán tử hỗ trợ khai báo riêng cho từng thuộc tính.</p>

            {createFilterFieldFormOpen && (
              <FilterFieldForm
                draft={createFfDraft}
                errors={createFilterFieldErrors}
                onChange={setCreateFfDraft}
                onSave={handleAddCreateFilterField}
                onCancel={() => setCreateFilterFieldFormOpen(false)}
              />
            )}

            {createFilterFields.length > 0 ? (
              <FilterFieldTable
                fields={createFilterFields}
                onDelete={techName => setCreateFilterFields(prev => prev.filter(x => x.techName !== techName))}
              />
            ) : (
              <p className="text-xs text-slate-400 italic">Chưa có điều kiện lọc — có thể thêm sau khi tạo</p>
            )}
          </div>

        </div>

        <DialogActions>
          <button
            onClick={() => setCreateOpen(false)}
            className="text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded px-3 py-1.5"
          >
            Hủy
          </button>
          <Button onClick={handleCreate}>Lưu trigger</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

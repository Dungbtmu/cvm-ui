import { useState } from 'react'
import { Plus, Upload, Search, Trash2, Globe } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { useRole } from '../lib/roleContext'
import { mockBlacklist, mockCampaigns } from '../data/mock'
import type { BlacklistEntry, BlacklistScope, ChannelType } from '../types'

const CHANNELS: ChannelType[] = ['Push', 'Zalo OA', 'SMS', 'Banner', 'Email', 'USSD']
const PAGE_SIZE_OPTIONS = [20, 50, 100] as const

// Multi-select checkbox list dùng chung cho Campaign/Kênh trong các modal Blacklist — tái dùng pattern
// checkbox đã có ở CampaignBuilder.tsx (danh sách checkbox có scroll) thay vì thêm thư viện multi-select mới.
function CheckboxMultiSelect<T extends string>({ options, selected, onToggle, renderLabel }: {
  options: T[]
  selected: T[]
  onToggle: (v: T) => void
  renderLabel?: (v: T) => string
}) {
  return (
    <div className="border border-slate-200 rounded max-h-36 overflow-y-auto divide-y divide-slate-50">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-slate-50 cursor-pointer">
          <input type="checkbox" className="accent-blue-500"
            checked={selected.includes(opt)}
            onChange={() => onToggle(opt)} />
          <span className="text-slate-700">{renderLabel ? renderLabel(opt) : opt}</span>
        </label>
      ))}
      {options.length === 0 && <div className="px-2 py-3 text-xs text-slate-400 text-center">Không có lựa chọn nào</div>}
    </div>
  )
}

function toggleInArray<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v]
}

export function BlacklistManagement() {
  const { toast } = useToast()
  const { isAdmin } = useRole()
  const [list, setList] = useState<BlacklistEntry[]>(mockBlacklist)
  const [addOpen, setAddOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [globalOpen, setGlobalOpen] = useState(false)
  const [globalTab, setGlobalTab] = useState<'manual' | 'upload'>('manual')
  const [deleteTarget, setDeleteTarget] = useState<BlacklistEntry | null>(null)
  const [search, setSearch] = useState('')
  const [filterScope, setFilterScope] = useState<'' | BlacklistScope>('')
  const [filterCampaign, setFilterCampaign] = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Add form (theo Campaign) — multi-select Campaign + Kênh (URD Screen 6B STT 2, 3)
  const [addPhone, setAddPhone] = useState('')
  const [addPhoneErr, setAddPhoneErr] = useState('')
  const [addCampaigns, setAddCampaigns] = useState<string[]>([])
  const [addChannels, setAddChannels] = useState<ChannelType[]>(['Push'])
  const [addModalErr, setAddModalErr] = useState('')

  // Upload form (theo Campaign) — multi-select Campaign + Kênh (URD Screen 6C STT 1, 2)
  const [upCampaigns, setUpCampaigns] = useState<string[]>([])
  const [upChannels, setUpChannels] = useState<ChannelType[]>(['Push'])
  const [upParsed, setUpParsed] = useState<{ valid: number; duplicate: number; invalid: number } | null>(null)

  // Blacklist toàn hệ thống — Thêm thủ công (không có Campaign/Kênh — UC-BL-04)
  const [gManualPhone, setGManualPhone] = useState('')
  const [gManualPhoneErr, setGManualPhoneErr] = useState('')
  const [gManualModalErr, setGManualModalErr] = useState('')
  // Blacklist toàn hệ thống — Upload CSV (không có Campaign/Kênh — UC-BL-05)
  const [gUpParsed, setGUpParsed] = useState<{ valid: number; duplicate: number; invalid: number } | null>(null)

  const filtered = list.filter(e => {
    const scope: BlacklistScope = e.scope ?? 'campaign'
    const matchSearch = !search || e.phone.includes(search) || e.campaign.toLowerCase().includes(search.toLowerCase())
    const matchScope = !filterScope || scope === filterScope
    const matchCampaign = !filterCampaign || e.campaign === filterCampaign
    const matchChannel = !filterChannel || e.channel === filterChannel
    const matchSource = !filterSource || e.source === filterSource
    return matchSearch && matchScope && matchCampaign && matchChannel && matchSource
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const changePage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)))
  const changePageSize = (size: number) => { setPageSize(size); setPage(1) }
  const handleSearch = (val: string) => { setSearch(val); setPage(1) }

  const validatePhone = (phone: string) => {
    if (!phone) return 'Số điện thoại không được để trống'
    if (!/^0\d{9}$/.test(phone.replace(/\s/g, ''))) return 'Số điện thoại không hợp lệ — phải có 10 chữ số bắt đầu bằng 0'
    return ''
  }

  // Thêm thủ công (theo Campaign) — mỗi số hợp lệ tạo N (Campaign) × M (Kênh) bản ghi, bỏ qua tổ hợp
  // đã tồn tại; parse nhiều số cách nhau bởi dấu phẩy/xuống dòng (URD Screen 6B STT 1, 4, 6).
  const handleAdd = () => {
    setAddModalErr('')
    const phones = addPhone.split(/[,\n]/).map(p => p.trim()).filter(Boolean)
    const validPhones = phones.filter(p => !validatePhone(p))
    if (validPhones.length === 0) { setAddPhoneErr('Số điện thoại không được để trống'); return }
    if (addCampaigns.length === 0) return
    if (addChannels.length === 0) return

    const toAdd: BlacklistEntry[] = []
    for (const phone of validPhones) {
      for (const campaign of addCampaigns) {
        for (const channel of addChannels) {
          const isDuplicate = list.some(x => x.phone === phone && x.campaign === campaign && x.channel === channel && (x.scope ?? 'campaign') === 'campaign')
            || toAdd.some(x => x.phone === phone && x.campaign === campaign && x.channel === channel)
          if (!isDuplicate) toAdd.push({ phone, campaign, channel, source: 'manual', scope: 'campaign' })
        }
      }
    }

    if (toAdd.length === 0) {
      setAddModalErr('Toàn bộ tổ hợp đã nhập đều đã có trong blacklist — không có bản ghi nào được thêm')
      return
    }
    setList(prev => [...toAdd, ...prev])
    toast(`Đã thêm ${toAdd.length} bản ghi vào blacklist ✓`, 'success')
    setAddOpen(false)
    setAddPhone(''); setAddCampaigns([]); setAddChannels(['Push']); setAddPhoneErr(''); setAddModalErr('')
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    setList(prev => prev.filter(x => x !== deleteTarget))
    toast('Đã xóa ✓', 'success')
    setDeleteTarget(null)
  }

  const handleFileSimulate = () => {
    setUpParsed({ valid: 245, duplicate: 8, invalid: 3 })
  }

  // Upload CSV (theo Campaign) — N × M bản ghi tương tự Thêm thủ công (URD Screen 6C STT 9).
  const handleUploadConfirm = () => {
    const total = (upParsed?.valid ?? 0) * Math.max(1, upCampaigns.length) * Math.max(1, upChannels.length)
    toast(`Đã tải lên ${total} số vào blacklist ✓`, 'success')
    setUploadOpen(false)
    setUpParsed(null)
    setUpCampaigns([]); setUpChannels(['Push'])
  }

  // Blacklist toàn hệ thống — Thêm thủ công (UC-BL-04, không có Campaign/Kênh)
  const handleGlobalManualAdd = () => {
    setGManualModalErr('')
    const phones = gManualPhone.split(/[,\n]/).map(p => p.trim()).filter(Boolean)
    const validPhones = phones.filter(p => !validatePhone(p))
    if (validPhones.length === 0) { setGManualPhoneErr('Số điện thoại không được để trống'); return }

    const toAdd: BlacklistEntry[] = []
    for (const phone of validPhones) {
      const isDuplicate = list.some(x => x.phone === phone && (x.scope ?? 'campaign') === 'global')
        || toAdd.some(x => x.phone === phone)
      if (!isDuplicate) toAdd.push({ phone, campaign: 'Toàn hệ thống', channel: 'Push', source: 'manual', scope: 'global' })
    }

    if (toAdd.length === 0) {
      setGManualModalErr('Toàn bộ số đã nhập đều đã có trong Blacklist toàn hệ thống — không có số nào được thêm')
      return
    }
    setList(prev => [...toAdd, ...prev])
    toast(`Đã thêm ${toAdd.length} số vào Blacklist toàn hệ thống ✓`, 'success')
    setGlobalOpen(false)
    setGManualPhone(''); setGManualPhoneErr(''); setGManualModalErr('')
  }

  // Blacklist toàn hệ thống — Upload CSV (UC-BL-05)
  const handleGlobalFileSimulate = () => {
    setGUpParsed({ valid: 180, duplicate: 5, invalid: 2 })
  }

  const handleGlobalUploadConfirm = () => {
    toast(`Đã upload ${gUpParsed?.valid ?? 0} số vào Blacklist toàn hệ thống ✓`, 'success')
    setGlobalOpen(false)
    setGUpParsed(null)
  }

  const closeGlobalModal = () => {
    setGlobalOpen(false)
    setGManualPhone(''); setGManualPhoneErr(''); setGManualModalErr('')
    setGUpParsed(null)
    setGlobalTab('manual')
  }

  const sourceLabel = (e: BlacklistEntry) => {
    if ((e.scope ?? 'campaign') === 'global') {
      return e.source === 'upload' ? 'Upload tệp (Toàn hệ thống)' : 'Thêm thủ công (Toàn hệ thống)'
    }
    return ({
      campaign: 'Chọn trong campaign',
      upload: 'Upload tệp',
      manual: 'Thêm thủ công',
    } as Record<string, string>)[e.source] ?? e.source
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">Blacklist</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setUploadOpen(true)}>
            <Upload size={14} /> Upload danh sách
          </Button>
          <Button variant="primary" onClick={() => setAddOpen(true)}>
            <Plus size={14} /> Thêm thủ công
          </Button>
          {isAdmin && (
            <Button variant="outline" onClick={() => setGlobalOpen(true)} className="border-purple-300 text-purple-700 hover:bg-purple-50">
              <Globe size={14} /> Thêm vào Blacklist toàn hệ thống
            </Button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Tìm số điện thoại hoặc campaign..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400" />
        </div>
        <select value={filterScope} onChange={e => { setFilterScope(e.target.value as '' | BlacklistScope); setPage(1) }}
          className="text-sm border border-slate-200 rounded px-2 py-2 focus:outline-none">
          <option value="">Phạm vi: Tất cả</option>
          <option value="campaign">Theo Campaign</option>
          <option value="global">Toàn hệ thống</option>
        </select>
        <select value={filterCampaign} disabled={filterScope === 'global'}
          onChange={e => { setFilterCampaign(e.target.value); setPage(1) }}
          className="text-sm border border-slate-200 rounded px-2 py-2 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400">
          <option value="">Campaign: Tất cả</option>
          {[...new Set(list.filter(e => (e.scope ?? 'campaign') === 'campaign').map(e => e.campaign))].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterChannel} onChange={e => { setFilterChannel(e.target.value); setPage(1) }}
          className="text-sm border border-slate-200 rounded px-2 py-2 focus:outline-none">
          <option value="">Kênh: Tất cả</option>
          {CHANNELS.map(ch => <option key={ch} value={ch}>{ch}</option>)}
        </select>
        <select value={filterSource} onChange={e => { setFilterSource(e.target.value); setPage(1) }}
          className="text-sm border border-slate-200 rounded px-2 py-2 focus:outline-none">
          <option value="">Nguồn: Tất cả</option>
          <option value="manual">Thêm thủ công</option>
          <option value="upload">Upload tệp</option>
          <option value="campaign">Từ campaign</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs text-slate-500">
              <th className="text-left px-4 py-3 font-medium">Số điện thoại</th>
              <th className="text-left px-4 py-3 font-medium">Campaign</th>
              <th className="text-left px-4 py-3 font-medium">Kênh</th>
              <th className="text-left px-4 py-3 font-medium">Nguồn</th>
              <th className="text-right px-4 py-3 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map((e, i) => {
              const isGlobal = (e.scope ?? 'campaign') === 'global'
              return (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-sm">{e.phone}</td>
                  <td className="px-4 py-2.5 text-slate-700">
                    {isGlobal
                      ? <span className="font-semibold text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5 text-xs">Toàn hệ thống</span>
                      : e.campaign}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="bg-slate-100 text-slate-600 rounded px-2 py-0.5 text-xs">{isGlobal ? 'Tất cả kênh' : e.channel}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{sourceLabel(e)}</td>
                  <td className="px-4 py-2.5 text-right">
                    {isGlobal && !isAdmin ? (
                      <span className="text-xs text-slate-400">Chỉ đọc</span>
                    ) : (
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(e)}>
                        <Trash2 size={12} /> Xóa
                      </Button>
                    )}
                  </td>
                </tr>
              )
            })}
            {paged.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm">Danh sách blacklist đang trống</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{filtered.length} bản ghi</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <button onClick={() => changePage(1)} disabled={currentPage === 1} className="px-1.5 py-1 rounded hover:bg-slate-100 disabled:opacity-30">«</button>
              <button onClick={() => changePage(currentPage - 1)} disabled={currentPage === 1} className="px-1.5 py-1 rounded hover:bg-slate-100 disabled:opacity-30">‹</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...'
                    ? <span key={`e${i}`} className="px-1">…</span>
                    : <button key={p} onClick={() => changePage(p)} className={`px-2 py-1 rounded ${currentPage === p ? 'bg-blue-500 text-white' : 'hover:bg-slate-100'}`}>{p}</button>
                )}
              <button onClick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} className="px-1.5 py-1 rounded hover:bg-slate-100 disabled:opacity-30">›</button>
              <button onClick={() => changePage(totalPages)} disabled={currentPage === totalPages} className="px-1.5 py-1 rounded hover:bg-slate-100 disabled:opacity-30">»</button>
            </div>
            <select value={pageSize} onChange={e => changePageSize(Number(e.target.value))}
              className="border border-slate-200 rounded px-1.5 py-1 text-xs focus:outline-none">
              {PAGE_SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}/trang</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onClose={() => { setAddOpen(false); setAddPhoneErr(''); setAddModalErr('') }} title="Thêm vào Blacklist" className="max-w-md">
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Số điện thoại *</label>
            <textarea value={addPhone} rows={2}
              onChange={e => { setAddPhone(e.target.value); setAddPhoneErr(''); setAddModalErr('') }}
              placeholder="0987xxxxxx, 0912xxxxxx hoặc mỗi số 1 dòng"
              className={`w-full px-2 py-1.5 border rounded focus:outline-none focus:border-blue-400 resize-none ${addPhoneErr ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} />
            {addPhoneErr && <div className="text-xs text-red-500 mt-1">{addPhoneErr}</div>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Campaign * <span className="font-normal text-slate-400">(chọn nhiều)</span></label>
            <CheckboxMultiSelect
              options={mockCampaigns.map(c => c.name)}
              selected={addCampaigns}
              onToggle={v => setAddCampaigns(prev => toggleInArray(prev, v))} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Kênh * <span className="font-normal text-slate-400">(chọn nhiều)</span></label>
            <CheckboxMultiSelect options={CHANNELS} selected={addChannels}
              onToggle={v => setAddChannels(prev => toggleInArray(prev, v))} />
          </div>
          {addModalErr && <div className="text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">{addModalErr}</div>}
        </div>
        <DialogActions>
          <Button variant="outline" onClick={() => { setAddOpen(false); setAddPhoneErr(''); setAddModalErr('') }}>Hủy</Button>
          <Button variant="primary" onClick={handleAdd} disabled={!addPhone.trim()}>Thêm</Button>
        </DialogActions>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onClose={() => { setUploadOpen(false); setUpParsed(null) }} title="Upload Blacklist" className="max-w-lg">
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Campaign * <span className="font-normal text-slate-400">(chọn nhiều)</span></label>
            <CheckboxMultiSelect
              options={mockCampaigns.map(c => c.name)}
              selected={upCampaigns}
              onToggle={v => setUpCampaigns(prev => toggleInArray(prev, v))}
              renderLabel={name => {
                const c = mockCampaigns.find(x => x.name === name)
                return c ? `${c.name} (${c.code})` : name
              }} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Kênh * <span className="font-normal text-slate-400">(chọn nhiều)</span></label>
            <CheckboxMultiSelect options={CHANNELS} selected={upChannels}
              onToggle={v => setUpChannels(prev => toggleInArray(prev, v))} />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">File CSV *</label>
            {!upParsed ? (
              <div className="space-y-2">
                <div
                  onClick={handleFileSimulate}
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
              <div className="space-y-2">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                  <div className="text-green-700 font-medium">Hợp lệ: {upParsed.valid}</div>
                  <div className="text-orange-500">Trùng: {upParsed.duplicate}</div>
                  <div className="text-red-500">Sai định dạng: {upParsed.invalid}</div>
                  <div className="text-slate-400 pt-0.5">⚠ Sai định dạng: không phải 10 chữ số / không bắt đầu bằng 0</div>
                  <button onClick={() => setUpParsed(null)} className="text-slate-400 hover:text-slate-600 mt-1 block">
                    📄 blacklist_upload.csv · <span className="text-red-400 hover:text-red-600">Thay file</span>
                  </button>
                </div>
                <button className="text-blue-500 hover:text-blue-700 text-xs flex items-center gap-1">
                  📥 Tải file mẫu (blacklist_mau.csv)
                </button>
              </div>
            )}
          </div>
        </div>
        <DialogActions>
          <Button variant="outline" onClick={() => { setUploadOpen(false); setUpParsed(null) }}>Hủy</Button>
          <Button variant="primary" onClick={handleUploadConfirm} disabled={!upParsed || upCampaigns.length === 0 || upChannels.length === 0}>
            Xác nhận Tải lên
          </Button>
        </DialogActions>
      </Dialog>

      {/* Blacklist toàn hệ thống — modal 2 tab con (UC-BL-04 / UC-BL-05) */}
      <Dialog open={globalOpen} onClose={closeGlobalModal} title="Thêm vào Blacklist toàn hệ thống" className="max-w-lg">
        <div className="space-y-3 text-sm">
          <div className="flex gap-1 bg-slate-100 rounded-md p-1 w-fit">
            {(['manual', 'upload'] as const).map(t => (
              <button key={t} onClick={() => setGlobalTab(t)}
                className={`px-3 py-1 text-xs rounded transition-colors ${globalTab === t ? 'bg-white text-slate-800 font-medium shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {t === 'manual' ? 'Thêm thủ công' : 'Upload CSV'}
              </button>
            ))}
          </div>

          {globalTab === 'manual' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Số điện thoại *</label>
                <textarea value={gManualPhone} rows={3}
                  onChange={e => { setGManualPhone(e.target.value); setGManualPhoneErr(''); setGManualModalErr('') }}
                  placeholder="0987xxxxxx, 0912xxxxxx hoặc mỗi số 1 dòng"
                  className={`w-full px-2 py-1.5 border rounded focus:outline-none focus:border-blue-400 resize-none ${gManualPhoneErr ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} />
                {gManualPhoneErr && <div className="text-xs text-red-500 mt-1">{gManualPhoneErr}</div>}
              </div>
              <div className="text-xs text-purple-600 bg-purple-50 border border-purple-100 rounded px-2 py-1.5">
                Số sẽ bị chặn ở <strong>mọi</strong> campaign, <strong>mọi</strong> kênh — không cần chọn Campaign/Kênh.
              </div>
              {gManualModalErr && <div className="text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">{gManualModalErr}</div>}
            </div>
          ) : (
            <div className="space-y-2">
              {!gUpParsed ? (
                <div className="space-y-2">
                  <div
                    onClick={handleGlobalFileSimulate}
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
                    📥 Tải file mẫu (blacklist_toan_he_thong_mau.csv)
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="text-green-700 font-medium">Hợp lệ: {gUpParsed.valid}</div>
                    <div className="text-orange-500">Trùng: {gUpParsed.duplicate}</div>
                    <div className="text-red-500">Sai định dạng: {gUpParsed.invalid}</div>
                    <button onClick={() => setGUpParsed(null)} className="text-slate-400 hover:text-slate-600 mt-1 block">
                      📄 blacklist_toan_he_thong_upload.csv · <span className="text-red-400 hover:text-red-600">Thay file</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <DialogActions>
          <Button variant="outline" onClick={closeGlobalModal}>Hủy</Button>
          {globalTab === 'manual' ? (
            <Button variant="primary" onClick={handleGlobalManualAdd} disabled={!gManualPhone.trim()}>Thêm</Button>
          ) : (
            <Button variant="primary" onClick={handleGlobalUploadConfirm} disabled={!gUpParsed}>Xác nhận Upload</Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa">
        <p className="text-sm text-slate-600">
          {(deleteTarget?.scope ?? 'campaign') === 'global'
            ? <>Xóa <strong>{deleteTarget?.phone}</strong> khỏi Blacklist toàn hệ thống? Số này sẽ có thể nhận tin từ mọi campaign (trừ khi vẫn còn trong blacklist riêng của campaign nào đó).</>
            : <>Xóa <strong>{deleteTarget?.phone}</strong> khỏi blacklist campaign <strong>{deleteTarget?.campaign}</strong> kênh <strong>{deleteTarget?.channel}</strong>? Số này sẽ có thể nhận tin từ campaign này.</>}
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleDelete}>Xóa</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

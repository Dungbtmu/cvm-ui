import { useState } from 'react'
import { Plus, Upload, Search, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { mockBlacklist, mockCampaigns } from '../data/mock'
import type { BlacklistEntry, ChannelType } from '../types'

const CHANNELS: ChannelType[] = ['Push', 'Zalo OA', 'SMS', 'Banner', 'Email', 'USSD']
const PAGE_SIZE_OPTIONS = [20, 50, 100] as const

export function BlacklistManagement() {
  const { toast } = useToast()
  const [list, setList] = useState<BlacklistEntry[]>(mockBlacklist)
  const [addOpen, setAddOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<BlacklistEntry | null>(null)
  const [search, setSearch] = useState('')
  const [filterCampaign, setFilterCampaign] = useState('')
  const [filterChannel, setFilterChannel] = useState('')
  const [filterSource, setFilterSource] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  // Add form
  const [addPhone, setAddPhone] = useState('')
  const [addPhoneErr, setAddPhoneErr] = useState('')
  const [addCampaign, setAddCampaign] = useState('')
  const [addChannel, setAddChannel] = useState<ChannelType>('Push')

  // Upload form
  const [upCampaign, setUpCampaign] = useState('')
  const [upChannel, setUpChannel] = useState<ChannelType>('Push')
  const [upParsed, setUpParsed] = useState<{ valid: number; duplicate: number; invalid: number } | null>(null)

  const filtered = list.filter(e => {
    const matchSearch = !search || e.phone.includes(search) || e.campaign.toLowerCase().includes(search.toLowerCase())
    const matchCampaign = !filterCampaign || e.campaign === filterCampaign
    const matchChannel = !filterChannel || e.channel === filterChannel
    const matchSource = !filterSource || e.source === filterSource
    return matchSearch && matchCampaign && matchChannel && matchSource
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

  const handleAdd = () => {
    const phoneErr = validatePhone(addPhone)
    if (phoneErr) { setAddPhoneErr(phoneErr); return }
    if (!addCampaign) return
    const isDuplicate = list.some(x => x.phone === addPhone && x.campaign === addCampaign && x.channel === addChannel)
    if (!isDuplicate) {
      setList(prev => [...prev, { phone: addPhone, campaign: addCampaign, channel: addChannel, source: 'manual' }])
    }
    toast('Đã thêm vào blacklist ✓', 'success')
    setAddOpen(false)
    setAddPhone(''); setAddCampaign(''); setAddPhoneErr('')
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

  const handleUploadConfirm = () => {
    toast('Đã tải lên 245 số vào blacklist ✓', 'success')
    setUploadOpen(false)
    setUpParsed(null)
  }

  const sourceLabel = (s: string) => ({
    campaign: 'Chọn trong campaign',
    upload: 'Upload tệp',
    manual: 'Thêm thủ công',
  }[s] ?? s)

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
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => handleSearch(e.target.value)}
            placeholder="Tìm số điện thoại hoặc campaign..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400" />
        </div>
        <select value={filterCampaign} onChange={e => { setFilterCampaign(e.target.value); setPage(1) }}
          className="text-sm border border-slate-200 rounded px-2 py-2 focus:outline-none">
          <option value="">Campaign: Tất cả</option>
          {[...new Set(list.map(e => e.campaign))].map(c => <option key={c} value={c}>{c}</option>)}
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
            {paged.map((e, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-sm">{e.phone}</td>
                <td className="px-4 py-2.5 text-slate-700">{e.campaign}</td>
                <td className="px-4 py-2.5">
                  <span className="bg-slate-100 text-slate-600 rounded px-2 py-0.5 text-xs">{e.channel}</span>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">{sourceLabel(e.source)}</td>
                <td className="px-4 py-2.5 text-right">
                  <Button size="sm" variant="danger" onClick={() => setDeleteTarget(e)}>
                    <Trash2 size={12} /> Xóa
                  </Button>
                </td>
              </tr>
            ))}
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
      <Dialog open={addOpen} onClose={() => { setAddOpen(false); setAddPhoneErr('') }} title="Thêm vào Blacklist">
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Số điện thoại *</label>
            <input value={addPhone}
              onChange={e => { setAddPhone(e.target.value); setAddPhoneErr('') }}
              onBlur={() => setAddPhoneErr(validatePhone(addPhone))}
              placeholder="0987xxxxxx"
              className={`w-full px-2 py-1.5 border rounded focus:outline-none focus:border-blue-400 ${addPhoneErr ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} />
            {addPhoneErr && <div className="text-xs text-red-500 mt-1">{addPhoneErr}</div>}
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Campaign *</label>
            <select value={addCampaign} onChange={e => setAddCampaign(e.target.value)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400 text-sm">
              <option value="">-- Chọn campaign --</option>
              {mockCampaigns.map(c => (
                <option key={c.id} value={c.name}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Kênh *</label>
            <select value={addChannel} onChange={e => setAddChannel(e.target.value as ChannelType)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded focus:outline-none">
              {CHANNELS.map(ch => <option key={ch}>{ch}</option>)}
            </select>
          </div>
        </div>
        <DialogActions>
          <Button variant="outline" onClick={() => { setAddOpen(false); setAddPhoneErr('') }}>Hủy</Button>
          <Button variant="primary" onClick={handleAdd}>Thêm</Button>
        </DialogActions>
      </Dialog>

      {/* Upload dialog */}
      <Dialog open={uploadOpen} onClose={() => { setUploadOpen(false); setUpParsed(null) }} title="Upload Blacklist" className="max-w-lg">
        <div className="space-y-3 text-sm">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Campaign *</label>
            <input value={upCampaign} onChange={e => setUpCampaign(e.target.value)}
              placeholder="Tên hoặc mã campaign"
              className="w-full px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Kênh *</label>
            <select value={upChannel} onChange={e => setUpChannel(e.target.value as ChannelType)}
              className="w-full px-2 py-1.5 border border-slate-200 rounded focus:outline-none">
              {CHANNELS.map(ch => <option key={ch}>{ch}</option>)}
            </select>
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
          <Button variant="primary" onClick={handleUploadConfirm} disabled={!upParsed}>
            Xác nhận Tải lên
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xác nhận xóa">
        <p className="text-sm text-slate-600">
          Xóa <strong>{deleteTarget?.phone}</strong> khỏi blacklist campaign <strong>{deleteTarget?.campaign}</strong> kênh <strong>{deleteTarget?.channel}</strong>?
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant="danger" onClick={handleDelete}>Xóa</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

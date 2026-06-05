import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, X, Upload, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ParamChip } from '../components/ui/Badge'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { mockTemplates, mockCampaigns } from '../data/mock'
import type { ChannelType } from '../types'

const CHANNELS: ChannelType[] = ['Push', 'Zalo OA', 'SMS', 'Banner', 'Email', 'USSD']

const ALL_PARAMS = [
  { name: 'ten_kh', description: 'Họ tên đầy đủ', format: 'text' },
  { name: 'loai_sim', description: 'Loại SIM', format: 'text' },
  { name: 'so_dt', description: 'Số điện thoại', format: 'text' },
  { name: 'so_du', description: 'Số dư tài khoản', format: 'currency' },
  { name: 'data_con_lai', description: 'Data còn lại (MB)', format: 'number' },
  { name: 'ngay_het_han', description: 'Ngày hết hạn gói', format: 'date' },
  { name: 'ngay_kich_hoat', description: 'Ngày kích hoạt SIM', format: 'date' },
  { name: 'app_installed', description: 'Đã cài app chưa', format: 'boolean' },
]

const CHANNEL_LIMITS: Record<ChannelType, { title?: number; body: number; hasImage: boolean; imageRequired?: boolean }> = {
  Push:    { title: 65,  body: 240,   hasImage: true },
  'Zalo OA': { body: 1000, hasImage: true },
  SMS:     { body: 160,  hasImage: false },
  USSD:    { body: 182,  hasImage: false },
  Banner:  { title: 65,  body: 120,   hasImage: true, imageRequired: true },
  Email:   { title: 100, body: 99999, hasImage: true },
}

interface ChannelContent {
  title?: string
  body?: string
  cta?: string
  ctaUrl?: string
  imageName?: string
  sampleValues?: Record<string, string>
}

function ChannelPreview({ ch, content }: { ch: ChannelType; content: ChannelContent }) {
  const { title, body, cta, imageName } = content
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
          <div className="text-[10px] text-slate-400 font-medium">VietnamPost</div>
          <div className="bg-slate-100 rounded p-2 text-slate-700">{body || 'Nội dung SMS...'}</div>
          <div className="text-slate-400">{(body ?? '').length}/160 · {Math.ceil(Math.max(1, (body ?? '').length) / 160)} SMS</div>
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
          <div className="text-[10px] text-slate-400">From: VietnamPost</div>
          {imageName
            ? <img src={imageName} alt="banner" className="w-full rounded object-cover max-h-20" />
            : <div className="bg-slate-200 rounded h-12 flex items-center justify-center text-slate-400 text-[10px]">Banner (optional)</div>
          }
          <div className="font-medium border-b border-slate-100 pb-1">{title || 'Subject...'}</div>
          <div className="text-slate-500">{body || 'Body...'}</div>
        </>
      )}
    </div>
  )
}

export function TemplateEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const existing = id && id !== 'new' ? mockTemplates.find(t => t.id === id) : null

  const [tplName, setTplName] = useState(existing?.name ?? '')
  const [tplDesc, setTplDesc] = useState('')
  const [tplStatus, setTplStatus] = useState<'Active' | 'Inactive'>('Active')
  const [activeChannels, setActiveChannels] = useState<ChannelType[]>(existing?.channels ?? [])
  const [activeTab, setActiveTab] = useState<ChannelType>(existing?.channels[0] ?? 'Push')
  const [contents, setContents] = useState<Record<ChannelType, ChannelContent>>({} as any)
  const [guideOpen, setGuideOpen] = useState(false)
  const [inactiveConfirm, setInactiveConfirm] = useState(false)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  const limits = CHANNEL_LIMITS[activeTab]
  const content = contents[activeTab] ?? {}

  const updateContent = (field: keyof ChannelContent, value: string) => {
    setContents(prev => ({ ...prev, [activeTab]: { ...(prev[activeTab] ?? {}), [field]: value } }))
  }

  const insertParam = (paramName: string) => {
    const tag = `{{${paramName}}}`
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

  const addChannel = (ch: ChannelType) => {
    if (activeChannels.includes(ch)) return
    setActiveChannels(prev => [...prev, ch])
    setActiveTab(ch)
  }

  const removeChannel = (ch: ChannelType) => {
    setActiveChannels(prev => {
      const next = prev.filter(x => x !== ch)
      if (activeTab === ch) setActiveTab(next[0] ?? 'Push')
      return next
    })
    setContents(prev => { const n = { ...prev }; delete n[ch]; return n })
  }

  const hasContent = (ch: ChannelType) => !!(contents[ch]?.body || contents[ch]?.title)

  const activeCampaignsUsingThis = existing
    ? mockCampaigns.filter(c => c.status === 'Active')
    : []

  const doSave = () => {
    const emptyChannels = activeChannels.filter(ch => !hasContent(ch))
    if (emptyChannels.length > 0) {
      toast(`Cảnh báo: kênh ${emptyChannels.join(', ')} chưa có nội dung`, 'warning')
    }
    toast('Đã lưu template ✓', 'success')
    navigate('/templates')
  }

  const handleSave = () => {
    if (!tplName.trim()) {
      toast('Tên template không được để trống', 'error')
      return
    }
    if (tplStatus === 'Inactive' && activeCampaignsUsingThis.length > 0) {
      setInactiveConfirm(true)
      return
    }
    doSave()
  }

  return (
    <div className="max-w-5xl space-y-4">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-lg px-6 py-4 space-y-3">
        <button onClick={() => navigate('/templates')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700">
          <ArrowLeft size={14} /> Template
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            <input
              value={tplName}
              onChange={e => setTplName(e.target.value)}
              placeholder="VD: Nhắc nạp tiền - SMS"
              maxLength={200}
              className="text-lg font-semibold border-b border-slate-200 focus:border-blue-400 focus:outline-none w-full py-1 bg-transparent"
            />
            <input
              value={tplDesc}
              onChange={e => setTplDesc(e.target.value)}
              placeholder="Mô tả ngắn về mục đích template này..."
              maxLength={500}
              className="text-sm text-slate-500 border-b border-slate-100 focus:border-blue-300 focus:outline-none w-full py-1 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden text-xs">
              <label className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors ${tplStatus === 'Active' ? 'bg-green-50 text-green-700 font-medium' : 'text-slate-400 hover:bg-slate-50'}`}>
                <input type="radio" className="hidden" checked={tplStatus === 'Active'} onChange={() => setTplStatus('Active')} />
                <span className={`w-1.5 h-1.5 rounded-full ${tplStatus === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                Active
              </label>
              <div className="w-px h-5 bg-slate-200" />
              <label className={`flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors ${tplStatus === 'Inactive' ? 'bg-slate-100 text-slate-600 font-medium' : 'text-slate-400 hover:bg-slate-50'}`}>
                <input type="radio" className="hidden" checked={tplStatus === 'Inactive'} onChange={() => setTplStatus('Inactive')} />
                <span className={`w-1.5 h-1.5 rounded-full ${tplStatus === 'Inactive' ? 'bg-slate-400' : 'bg-slate-300'}`} />
                Inactive
              </label>
            </div>
            <Button variant="primary" onClick={handleSave}>Lưu Template</Button>
          </div>
        </div>
      </div>

      {/* Progress */}
      {activeChannels.length > 0 && (
        <div className="flex gap-3 items-center flex-wrap text-xs text-slate-500">
          <span className="font-medium">TIẾN ĐỘ NỘI DUNG:</span>
          {activeChannels.map(ch => (
            <span key={ch} className={hasContent(ch) ? 'text-green-600 font-medium' : 'text-slate-400'}>
              {ch} {hasContent(ch) ? '●' : '○'}
            </span>
          ))}
        </div>
      )}

      {/* Channel tabs */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="flex items-center border-b border-slate-200 px-4 pt-3 gap-1 flex-wrap">
          {activeChannels.map(ch => (
            <div key={ch}
              onClick={() => setActiveTab(ch)}
              className={`flex items-center gap-1 px-3 py-1.5 text-xs cursor-pointer border-b-2 transition-colors ${
                activeTab === ch
                  ? 'border-blue-500 text-blue-700 font-medium'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}>
              {ch} {hasContent(ch) ? <span className="text-green-500">●</span> : <span className="text-slate-300">○</span>}
              <button onClick={e => { e.stopPropagation(); removeChannel(ch) }}
                className="ml-1 hover:text-red-400 text-slate-300"><X size={10} /></button>
            </div>
          ))}
          <select
            onChange={e => { if (e.target.value) { addChannel(e.target.value as ChannelType); (e.target as HTMLSelectElement).value = '' }}}
            className="text-xs border border-dashed border-slate-300 rounded px-2 py-1 text-slate-500 focus:outline-none mb-0.5"
            value="">
            <option value="">+ Kênh</option>
            {CHANNELS.filter(ch => !activeChannels.includes(ch)).map(ch => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
        </div>

        {activeChannels.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Chưa có kênh nào. Nhấn "+ Kênh" để bắt đầu soạn nội dung.
          </div>
        ) : (
          <div className="grid grid-cols-[55%_45%]">
            {/* LEFT: compose */}
            <div className="p-5 border-r border-slate-100 space-y-4">
              {/* Guide toggle */}
              <button onClick={() => setGuideOpen(!guideOpen)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:bg-blue-50 w-full text-left py-1">
                {guideOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                ℹ Hướng dẫn khai báo {activeTab}
              </button>
              {guideOpen && (
                <div className="text-xs text-slate-600 bg-blue-50 rounded p-3 space-y-1">
                  {activeTab === 'Push' && <>
                    <div>• Title: tối đa 65 ký tự. Hỗ trợ biến {'{{...}}'}.</div>
                    <div>• Body: tối đa 240 ký tự. Hỗ trợ biến {'{{...}}'}.</div>
                    <div>• Image: optional, tỉ lệ 1:1, tối đa 1MB.</div>
                  </>}
                  {activeTab === 'SMS' && <>
                    <div>• Body: tối đa 160 ký tự/segment. Vượt 160 → tính thêm segment.</div>
                    <div>• Chỉ plain text — không hỗ trợ ảnh.</div>
                  </>}
                  {activeTab === 'Zalo OA' && <>
                    <div>• Nội dung: tối đa 1000 ký tự. Hỗ trợ biến {'{{...}}'}.</div>
                    <div>• OA phải được liên kết và phê duyệt trước khi gửi.</div>
                  </>}
                  {activeTab === 'USSD' && <>
                    <div>• Body: tối đa 182 ký tự. Chỉ plain text, không dấu tiếng Việt.</div>
                  </>}
                  {activeTab === 'Banner' && <>
                    <div>• Image: BẮT BUỘC, tỉ lệ 16:9, tối đa 2MB.</div>
                    <div>• Title: tối đa 65 ký tự. Body: tối đa 120 ký tự.</div>
                    <div>• CTA Label + CTA URL: bắt buộc.</div>
                  </>}
                  {activeTab === 'Email' && <>
                    <div>• Subject: tối đa 100 ký tự. Hỗ trợ biến {'{{...}}'}.</div>
                    <div>• Body: plain text, không giới hạn.</div>
                  </>}
                </div>
              )}

              {/* PARAMS */}
              <div>
                <div className="text-xs text-slate-500 font-medium mb-1.5">THAM SỐ ĐỘNG:</div>
                {ALL_PARAMS.length > 0 ? (
                  <>
                    <div className="flex flex-wrap gap-1.5">
                      {ALL_PARAMS.map(p => (
                        <div key={p.name} className="relative group">
                          <ParamChip name={p.name} onClick={() => insertParam(p.name)} />
                          <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-30">
                            {p.description} · {p.format}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-xs text-slate-400 mt-1">→ Click chip để chèn vào nội dung</div>
                  </>
                ) : (
                  <div className="text-xs text-slate-400 italic">Chưa có tham số động — cần có ít nhất 1 trigger Active trong hệ thống</div>
                )}
              </div>

              {/* Image */}
              {limits.hasImage && (
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">
                    Image {limits.imageRequired ? '** bắt buộc **' : '(optional)'}
                    {activeTab === 'Push' ? ' · 1:1' : activeTab === 'Banner' ? ' · 16:9' : activeTab === 'Email' ? ' · banner ngang' : ''}
                  </label>
                  {content.imageName ? (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs">
                      <span className="text-slate-600 flex-1 truncate">{content.imageName}</span>
                      <button onClick={() => updateContent('imageName', '')} className="text-slate-400 hover:text-red-400">Xóa</button>
                      <button onClick={() => updateContent('imageName', 'new-image.jpg')} className="text-blue-500">Đổi</button>
                    </div>
                  ) : (
                    <button onClick={() => updateContent('imageName', 'sample.jpg')}
                      className="w-full border-2 border-dashed border-slate-200 rounded-lg py-3 text-xs text-slate-400 hover:border-blue-300 hover:text-blue-500 flex items-center justify-center gap-2">
                      <Upload size={12} /> Kéo thả hoặc Tải lên · Chọn thư viện
                    </button>
                  )}
                </div>
              )}

              {/* Title / Subject */}
              {limits.title !== undefined && (
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">
                    {activeTab === 'Email' ? 'Subject *' : 'Title *'}
                    <span className="float-right text-slate-400">{(content.title ?? '').length}/{limits.title}</span>
                  </label>
                  <input value={content.title ?? ''} onChange={e => updateContent('title', e.target.value)}
                    maxLength={limits.title}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400" />
                </div>
              )}

              {/* Body */}
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">
                  {activeTab === 'Email' ? 'Body * (plain text)' : 'Nội dung *'}
                  <span className={`float-right ${limits.body !== 99999 && (content.body ?? '').length > limits.body ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                    {(content.body ?? '').length}{limits.body !== 99999 ? `/${limits.body}` : ''}
                  </span>
                </label>
                <textarea ref={bodyRef} rows={activeTab === 'Email' ? 5 : 3}
                  value={content.body ?? ''} onChange={e => updateContent('body', e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400 resize-none" />
                {activeTab === 'SMS' && (content.body ?? '').length > 160 && (
                  <div className="text-xs text-orange-500 mt-1">
                    {Math.ceil((content.body ?? '').length / 160)} SMS segments
                  </div>
                )}
              </div>

              {/* CTA (Banner) */}
              {activeTab === 'Banner' && (
                <>
                  <div>
                    <label className="text-xs text-slate-600 font-medium block mb-1">CTA Label *</label>
                    <input value={content.cta ?? ''} onChange={e => updateContent('cta', e.target.value)}
                      placeholder="Khám phá ngay"
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 font-medium block mb-1">CTA URL *</label>
                    <input value={content.ctaUrl ?? ''} onChange={e => updateContent('ctaUrl', e.target.value)}
                      placeholder="https://..."
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400" />
                  </div>
                </>
              )}
            </div>

            {/* RIGHT: preview realtime */}
            <div className="p-5 bg-slate-50 space-y-3">
              <div className="text-xs text-slate-500 font-medium">XEM TRƯỚC · {activeTab.toUpperCase()}</div>
              <ChannelPreview ch={activeTab} content={content} />

            </div>
          </div>
        )}
      </div>

      <Dialog open={inactiveConfirm} onClose={() => setInactiveConfirm(false)} title="Chuyển template sang Inactive?">
        <p className="text-sm text-slate-600">
          Template này đang được dùng trong <strong>{activeCampaignsUsingThis.length} campaign Active</strong>. Chuyển sang Inactive sẽ ảnh hưởng đến nội dung tin nhắn của các campaign đó. Xác nhận?
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setInactiveConfirm(false)}>Hủy</Button>
          <Button variant="danger" onClick={() => { setInactiveConfirm(false); doSave() }}>Xác nhận Lưu</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

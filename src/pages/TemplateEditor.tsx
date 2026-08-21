import { useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, X, Upload, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { ParamChip } from '../components/ui/Badge'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { mockTemplates, mockCampaigns, mockTriggers } from '../data/mock'
import { removeVietnameseTones } from '../lib/utils'
import type { ChannelType, TemplateChannelContent } from '../types'

const CHANNELS: ChannelType[] = ['Push', 'Zalo OA', 'SMS', 'Banner', 'Email', 'USSD']

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
            <span className="font-medium">{title || 'Tiêu đề...'}</span>
          </div>
          <div className="text-slate-500">{body || 'Nội dung...'}</div>
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
          {body || 'Nội dung USSD...'}
        </div>
      )}
      {ch === 'Banner' && (
        <>
          <div className="bg-slate-200 rounded h-16 flex items-center justify-center text-slate-400 text-[10px]">Hình ảnh 16:9</div>
          <div className="font-medium">{title || 'Tiêu đề...'}</div>
          <div className="text-slate-500">{body || 'Nội dung...'}</div>
          {cta && <div className="bg-blue-500 text-white rounded px-2 py-0.5 text-center">{cta}</div>}
        </>
      )}
      {ch === 'Email' && (
        <>
          <div className="text-[10px] text-slate-400">From: VietnamPost</div>
          {imageName
            ? <img src={imageName} alt="banner" className="w-full rounded object-cover max-h-20" />
            : <div className="bg-slate-200 rounded h-12 flex items-center justify-center text-slate-400 text-[10px]">Banner (tùy chọn)</div>
          }
          <div className="font-medium border-b border-slate-100 pb-1">{title || 'Tiêu đề thư...'}</div>
          <div className="text-slate-500">{body || 'Nội dung...'}</div>
        </>
      )}
    </div>
  )
}

export function TemplateEditor({ readOnly = false }: { readOnly?: boolean } = {}) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()

  const existing = id && id !== 'new' ? mockTemplates.find(t => t.id === id) : null

  const [tplName, setTplName] = useState(existing?.name ?? '')
  const [tplDesc, setTplDesc] = useState(existing?.description ?? '')
  const [tplStatus, setTplStatus] = useState<'Active' | 'Inactive'>(existing?.status ?? 'Active')
  // Trigger — BẮT BUỘC chọn đúng 1 trigger (URD v4.4). Mục đích: lấy đúng bộ tham số của trigger đó
  // để soạn nhanh + chính xác, KHÔNG phải để nhóm hiển thị. Chỉ liệt kê trigger đang Active để chọn.
  const [triggerCode, setTriggerCode] = useState<string>(existing?.triggerCode ?? '')
  const [triggerPickerOpen, setTriggerPickerOpen] = useState(false)
  const [triggerTouched, setTriggerTouched] = useState(false)
  const activeTriggers = mockTriggers.filter(t => t.status === 'Active')
  const selectedTrigger = mockTriggers.find(t => t.code === triggerCode)
  const selectTrigger = (code: string) => {
    setTriggerCode(code)
    setTriggerTouched(true)
    setTriggerPickerOpen(false)
  }
  const [activeChannels, setActiveChannels] = useState<ChannelType[]>(existing?.channels ?? [])
  const [activeTab, setActiveTab] = useState<ChannelType>(existing?.channels[0] ?? 'Push')
  const [contents, setContents] = useState<Record<ChannelType, ChannelContent>>(
    (existing?.contents ?? {}) as Record<ChannelType, TemplateChannelContent>
  )
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
    toast('Đã lưu mẫu tin nhắn ✓', 'success')
    navigate('/templates')
  }

  const handleSave = () => {
    if (!tplName.trim()) {
      toast('Tên mẫu tin nhắn không được để trống', 'error')
      return
    }
    if (!triggerCode) {
      setTriggerTouched(true)
      toast('Vui lòng chọn sự kiện kích hoạt cho mẫu tin nhắn này', 'error')
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
          <ArrowLeft size={14} /> Mẫu tin nhắn
        </button>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {readOnly
              ? <div className="text-lg font-semibold py-1">{tplName || 'Không có tên'}</div>
              : <input
                  value={tplName}
                  onChange={e => setTplName(e.target.value)}
                  placeholder="VD: Nhắc nạp tiền - SMS"
                  maxLength={200}
                  className="text-lg font-semibold border-b border-slate-200 focus:border-blue-400 focus:outline-none w-full py-1 bg-transparent"
                />
            }
            {readOnly
              ? tplDesc && <div className="text-sm text-slate-500 py-1">{tplDesc}</div>
              : <input
                  value={tplDesc}
                  onChange={e => setTplDesc(e.target.value)}
                  placeholder="Mô tả ngắn về mục đích mẫu tin nhắn này..."
                  maxLength={500}
                  className="text-sm text-slate-500 border-b border-slate-100 focus:border-blue-300 focus:outline-none w-full py-1 bg-transparent"
                />
            }

            {/* Trigger — bắt buộc chọn đúng 1, dùng để lấy đúng tham số động của trigger đó (URD v4.4) */}
            <div>
              <label className="text-xs text-slate-500 font-medium block mb-1">
                Sự kiện kích hoạt <span className="text-red-400">*</span>
              </label>
              {readOnly ? (
                selectedTrigger
                  ? <span className="bg-slate-100 text-slate-600 rounded px-1.5 py-0.5 text-xs">{selectedTrigger.code} · {selectedTrigger.name}</span>
                  : <span className="text-xs text-slate-400 italic">Chưa chọn sự kiện kích hoạt</span>
              ) : (
                <div className="relative">
                  <button type="button" onClick={() => setTriggerPickerOpen(o => !o)}
                    className={`w-full flex items-center gap-1 px-2 py-1.5 border rounded text-left text-xs min-h-[34px] hover:border-blue-300 ${triggerTouched && !triggerCode ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
                    {selectedTrigger
                      ? <span className="bg-blue-50 text-blue-700 rounded px-1.5 py-0.5">{selectedTrigger.code} · {selectedTrigger.name}</span>
                      : <span className="text-slate-400">-- Chọn sự kiện kích hoạt --</span>}
                  </button>
                  {triggerPickerOpen && (
                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {activeTriggers.map(t => (
                        <button type="button" key={t.code} onClick={() => selectTrigger(t.code)}
                          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 text-left">
                          <span className="font-mono text-slate-500">{t.code}</span>
                          <span className="text-slate-700">{t.name}</span>
                        </button>
                      ))}
                      {activeTriggers.length === 0 && <div className="px-3 py-2 text-xs text-slate-400">Không có sự kiện kích hoạt nào đang hoạt động</div>}
                    </div>
                  )}
                  {triggerTouched && !triggerCode && (
                    <div className="text-xs text-red-500 mt-0.5">Vui lòng chọn sự kiện kích hoạt cho mẫu tin nhắn này</div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden text-xs">
              <label className={`flex items-center gap-1.5 px-3 py-1.5 ${readOnly ? 'cursor-default' : 'cursor-pointer'} transition-colors ${tplStatus === 'Active' ? 'bg-green-50 text-green-700 font-medium' : 'text-slate-400 hover:bg-slate-50'}`}>
                <input type="radio" className="hidden" checked={tplStatus === 'Active'} onChange={() => !readOnly && setTplStatus('Active')} readOnly={readOnly} />
                <span className={`w-1.5 h-1.5 rounded-full ${tplStatus === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`} />
                Hoạt động
              </label>
              <div className="w-px h-5 bg-slate-200" />
              <label className={`flex items-center gap-1.5 px-3 py-1.5 ${readOnly ? 'cursor-default' : 'cursor-pointer'} transition-colors ${tplStatus === 'Inactive' ? 'bg-slate-100 text-slate-600 font-medium' : 'text-slate-400 hover:bg-slate-50'}`}>
                <input type="radio" className="hidden" checked={tplStatus === 'Inactive'} onChange={() => !readOnly && setTplStatus('Inactive')} readOnly={readOnly} />
                <span className={`w-1.5 h-1.5 rounded-full ${tplStatus === 'Inactive' ? 'bg-slate-400' : 'bg-slate-300'}`} />
                Không hoạt động
              </label>
            </div>
            {readOnly ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 border border-slate-200 rounded px-3 py-1.5">Chỉ xem</span>
                <Button variant="outline" onClick={() => {
                  if (!existing) return
                  const clone = { ...existing, id: String(Date.now()), name: `Bản sao của ${existing.name}`, usageCount: 0 }
                  navigate(`/templates/${clone.id}`)
                }}>Sao chép</Button>
                <Button variant="primary" onClick={() => navigate(`/templates/${id}`)}>Sửa</Button>
              </div>
            ) : (
              <Button variant="primary" onClick={handleSave}>Lưu Mẫu tin nhắn</Button>
            )}
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
              {!readOnly && (
                <button onClick={e => { e.stopPropagation(); removeChannel(ch) }}
                  className="ml-1 hover:text-red-400 text-slate-300"><X size={10} /></button>
              )}
            </div>
          ))}
          {!readOnly && (
            <select
              onChange={e => { if (e.target.value) { addChannel(e.target.value as ChannelType); (e.target as HTMLSelectElement).value = '' }}}
              className="text-xs border border-dashed border-slate-300 rounded px-2 py-1 text-slate-500 focus:outline-none mb-0.5"
              value="">
              <option value="">+ Kênh</option>
              {CHANNELS.filter(ch => !activeChannels.includes(ch)).map(ch => (
                <option key={ch} value={ch}>{ch}</option>
              ))}
            </select>
          )}
        </div>

        {activeChannels.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Chưa có kênh nào. Nhấn "+ Kênh" để bắt đầu soạn nội dung.
          </div>
        ) : (
          <div className="grid grid-cols-[55%_45%]">
            {/* LEFT: compose */}
            <div className="p-5 border-r border-slate-100 space-y-4">
              {/* Guide toggle — ẩn khi readOnly */}
              {!readOnly && (
                <>
                  <button onClick={() => setGuideOpen(!guideOpen)}
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:bg-blue-50 w-full text-left py-1">
                    {guideOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    ℹ Hướng dẫn khai báo {activeTab}
                  </button>
                  {guideOpen && (
                    <div className="text-xs text-slate-600 bg-blue-50 rounded p-3 space-y-1">
                      {activeTab === 'Push' && <>
                        <div>• Tiêu đề: tối đa 65 ký tự. Hỗ trợ biến {'{{...}}'}.</div>
                        <div>• Nội dung: tối đa 240 ký tự. Hỗ trợ biến {'{{...}}'}.</div>
                        <div>• Hình ảnh: tùy chọn, tỉ lệ 1:1, tối đa 1MB.</div>
                      </>}
                      {activeTab === 'SMS' && <>
                        <div>• Nội dung: tối đa 160 ký tự/đoạn. Vượt 160 → tính thêm đoạn.</div>
                        <div>• Chỉ văn bản thuần — không hỗ trợ ảnh.</div>
                      </>}
                      {activeTab === 'Zalo OA' && <>
                        <div>• Nội dung: tối đa 1000 ký tự. Hỗ trợ biến {'{{...}}'}.</div>
                        <div>• OA phải được liên kết và phê duyệt trước khi gửi.</div>
                      </>}
                      {activeTab === 'USSD' && <>
                        <div>• Nội dung: tối đa 182 ký tự. Chỉ văn bản thuần, không dấu tiếng Việt.</div>
                      </>}
                      {activeTab === 'Banner' && <>
                        <div>• Hình ảnh: BẮT BUỘC, tỉ lệ 16:9, tối đa 2MB.</div>
                        <div>• Tiêu đề: tối đa 65 ký tự. Nội dung: tối đa 120 ký tự.</div>
                        <div>• Nhãn nút bấm + Đường dẫn nút bấm: bắt buộc.</div>
                      </>}
                      {activeTab === 'Email' && <>
                        <div>• Tiêu đề thư: tối đa 100 ký tự. Hỗ trợ biến {'{{...}}'}.</div>
                        <div>• Nội dung: văn bản thuần, không giới hạn.</div>
                      </>}
                    </div>
                  )}
                </>
              )}

              {/* PARAMS — lấy đúng theo trigger đã chọn ở Header (URD v4.4), ẩn khi readOnly */}
              {!readOnly && (
                <div>
                  <div className="text-xs text-slate-500 font-medium mb-1.5">THAM SỐ ĐỘNG:</div>
                  {!selectedTrigger ? (
                    <div className="text-xs text-slate-400 italic">Chọn sự kiện kích hoạt để xem tham số khả dụng</div>
                  ) : selectedTrigger.params.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTrigger.params.map(p => (
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
                    <div className="text-xs text-slate-400 italic">Sự kiện kích hoạt này chưa khai báo tham số nào</div>
                  )}
                  {/* Cảnh báo tham số đã chèn không còn thuộc trigger đang chọn (ví dụ sau khi đổi trigger) */}
                  {selectedTrigger && (() => {
                    const validNames = new Set(selectedTrigger.params.map(p => p.name))
                    const used = Array.from((content.body ?? '').matchAll(/\{\{(\w+)\}\}/g)).map(m => m[1])
                    const invalid = Array.from(new Set(used.filter(n => !validNames.has(n))))
                    if (invalid.length === 0) return null
                    return (
                      <div className="text-xs text-orange-500 mt-1.5">
                        ⚠ Tham số {invalid.map(n => `{{${n}}}`).join(', ')} không thuộc sự kiện kích hoạt đã chọn — kiểm tra lại nội dung trước khi lưu
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Image */}
              {limits.hasImage && (
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">
                    Hình ảnh {limits.imageRequired ? '** bắt buộc **' : '(tùy chọn)'}
                    {activeTab === 'Push' ? ' · 1:1' : activeTab === 'Banner' ? ' · 16:9' : activeTab === 'Email' ? ' · banner ngang' : ''}
                  </label>
                  {content.imageName ? (
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2 py-1.5 text-xs">
                      <span className="text-slate-600 flex-1 truncate">{content.imageName}</span>
                      {!readOnly && <>
                        <button onClick={() => updateContent('imageName', '')} className="text-slate-400 hover:text-red-400">Xóa</button>
                        <button onClick={() => updateContent('imageName', 'new-image.jpg')} className="text-blue-500">Đổi</button>
                      </>}
                    </div>
                  ) : (
                    <button disabled={readOnly}
                      onClick={() => !readOnly && updateContent('imageName', 'sample.jpg')}
                      className="w-full border-2 border-dashed border-slate-200 rounded-lg py-3 text-xs text-slate-400 flex items-center justify-center gap-2 disabled:cursor-not-allowed">
                      <Upload size={12} /> Kéo thả hoặc Tải lên · Chọn thư viện
                    </button>
                  )}
                </div>
              )}

              {/* Title / Subject */}
              {limits.title !== undefined && (
                <div>
                  <label className="text-xs text-slate-600 font-medium block mb-1">
                    {activeTab === 'Email' ? 'Tiêu đề' : 'Tiêu đề'}
                    <span className="float-right text-slate-400">{(content.title ?? '').length}/{limits.title}</span>
                  </label>
                  <input value={content.title ?? ''} onChange={e => updateContent('title', e.target.value)}
                    maxLength={limits.title} disabled={readOnly}
                    className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" />
                </div>
              )}

              {/* Body */}
              <div>
                <label className="text-xs text-slate-600 font-medium block mb-1">
                  {'Nội dung'}
                  <span className={`float-right ${limits.body !== 99999 && (content.body ?? '').length > limits.body ? 'text-red-500 font-semibold' : 'text-slate-400'}`}>
                    {(content.body ?? '').length}{limits.body !== 99999 ? `/${limits.body}` : ''}
                  </span>
                </label>
                <textarea ref={bodyRef} rows={activeTab === 'Email' ? 5 : 3}
                  value={content.body ?? ''}
                  onChange={e => {
                    const val = activeTab === 'USSD' ? removeVietnameseTones(e.target.value) : e.target.value
                    updateContent('body', val)
                  }}
                  disabled={readOnly}
                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400 resize-none disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" />
                {activeTab === 'USSD' && (
                  <div className="text-xs text-slate-400 mt-1">⚠ USSD không hỗ trợ tiếng Việt có dấu — tự động chuyển sang không dấu</div>
                )}
                {activeTab === 'SMS' && (content.body ?? '').length > 160 && (
                  <div className="text-xs text-orange-500 mt-1">
                    {Math.ceil((content.body ?? '').length / 160)} đoạn SMS
                  </div>
                )}
              </div>

              {/* CTA (Banner) */}
              {activeTab === 'Banner' && (
                <>
                  <div>
                    <label className="text-xs text-slate-600 font-medium block mb-1">Nhãn nút bấm</label>
                    <input value={content.cta ?? ''} onChange={e => updateContent('cta', e.target.value)}
                      placeholder="Khám phá ngay" disabled={readOnly}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-600 font-medium block mb-1">Đường dẫn nút bấm</label>
                    <input value={content.ctaUrl ?? ''} onChange={e => updateContent('ctaUrl', e.target.value)}
                      placeholder="https://..." disabled={readOnly}
                      className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed" />
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

      <Dialog open={inactiveConfirm} onClose={() => setInactiveConfirm(false)} title="Xác nhận lưu mẫu tin nhắn">
        <p className="text-sm text-slate-600">
          Mẫu tin nhắn này đang được dùng trong <strong>{activeCampaignsUsingThis.length} chiến dịch đang hoạt động</strong>. Chuyển sang không hoạt động sẽ ảnh hưởng đến nội dung tin nhắn của các chiến dịch đó. Xác nhận?
        </p>
        <DialogActions>
          <Button variant="outline" onClick={() => setInactiveConfirm(false)}>Hủy</Button>
          <Button variant="danger" onClick={() => { setInactiveConfirm(false); doSave() }}>Xác nhận Lưu</Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

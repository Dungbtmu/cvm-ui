import { useState } from 'react'
import { Search, Plus, X } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Dialog, DialogActions } from '../components/ui/Dialog'
import { useToast } from '../components/ui/Toast'
import { useRole } from '../lib/roleContext'
import { mockTriggers, mockCampaigns } from '../data/mock'
import type { Trigger, TriggerType, TriggerParam } from '../types'

const statusColor: Record<string, string> = {
  Active: 'text-green-600',
  Inactive: 'text-slate-400',
}

interface TriggerManagementProps {
  forceAdmin?: boolean // Admin screen passes this to override role
}

export function TriggerManagement({ forceAdmin }: TriggerManagementProps) {
  const { toast } = useToast()
  const { isAdmin } = useRole()
  const canEdit = forceAdmin || isAdmin

  const [triggers, setTriggers] = useState<Trigger[]>(mockTriggers)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Tất cả')
  const [expandedGroups, setExpandedGroups] = useState<TriggerType[]>(['Realtime', 'Near Realtime', 'Offline'])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Trigger | null>(null)
  const [toggleTarget, setToggleTarget] = useState<Trigger | null>(null)

  // Form state
  const [formCode, setFormCode] = useState('')
  const [formName, setFormName] = useState('')
  const [formType, setFormType] = useState<TriggerType>('Realtime')
  const [formSource, setFormSource] = useState<'BSS' | 'OCS'>('BSS')
  const [formDesc, setFormDesc] = useState('')
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active')
  const [formParams, setFormParams] = useState<TriggerParam[]>([])

  const openAdd = () => {
    setEditing(null)
    setFormCode(''); setFormName(''); setFormType('Realtime'); setFormSource('BSS')
    setFormDesc(''); setFormStatus('Active'); setFormParams([])
    setDialogOpen(true)
  }
  const openEdit = (t: Trigger) => {
    setEditing(t)
    setFormCode(t.code); setFormName(t.name); setFormType(t.type); setFormSource(t.source)
    setFormDesc(t.description ?? ''); setFormStatus(t.status === 'Active' ? 'Active' : 'Inactive')
    setFormParams([...t.params])
    setDialogOpen(true)
  }
  const handleSave = () => {
    if (!formCode || !formName) return
    if (formParams.length === 0) return
    if (editing) {
      setTriggers(prev => prev.map(t => t.id === editing.id
        ? { ...t, code: formCode, name: formName, type: formType, source: formSource, description: formDesc, status: formStatus === 'Active' ? 'Active' : 'Inactive', params: formParams }
        : t))
    } else {
      setTriggers(prev => [...prev, {
        id: String(Date.now()), code: formCode, name: formName, type: formType,
        source: formSource, description: formDesc, status: formStatus === 'Active' ? 'Active' : 'Inactive', params: formParams
      }])
    }
    toast('Đã lưu trigger ✓', 'success')
    setDialogOpen(false)
  }

  const toggleGroup = (type: TriggerType) => {
    setExpandedGroups(prev => prev.includes(type) ? prev.filter(x => x !== type) : [...prev, type])
  }

  // Khi tắt trigger: check nếu đang dùng trong Active campaign thì cần confirm có cảnh báo
  const handleToggleClick = (t: Trigger) => {
    setToggleTarget(t)
  }
  const confirmToggle = () => {
    if (!toggleTarget) return
    setTriggers(prev => prev.map(x => x.id === toggleTarget.id
      ? { ...x, status: x.status === 'Active' ? 'Inactive' : 'Active' } : x))
    toast(toggleTarget.status === 'Active' ? 'Đã tắt trigger' : 'Đã bật trigger', 'success')
    setToggleTarget(null)
  }

  // Active campaigns using this trigger
  const affectedCampaigns = toggleTarget
    ? mockCampaigns.filter(c => c.status === 'Active' && c.triggers.includes(toggleTarget.code))
    : []

  const groups: TriggerType[] = ['Realtime', 'Near Realtime', 'Offline']
  const filtered = triggers.filter(t => {
    const matchSearch = !search ||
      t.code.toLowerCase().includes(search.toLowerCase()) ||
      t.name.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'Tất cả' || t.status === statusFilter
    return matchSearch && matchStatus
  })

  // Auto-expand groups that have search results
  const visibleGroups = groups.filter(group => {
    const groupTriggers = filtered.filter(t => t.type === group)
    return groupTriggers.length > 0 || !search
  })

  return (
    <div className="space-y-4">
      {!forceAdmin && (
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-800">Trigger Management</h1>
          {canEdit && (
            <Button variant="primary" onClick={openAdd}>
              <Plus size={14} /> Thêm Trigger
            </Button>
          )}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Tìm trigger code hoặc tên..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400" />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded px-2 py-2 focus:outline-none"
        >
          {['Tất cả', 'Active', 'Inactive'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {visibleGroups.map(group => {
          const groupTriggers = filtered.filter(t => t.type === group)
          // Auto-expand group containing search results
          const expanded = search ? true : expandedGroups.includes(group)
          return (
            <div key={group} className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <button
                onClick={() => !search && toggleGroup(group)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200 hover:bg-slate-100 transition-colors"
              >
                <span className="text-sm font-semibold text-slate-700">
                  {expanded ? '▼' : '▶'} {group.toUpperCase()}
                  <span className="ml-2 text-xs font-normal text-slate-500">({groupTriggers.length} trigger)</span>
                </span>
              </button>
              {expanded && (
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-100">
                    <tr className="text-xs text-slate-500">
                      <th className="text-left px-4 py-2 font-medium">Code</th>
                      <th className="text-left px-4 py-2 font-medium">Tên</th>
                      <th className="text-left px-4 py-2 font-medium">Source</th>
                      <th className="text-left px-4 py-2 font-medium">Trạng thái</th>
                      {canEdit && <th className="text-right px-4 py-2 font-medium">Hành động</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {groupTriggers.map(t => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5">
                          <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${search && (t.code.toLowerCase().includes(search.toLowerCase())) ? 'bg-yellow-100 text-yellow-800' : 'bg-amber-50 text-amber-700'}`}>
                            {t.code}
                          </span>
                        </td>
                        <td className={`px-4 py-2.5 text-slate-700 ${search && t.name.toLowerCase().includes(search.toLowerCase()) ? 'bg-yellow-50' : ''}`}>
                          {t.name}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs">{t.source}</td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs font-medium ${statusColor[t.status] ?? 'text-slate-500'}`}>
                            {t.status === 'Active' ? '● ' : '○ '}{t.status}
                          </span>
                        </td>
                        {canEdit && (
                          <td className="px-4 py-2.5">
                            <div className="flex gap-2 justify-end">
                              <Button size="sm" onClick={() => openEdit(t)}>Sửa</Button>
                              <Button size="sm" variant={t.status === 'Active' ? 'danger' : 'success'} onClick={() => handleToggleClick(t)}>
                                {t.status === 'Active' ? 'Tắt' : 'Bật'}
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                    {groupTriggers.length === 0 && (
                      <tr><td colSpan={canEdit ? 5 : 4} className="px-4 py-4 text-sm text-slate-400 text-center">Không có trigger</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )
        })}
        {visibleGroups.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-lg px-4 py-8 text-center text-slate-400 text-sm">
            Không tìm thấy trigger nào
          </div>
        )}
      </div>

      {/* Add/Edit dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} title={editing ? 'Sửa Trigger' : 'Thêm Trigger Mới'} className="max-w-2xl">
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Trigger code *</label>
              <input value={formCode} onChange={e => setFormCode(e.target.value.toUpperCase())}
                placeholder="VD: SIM_ACTIVATED"
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Loại *</label>
              <select value={formType} onChange={e => setFormType(e.target.value as TriggerType)}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none">
                <option>Realtime</option>
                <option>Near Realtime</option>
                <option>Offline</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Tên trigger *</label>
            <input value={formName} onChange={e => setFormName(e.target.value)}
              placeholder="VD: Kích hoạt SIM thành công"
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Event source *</label>
              <select value={formSource} onChange={e => setFormSource(e.target.value as 'BSS' | 'OCS')}
                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none">
                <option>BSS</option>
                <option>OCS</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Trạng thái</label>
              <div className="flex gap-3 pt-1">
                {['Active', 'Inactive'].map(s => (
                  <label key={s} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input type="radio" checked={formStatus === s} onChange={() => setFormStatus(s as any)} />
                    <span>{s}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Mô tả</label>
            <input value={formDesc} onChange={e => setFormDesc(e.target.value)}
              placeholder="VD: Fired khi KH kích hoạt SIM mới thành công"
              className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-400" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-600">Payload / Tham số</label>
              <Button size="sm" variant="ghost" onClick={() => setFormParams(prev => [...prev, { name: '', description: '', format: 'text', source: formSource }])}>
                <Plus size={10} /> Thêm tham số
              </Button>
            </div>
            {formParams.length > 0 && (
              <div className="space-y-2">
                <div className="flex gap-2 items-center text-xs text-slate-400 px-0.5">
                  <span className="flex-1 min-w-0">Tên tham số</span>
                  <span className="flex-1 min-w-0">Mô tả</span>
                  <span className="w-20 shrink-0">Định dạng</span>
                  <span className="w-14 shrink-0">Nguồn</span>
                  <span className="w-3 shrink-0" />
                </div>
                {formParams.map((p, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={p.name}
                      onChange={e => {
                        const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
                        setFormParams(prev => prev.map((x, j) => j === i ? { ...x, name: val } : x))
                      }}
                      placeholder="ten_param"
                      className="flex-1 min-w-0 px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none font-mono" />
                    <input value={p.description} onChange={e => setFormParams(prev => prev.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                      placeholder="Mô tả"
                      className="flex-1 min-w-0 px-2 py-1 border border-slate-200 rounded text-xs focus:outline-none" />
                    <select value={p.format} onChange={e => setFormParams(prev => prev.map((x, j) => j === i ? { ...x, format: e.target.value as any } : x))}
                      className="w-20 shrink-0 px-1 py-1 border border-slate-200 rounded text-xs focus:outline-none">
                      {['text', 'date', 'number', 'boolean', 'currency'].map(f => <option key={f}>{f}</option>)}
                    </select>
                    <select value={p.source} onChange={e => setFormParams(prev => prev.map((x, j) => j === i ? { ...x, source: e.target.value as any } : x))}
                      className="w-14 shrink-0 px-1 py-1 border border-slate-200 rounded text-xs focus:outline-none">
                      {['BSS', 'OCS'].map(s => <option key={s}>{s}</option>)}
                    </select>
                    <button
                      onClick={() => setFormParams(prev => prev.filter((_, j) => j !== i))}
                      disabled={formParams.length === 1}
                      className="text-slate-300 hover:text-red-400 shrink-0 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={formParams.length === 1 ? 'Trigger phải có ít nhất 1 tham số' : 'Xóa tham số'}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="text-xs text-slate-400 mt-1">Định dạng: text / date (DD/MM/YYYY) / number / boolean / currency (VND)</div>
            {formParams.length === 0 && (
              <div className="text-xs text-red-500 mt-1">Trigger phải có ít nhất 1 tham số payload</div>
            )}
          </div>
        </div>
        <DialogActions>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Hủy</Button>
          <Button variant="primary" onClick={handleSave} disabled={!formCode || !formName}>Lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Toggle confirm (with affected campaigns warning) */}
      <Dialog
        open={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        title={toggleTarget?.status === 'Active' ? `Tắt trigger ${toggleTarget?.code}?` : `Bật trigger ${toggleTarget?.code}?`}
      >
        <div className="space-y-3 text-sm text-slate-600">
          {toggleTarget?.status === 'Active' ? (
            <>
              <p>Trigger <strong className="font-mono">{toggleTarget?.code}</strong> sẽ chuyển sang trạng thái Inactive.</p>
              {affectedCampaigns.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-1">
                  <div className="text-red-700 font-medium text-xs">⚠ Đang dùng trong {affectedCampaigns.length} campaign Active:</div>
                  {affectedCampaigns.map(c => (
                    <div key={c.id} className="text-xs text-red-600 pl-2">• {c.name} ({c.code})</div>
                  ))}
                  <div className="text-xs text-red-500 mt-1">Tắt trigger có thể ảnh hưởng đến việc xử lý sự kiện của các campaign này.</div>
                </div>
              )}
            </>
          ) : (
            <p>Trigger <strong className="font-mono">{toggleTarget?.code}</strong> sẽ chuyển sang trạng thái Active.</p>
          )}
        </div>
        <DialogActions>
          <Button variant="outline" onClick={() => setToggleTarget(null)}>Hủy</Button>
          <Button variant={toggleTarget?.status === 'Active' ? 'danger' : 'success'} onClick={confirmToggle}>
            {toggleTarget?.status === 'Active' ? 'Tắt' : 'Bật'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

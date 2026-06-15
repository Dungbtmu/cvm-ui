import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { mockCustomers } from '../data/mock'

export function CustomerList() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [simFilter, setSimFilter] = useState('Tất cả')
  const [appFilter, setAppFilter] = useState('Tất cả')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  const filtered = mockCustomers.filter(c => {
    const matchSearch = !search || c.phone.includes(search) || c.name.toLowerCase().includes(search.toLowerCase())
    const matchSim = simFilter === 'Tất cả' || (simFilter === 'Tạm khóa' ? c.status === 'Suspended' : c.status === simFilter)
    const matchApp = appFilter === 'Tất cả' || (appFilter === 'Có' ? c.hasApp : !c.hasApp)
    return matchSearch && matchSim && matchApp
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const changePage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)))
  const changePageSize = (size: number) => { setPageSize(size); setPage(1) }
  const handleFilter = (fn: () => void) => { fn(); setPage(1) }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-800">Khách hàng</h1>

      <div className="bg-white border border-slate-200 rounded-lg p-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => handleFilter(() => setSearch(e.target.value))}
            placeholder="Tìm số điện thoại..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-blue-400" />
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 text-xs">Trạng thái SIM:</span>
          <select value={simFilter} onChange={e => handleFilter(() => setSimFilter(e.target.value))}
            className="border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none">
            {['Tất cả', 'Active', 'Inactive', 'Tạm khóa'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500 text-xs">Cài app:</span>
          <select value={appFilter} onChange={e => handleFilter(() => setAppFilter(e.target.value))}
            className="border border-slate-200 rounded px-2 py-1.5 text-sm focus:outline-none">
            {['Tất cả', 'Có', 'Không'].map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs text-slate-500">
              <th className="text-left px-4 py-3 font-medium">Số điện thoại</th>
              <th className="text-left px-4 py-3 font-medium">Tên khách hàng</th>
              <th className="text-left px-4 py-3 font-medium">Loại SIM</th>
              <th className="text-left px-4 py-3 font-medium">Trạng thái</th>
              <th className="text-left px-4 py-3 font-medium">Cài app</th>
              <th className="text-right px-4 py-3 font-medium">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paged.map((c, i) => (
              <tr key={i} className="hover:bg-slate-50">
                <td className="px-4 py-2.5 font-mono text-sm">{c.phone}</td>
                <td className="px-4 py-2.5 text-slate-700">{c.name}</td>
                <td className="px-4 py-2.5 text-slate-600">{c.simType}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs font-medium ${c.status === 'Active' ? 'text-green-600' : 'text-slate-400'}`}>
                    {c.status === 'Active' ? '● Hoạt động' : '○ Không hoạt động'}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-xs ${c.hasApp ? 'text-green-600' : 'text-slate-400'}`}>
                    {c.hasApp ? 'Có' : 'Không'}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button size="sm" onClick={() => navigate(`/customers/${c.phone.replace(/\s/g, '')}/360`)}>
                    Xem 360
                  </Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Không tìm thấy khách hàng</td></tr>
            )}
          </tbody>
        </table>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>{filtered.length} khách hàng</span>
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
              {[20, 50, 100].map(s => <option key={s} value={s}>{s}/trang</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

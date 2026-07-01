import { useNavigate } from 'react-router-dom'

export function Error401() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-8xl font-bold text-slate-200 leading-none select-none">401</div>
        <div className="mt-4 text-xl font-semibold text-slate-700">Phiên đăng nhập đã hết hạn</div>
        <p className="mt-2 text-sm text-slate-500">
          Bạn cần đăng nhập để tiếp tục sử dụng hệ thống.
        </p>
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Đăng nhập
          </button>
        </div>
      </div>
    </div>
  )
}

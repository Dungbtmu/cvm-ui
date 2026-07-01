import { useNavigate } from 'react-router-dom'

export function Error403() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        <div className="text-8xl font-bold text-slate-200 leading-none select-none">403</div>
        <div className="mt-4 text-xl font-semibold text-slate-700">Không có quyền truy cập</div>
        <p className="mt-2 text-sm text-slate-500">
          Tài khoản của bạn không có quyền xem trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là nhầm lẫn.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Quay lại
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    </div>
  )
}

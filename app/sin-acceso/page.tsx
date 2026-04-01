import { logout } from '@/app/login/actions'

export default function SinAccesoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <div className="w-full max-w-sm text-center">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Sin acceso
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Tu email no está dado de alta en Imagine OS.
            Contacta con tu administrador para que te añada.
          </p>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium
                         text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Volver al login
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

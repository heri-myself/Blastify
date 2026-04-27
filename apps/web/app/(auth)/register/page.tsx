import Link from 'next/link'

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-sm border max-w-sm w-full text-center space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">Pendaftaran Ditutup</h1>
        <p className="text-sm text-gray-500">
          Akun baru hanya dapat dibuat oleh administrator. Hubungi admin untuk mendapatkan akses.
        </p>
        <Link href="/login" className="block text-sm text-blue-600 hover:underline">
          Kembali ke halaman login
        </Link>
      </div>
    </div>
  )
}

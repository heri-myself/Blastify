import { AuthForm } from '@/components/auth-form'
import { login } from './actions'

export default function LoginPage() {
  return (
    <AuthForm
      title="Masuk"
      action={login}
      submitLabel="Masuk"
      footerLink={{ href: '/register', label: 'Belum punya akun? Daftar' }}
    />
  )
}

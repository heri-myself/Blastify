import { AuthForm } from '@/components/auth-form'
import { register } from './actions'

export default function RegisterPage() {
  return (
    <AuthForm
      title="Daftar Akun"
      action={register}
      submitLabel="Daftar"
      footerLink={{ href: '/login', label: 'Sudah punya akun? Masuk' }}
    />
  )
}

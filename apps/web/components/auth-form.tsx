'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface AuthFormProps {
  title: string
  action: (formData: FormData) => Promise<{ error: string } | undefined>
  submitLabel: string
  footerLink?: { href: string; label: string }
}

export function AuthForm({ title, action, submitLabel, footerLink }: AuthFormProps) {
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    const result = await action(formData)
    if (result?.error) setError(result.error)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8f7]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#111111] flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.115 1.533 5.838L0 24l6.338-1.51A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.787 9.787 0 0 1-5.003-1.368l-.36-.213-3.76.896.952-3.653-.235-.374A9.76 9.76 0 0 1 2.182 12C2.182 6.575 6.575 2.182 12 2.182S21.818 6.575 21.818 12 17.425 21.818 12 21.818z"/>
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#111111] tracking-tight">{title}</h1>
          <p className="text-[13px] text-[#7a7a7a] mt-1">WA Broadcast Tools</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#e8e8e6] p-6 shadow-sm">
          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[13px] font-medium text-[#111111]">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="nama@email.com"
                className="w-full h-10 px-3 rounded-lg border border-[#e8e8e6] bg-[#f8f8f7] text-[14px] text-[#111111] placeholder:text-[#b0b0b0] outline-none focus:border-[#111111] focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-[13px] font-medium text-[#111111]">Password</label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  className="w-full h-10 px-3 pr-10 rounded-lg border border-[#e8e8e6] bg-[#f8f8f7] text-[14px] text-[#111111] placeholder:text-[#b0b0b0] outline-none focus:border-[#111111] focus:bg-white transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#7a7a7a] transition-colors"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-[13px] text-[#e5484d] bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 rounded-lg bg-[#111111] text-white text-[14px] font-medium hover:bg-[#2a2a2a] disabled:opacity-50 transition-colors mt-1"
            >
              {loading ? 'Memproses...' : submitLabel}
            </button>
          </form>
        </div>

        {footerLink && (
          <p className="mt-5 text-center text-[13px] text-[#7a7a7a]">
            <a href={footerLink.href} className="text-[#111111] font-medium hover:underline underline-offset-2">
              {footerLink.label}
            </a>
          </p>
        )}
      </div>
    </div>
  )
}

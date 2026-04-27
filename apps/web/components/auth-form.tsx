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
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] bg-[#0d1117] flex-col justify-between p-10 relative overflow-hidden shrink-0">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-[#25D366]/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[#25D366]/8 blur-2xl" />
        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #25D366 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Top: logo */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#25D366] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.115 1.533 5.838L0 24l6.338-1.51A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.787 9.787 0 0 1-5.003-1.368l-.36-.213-3.76.896.952-3.653-.235-.374A9.76 9.76 0 0 1 2.182 12C2.182 6.575 6.575 2.182 12 2.182S21.818 6.575 21.818 12 17.425 21.818 12 21.818z"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight">Blastify</span>
        </div>

        {/* Middle: headline */}
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-[#25D366]/15 border border-[#25D366]/25 rounded-full px-3 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
            <span className="text-[#25D366] text-[12px] font-medium">WhatsApp Broadcast Platform</span>
          </div>
          <h2 className="text-white text-3xl font-bold leading-tight tracking-tight">
            Kirim pesan<br />ke ribuan kontak<br />
            <span className="text-[#25D366]">dalam sekejap.</span>
          </h2>
          <p className="text-[#6b7280] text-[14px] leading-relaxed">
            Platform broadcast WA profesional dengan multi-sender, scheduling, dan analytics.
          </p>
        </div>

        {/* Bottom: stats */}
        <div className="relative z-10 flex gap-6">
          {[
            { value: 'Multi', label: 'Sender WA' },
            { value: 'Auto', label: 'Scheduling' },
            { value: 'Live', label: 'Analytics' },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-white font-bold text-lg">{s.value}</p>
              <p className="text-[#6b7280] text-[12px]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center bg-[#f8f8f7] px-6">
        <div className="w-full max-w-[360px]">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="w-7 h-7 rounded-xl bg-[#25D366] flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.115 1.533 5.838L0 24l6.338-1.51A11.93 11.93 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.787 9.787 0 0 1-5.003-1.368l-.36-.213-3.76.896.952-3.653-.235-.374A9.76 9.76 0 0 1 2.182 12C2.182 6.575 6.575 2.182 12 2.182S21.818 6.575 21.818 12 17.425 21.818 12 21.818z"/>
              </svg>
            </div>
            <span className="font-semibold text-[15px] text-[#111111]">Blastify</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#111111] tracking-tight">{title}</h1>
            <p className="text-[13px] text-[#7a7a7a] mt-1">Masuk untuk melanjutkan ke dashboard</p>
          </div>

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="text-[13px] font-medium text-[#111111]">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="nama@email.com"
                className="w-full h-11 px-3.5 rounded-xl border border-[#e8e8e6] bg-white text-[14px] text-[#111111] placeholder:text-[#c0c0c0] shadow-sm outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/15 transition-all"
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
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full h-11 px-3.5 pr-11 rounded-xl border border-[#e8e8e6] bg-white text-[14px] text-[#111111] placeholder:text-[#c0c0c0] shadow-sm outline-none focus:border-[#25D366] focus:ring-2 focus:ring-[#25D366]/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#b0b0b0] hover:text-[#7a7a7a] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 text-[13px] text-red-600 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5">
                <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[#111111] text-white text-[14px] font-semibold hover:bg-[#25D366] disabled:opacity-50 transition-colors duration-200 mt-2"
            >
              {loading ? 'Memproses...' : submitLabel}
            </button>
          </form>

          {footerLink && (
            <p className="mt-6 text-center text-[13px] text-[#7a7a7a]">
              <a href={footerLink.href} className="text-[#111111] font-medium hover:text-[#25D366] transition-colors underline underline-offset-2">
                {footerLink.label}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

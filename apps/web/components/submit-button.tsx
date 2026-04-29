'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'

const Spinner = () => (
  <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
  </svg>
)

interface Props {
  children: React.ReactNode
  pendingText?: string
  className?: string
}

export function SubmitButton({ children, pendingText, className }: Props) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending} className={`inline-flex items-center gap-1.5 ${className ?? ''}`}>
      {pending && <Spinner />}
      {pending && pendingText ? pendingText : children}
    </Button>
  )
}

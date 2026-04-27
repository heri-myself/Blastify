'use client'

import { useState, useRef } from 'react'

interface Props {
  name: string
  defaultValue?: string
  required?: boolean
  placeholder?: string
  rows?: number
}

function renderPreview(text: string): string {
  // Spintax: show first option
  let out = text.replace(/\{([^}|]+)(\|[^}]*)?\}/g, (_, first) => first)
  // WhatsApp formatting
  out = out
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')
    .replace(/~([^~\n]+)~/g, '<s>$1</s>')
    .replace(/```([\s\S]+?)```/g, '<code class="font-mono bg-[#f2f2f0] px-1 rounded text-[12px]">$1</code>')
    .replace(/\n/g, '<br>')
  return out
}

const toolbarButtons = [
  { label: 'B', title: 'Bold (*teks*)', before: '*', style: 'font-bold' },
  { label: 'I', title: 'Italic (_teks_)', before: '_', style: 'italic' },
  { label: 'S', title: 'Coret (~teks~)', before: '~', style: 'line-through' },
  { label: '<>', title: 'Monospace (```teks```)', before: '```', style: 'font-mono text-[11px]' },
]

export function WhatsAppEditor({ name, defaultValue = '', required, placeholder, rows = 5 }: Props) {
  const [value, setValue] = useState(defaultValue)
  const ref = useRef<HTMLTextAreaElement>(null)

  function wrap(before: string) {
    const el = ref.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const selected = value.slice(start, end)
    const after = before === '```' ? '```' : before
    const newVal = value.slice(0, start) + before + selected + after + value.slice(end)
    setValue(newVal)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  return (
    <div className="space-y-1.5">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-[#f8f8f7] rounded-t-lg border border-[#e8e8e6] border-b-0">
        {toolbarButtons.map(btn => (
          <button
            key={btn.label}
            type="button"
            title={btn.title}
            onClick={() => wrap(btn.before)}
            className={`w-7 h-7 rounded flex items-center justify-center text-[13px] text-[#444] hover:bg-[#e8e8e6] transition-colors ${btn.style}`}
          >
            {btn.label}
          </button>
        ))}
        <div className="w-px h-4 bg-[#e8e8e6] mx-1" />
        <span className="text-[11px] text-[#a0a0a0]">Spintax: {'{opsi1|opsi2}'}</span>
      </div>

      {/* Textarea */}
      <textarea
        ref={ref}
        name={name}
        value={value}
        onChange={e => setValue(e.target.value)}
        required={required}
        placeholder={placeholder}
        rows={rows}
        className="w-full rounded-b-lg rounded-t-none border border-[#e8e8e6] px-3 py-2 text-[13px] text-[#111111] placeholder-[#a0a0a0] focus:outline-none focus:ring-1 focus:ring-[#111111] resize-y font-mono"
      />

      {/* Preview */}
      {value.trim() && (
        <div className="mt-2">
          <p className="text-[11px] font-medium text-[#a0a0a0] uppercase tracking-wider mb-1.5">Preview Pesan WA</p>
          <div className="bg-[#dcf8c6] rounded-xl rounded-tr-none px-4 py-3 text-[13px] text-[#111111] leading-relaxed max-w-sm shadow-sm">
            <div dangerouslySetInnerHTML={{ __html: renderPreview(value) }} />
          </div>
        </div>
      )}
    </div>
  )
}

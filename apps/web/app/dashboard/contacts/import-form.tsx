'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Button } from '@/components/ui/button'
import { importContacts } from './actions'

export function ImportForm() {
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setStatus('Membaca file...')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Array<{ phone: string; name?: string; tags?: string }>
        setStatus(`Mengimpor ${rows.length} kontak...`)
        const result = await importContacts(rows)
        if (result.error) {
          setStatus(`Error: ${result.error}`)
        } else {
          setStatus(`Berhasil import ${result.count} kontak`)
        }
        setLoading(false)
        if (inputRef.current) inputRef.current.value = ''
      },
    })
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        id="csv-upload"
        onChange={handleFile}
        disabled={loading}
      />
      <label htmlFor="csv-upload"
        className={`inline-flex items-center justify-center rounded-lg border border-border bg-background h-8 px-2.5 text-sm font-medium transition-all cursor-pointer hover:bg-muted ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        {loading ? 'Mengimpor...' : 'Import CSV'}
      </label>
      {status && <span className="text-sm text-gray-500">{status}</span>}
    </div>
  )
}

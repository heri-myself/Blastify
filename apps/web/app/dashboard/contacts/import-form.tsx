'use client'

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { importContacts } from './actions'

export function ImportForm() {
  const [status, setStatus] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    setIsError(false)
    setStatus('Membaca file...')

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      complete: async (results) => {
        // Normalize column names to lowercase so CSV headers like "Phone", "PHONE", "Nomor" etc. work
        const rawRows = results.data as Array<Record<string, string>>
        const rows = rawRows.map(row => {
          const normalized: Record<string, string> = {}
          for (const key of Object.keys(row)) {
            normalized[key.toLowerCase().trim()] = row[key]
          }
          // Also map common Indonesian/alternative column names to standard keys
          return {
            phone: String(normalized['phone'] || normalized['nomor'] || normalized['no_hp'] || normalized['no hp'] || normalized['handphone'] || normalized['whatsapp'] || normalized['wa'] || ''),
            name: normalized['name'] || normalized['nama'] || undefined,
            tags: normalized['tags'] || normalized['tag'] || normalized['label'] || undefined,
          }
        }).filter(r => r.phone?.trim())
        if (rows.length === 0) {
          setStatus('File CSV kosong atau format tidak sesuai. Pastikan ada kolom "phone" / "nomor" / "no_hp"')
          setIsError(true)
          setLoading(false)
          return
        }
        setStatus(`Mengimpor ${rows.length} kontak...`)
        try {
          const result = await importContacts(rows)
          if (result?.error) {
            setStatus(`Error: ${result.error}`)
            setIsError(true)
          } else {
            setStatus(`✓ Berhasil import ${result?.count ?? rows.length} kontak`)
            setIsError(false)
            // Refresh halaman agar list kontak terupdate
            setTimeout(() => window.location.reload(), 800)
          }
        } catch (err) {
          setStatus(`Error: ${err instanceof Error ? err.message : 'Terjadi kesalahan'}`)
          setIsError(true)
        }
        setLoading(false)
        if (inputRef.current) inputRef.current.value = ''
      },
      error: (err) => {
        setStatus(`Error baca CSV: ${err.message}`)
        setIsError(true)
        setLoading(false)
      }
    })
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        id="csv-upload"
        onChange={handleFile}
        disabled={loading}
      />
      <label
        htmlFor="csv-upload"
        className={`inline-flex items-center justify-center h-9 px-4 rounded-lg border border-[#e8e8e6] bg-white text-[13px] font-medium transition-colors cursor-pointer hover:bg-[#f8f8f7] ${loading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        {loading ? 'Mengimpor...' : 'Import CSV'}
      </label>
      {status && (
        <span className={`text-[13px] ${isError ? 'text-red-500' : 'text-[#25D366]'}`}>
          {status}
        </span>
      )}
    </div>
  )
}

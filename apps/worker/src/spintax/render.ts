/**
 * Render pesan dengan spintax dan variabel kontak.
 * Spintax: {opsi1|opsi2|opsi3} → pilih satu secara acak
 * Variabel: {nama} → diganti dari contactData
 */
export function renderMessage(
  template: string,
  contactData: Record<string, string>
): string {
  let result = resolveSpintax(template)

  for (const [key, value] of Object.entries(contactData)) {
    result = result.replaceAll(`{${key}}`, value)
  }

  result = result.replace(/\{[^|{}]+\}/g, '')

  return result.trim()
}

function resolveSpintax(text: string): string {
  const pattern = /\{([^{}]+)\}/g
  let result = text
  let match: RegExpExecArray | null

  while ((match = pattern.exec(result)) !== null) {
    const full = match[0]
    const inner = match[1]

    if (inner.includes('|')) {
      const options = inner.split('|')
      const chosen = options[Math.floor(Math.random() * options.length)]
      result = result.replace(full, chosen)
      pattern.lastIndex = 0
    }
  }

  return result
}

const TAG_PALETTES = [
  { bg: 'bg-violet-100', text: 'text-violet-700', dot: 'bg-violet-400' },
  { bg: 'bg-sky-100',    text: 'text-sky-700',    dot: 'bg-sky-400' },
  { bg: 'bg-emerald-100',text: 'text-emerald-700',dot: 'bg-emerald-400' },
  { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  { bg: 'bg-rose-100',   text: 'text-rose-700',   dot: 'bg-rose-400' },
  { bg: 'bg-cyan-100',   text: 'text-cyan-700',   dot: 'bg-cyan-400' },
  { bg: 'bg-fuchsia-100',text: 'text-fuchsia-700',dot: 'bg-fuchsia-400' },
  { bg: 'bg-lime-100',   text: 'text-lime-700',   dot: 'bg-lime-400' },
  { bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-400' },
  { bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-400' },
]

function hashTag(tag: string): number {
  let h = 0
  for (let i = 0; i < tag.length; i++) {
    h = (h * 31 + tag.charCodeAt(i)) >>> 0
  }
  return h % TAG_PALETTES.length
}

export function getTagColor(tag: string) {
  return TAG_PALETTES[hashTag(tag)]
}

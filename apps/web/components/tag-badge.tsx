import { getTagColor } from '@/lib/tag-color'

export function TagBadge({ tag }: { tag: string }) {
  const { bg, text, dot } = getTagColor(tag)
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-medium ${bg} ${text}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {tag}
    </span>
  )
}

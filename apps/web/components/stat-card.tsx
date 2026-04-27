interface StatCardProps {
  title: string
  value: string | number
  description?: string
}

export function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-[#e8e8e6] p-5 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#25D366]" />
      <p className="text-[12px] font-medium text-[#7a7a7a] uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold text-[#111111] mt-2 tabular-nums">{value}</p>
      {description && <p className="text-[12px] text-[#a0a0a0] mt-1">{description}</p>}
    </div>
  )
}

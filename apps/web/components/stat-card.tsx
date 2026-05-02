interface StatCardProps {
  title: string
  value: string | number
  description?: string
}

export function StatCard({ title, value, description }: StatCardProps) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 relative overflow-hidden group hover:border-accent/30 transition-colors duration-300">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent" />
      <p className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
      <p className="text-3xl font-bold text-foreground mt-2 tabular-nums">{value}</p>
      {description && <p className="text-[12px] text-muted-foreground mt-1">{description}</p>}
    </div>
  )
}

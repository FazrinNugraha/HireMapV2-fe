type MetricProps = {
  label: string
  value: string
}

export function Metric({ label, value }: MetricProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-3">
      <span className="text-white/55">{label}</span>
      <strong className="text-right font-semibold">{value}</strong>
    </div>
  )
}


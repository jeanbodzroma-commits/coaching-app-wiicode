import { cn } from '../../utils/cn'

/**
 * Shared recharts tooltip — white card, ink text, accent dot per series.
 * Pass to a chart via `content={<ChartTooltip />}`.
 */
export default function ChartTooltip({ active, payload, label, formatter, labelFormatter, className }) {
  if (!active || !payload?.length) return null
  return (
    <div className={cn('pointer-events-none rounded-xl bg-surface px-3 py-2 shadow-elevated border border-ink-200', className)}>
      {label !== undefined && (
        <p className="text-caption font-medium text-ink-700">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}
      <ul className="mt-1 space-y-1">
        {payload.map((entry, i) => (
          <li key={`${entry.dataKey}-${i}`} className="flex items-center gap-2 text-body">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: entry.color }} aria-hidden="true" />
            <span className="text-ink-500">{entry.name}</span>
            <span className="ml-auto font-semibold text-ink-900">
              {formatter ? formatter(entry.value, entry.name) : entry.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

ChartTooltip.displayName = 'ChartTooltip'

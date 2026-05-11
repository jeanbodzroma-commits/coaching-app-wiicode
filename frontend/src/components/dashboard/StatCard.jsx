import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useCountUp } from '../../hooks/useCountUp'
import { Card } from '../ui'
import { cn } from '../../utils/cn'

const ICON_TONE = {
  primary: 'bg-primary-50 text-primary-700',
  accent:  'bg-accent-50  text-accent-700',
  success: 'bg-green-100  text-green-700',
  warning: 'bg-amber-100  text-amber-700',
  danger:  'bg-red-100    text-red-700',
  info:    'bg-blue-100   text-blue-700',
  neutral: 'bg-ink-200    text-ink-700',
}

/**
 * Stat tile with animated counter, icon and optional trend.
 *
 * @typedef {object} StatCardProps
 * @property {React.ReactNode} [icon]
 * @property {number} value
 * @property {string} [suffix]    e.g. '%'
 * @property {number} [decimals]  passed to useCountUp
 * @property {string} label
 * @property {'primary'|'accent'|'success'|'warning'|'danger'|'info'|'neutral'} [tone]
 * @property {{ value: number, direction?: 'up'|'down'|'flat', period?: string }} [trend]
 * @property {string} [className]
 */
export default function StatCard({
  icon,
  value,
  suffix = '',
  decimals = 0,
  label,
  tone = 'primary',
  trend,
  className,
}) {
  const display = useCountUp(value || 0, { decimals })

  const TrendIcon = trend?.direction === 'down' ? TrendingDown
    : trend?.direction === 'flat' ? Minus
    : TrendingUp

  const trendColor = trend?.direction === 'down' ? 'text-danger-500'
    : trend?.direction === 'flat' ? 'text-ink-500'
    : 'text-success-500'

  return (
    <Card padding="md" className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-caption font-medium uppercase tracking-wide text-ink-500">{label}</p>
          <p className="mt-2 font-heading text-[2.25rem] font-semibold leading-none text-ink-900">
            {Number.isFinite(display) ? display.toLocaleString('fr-FR') : '—'}
            {suffix && <span className="ml-0.5 text-h2 text-ink-500">{suffix}</span>}
          </p>
          {trend && (
            <p className={cn('mt-2 inline-flex items-center gap-1 text-caption font-medium', trendColor)}>
              <TrendIcon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
              <span>
                {trend.value > 0 && trend.direction === 'up' && '+'}{trend.value}
                {trend.period && <span className="ml-1 text-ink-500 font-normal">{trend.period}</span>}
              </span>
            </p>
          )}
        </div>
        {icon && (
          <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', ICON_TONE[tone])}>
            {icon}
          </span>
        )}
      </div>
    </Card>
  )
}

StatCard.displayName = 'StatCard'

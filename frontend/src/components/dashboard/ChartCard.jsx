import { Card } from '../ui'
import { cn } from '../../utils/cn'

/**
 * Standard wrapper around a chart with title, optional subtitle, and footer.
 *
 * @typedef {object} ChartCardProps
 * @property {string} title
 * @property {string} [subtitle]
 * @property {React.ReactNode} [action]   Top-right slot (e.g. period selector).
 * @property {React.ReactNode} children
 * @property {React.ReactNode} [footer]
 * @property {string} [className]
 * @property {string} [bodyClassName]
 */
export default function ChartCard({ title, subtitle, action, children, footer, className, bodyClassName }) {
  return (
    <Card padding="md" className={cn('flex flex-col gap-4', className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-h3 font-heading font-semibold text-ink-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-caption text-ink-500">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </header>
      <div className={cn('min-w-0', bodyClassName)}>{children}</div>
      {footer && <footer className="border-t border-ink-200 pt-3 text-caption text-ink-500">{footer}</footer>}
    </Card>
  )
}

ChartCard.displayName = 'ChartCard'

import { cn } from '../../utils/cn'

const VARIANTS = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-700',
  danger:  'bg-red-100 text-red-700',
  info:    'bg-blue-100 text-blue-700',
  neutral: 'bg-ink-200 text-ink-700',
  accent:  'bg-accent-100 text-accent-700',
  primary: 'bg-primary-100 text-primary-700',
}

const SIZES = {
  sm: 'px-2 py-0.5 text-caption',
  md: 'px-2.5 py-1 text-body',
}

/**
 * Status badge.
 * @typedef {object} BadgeProps
 * @property {'success'|'warning'|'danger'|'info'|'neutral'|'accent'|'primary'} [variant]
 * @property {'sm'|'md'} [size]
 * @property {string} [className]
 * @property {React.ReactNode} children
 */
export default function Badge({ variant = 'neutral', size = 'sm', className, children, ...rest }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium whitespace-nowrap',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      {children}
    </span>
  )
}

Badge.displayName = 'Badge'

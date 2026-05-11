import { cn } from '../../utils/cn'

/**
 * Loading placeholder with shimmer animation.
 * @typedef {object} SkeletonProps
 * @property {string} [className]
 * @property {'rect'|'circle'|'text'} [shape]
 */
export default function Skeleton({ className, shape = 'rect', ...rest }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'block animate-shimmer bg-[length:200%_100%]',
        'bg-gradient-to-r from-ink-200/50 via-accent-100/40 to-ink-200/50',
        shape === 'circle' && 'rounded-full',
        shape === 'text'   && 'rounded-md h-4',
        shape === 'rect'   && 'rounded-xl',
        className
      )}
      {...rest}
    />
  )
}

Skeleton.displayName = 'Skeleton'

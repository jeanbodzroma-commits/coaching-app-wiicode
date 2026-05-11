import { cn } from '../../utils/cn'

/**
 * Inline loading spinner.
 * @param {object} props
 * @param {'xs'|'sm'|'md'|'lg'} [props.size]
 * @param {string} [props.className]
 */
export default function Spinner({ size = 'sm', className }) {
  const dim = { xs: 'h-3 w-3', sm: 'h-4 w-4', md: 'h-5 w-5', lg: 'h-6 w-6' }[size]
  return (
    <svg
      className={cn('animate-spin', dim, className)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

Spinner.displayName = 'Spinner'

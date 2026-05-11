import { cn } from '../../utils/cn'

const SIZES = {
  xs: 'h-6 w-6 text-caption',
  sm: 'h-8 w-8 text-caption',
  md: 'h-10 w-10 text-body',
  lg: 'h-14 w-14 text-body-md',
  xl: 'h-20 w-20 text-h3',
}

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p[0]?.toUpperCase()).join('')
}

/**
 * Avatar — image if `src`, otherwise initials on primary tint.
 * @typedef {object} AvatarProps
 * @property {string} [src]
 * @property {string} [alt]
 * @property {string} [name]   Used to derive initials when no src.
 * @property {'xs'|'sm'|'md'|'lg'|'xl'} [size]
 * @property {string} [className]
 */
export default function Avatar({ src, alt, name, size = 'md', className, ...rest }) {
  const base = cn(
    'inline-flex items-center justify-center rounded-full font-heading font-semibold select-none shrink-0',
    SIZES[size],
    className
  )

  if (src) {
    return (
      <img
        src={src}
        alt={alt ?? name ?? ''}
        className={cn(base, 'object-cover bg-ink-200')}
        {...rest}
      />
    )
  }

  return (
    <span
      role="img"
      aria-label={alt ?? name ?? 'avatar'}
      className={cn(base, 'bg-primary-100 text-primary-700')}
      {...rest}
    >
      {initials(name)}
    </span>
  )
}

Avatar.displayName = 'Avatar'

import { forwardRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../utils/cn'
import Spinner from './Spinner'

const VARIANTS = {
  // Teal → orange ambré au hover, texte blanc en permanence
  primary:
    'bg-primary-700 text-white hover:bg-accent-600 focus-visible:ring-primary-500 disabled:bg-primary-700/50 disabled:hover:bg-primary-700/50',
  // Orange ambré → teal au hover, texte blanc en permanence (fond accent-600 pour la lisibilité)
  accent:
    'bg-accent-600 text-white hover:bg-primary-700 focus-visible:ring-accent-500 disabled:bg-accent-600/60',
  ghost:
    'bg-transparent text-ink-700 hover:bg-accent-50 hover:text-accent-700 focus-visible:ring-primary-500',
  danger:
    'bg-danger-500 text-white hover:bg-red-600 focus-visible:ring-danger-500 disabled:bg-danger-500/60',
  // Contour teal → rempli orange ambré au hover, texte blanc dès le hover
  outline:
    'border-2 border-primary-700 text-primary-700 bg-transparent hover:bg-accent-600 hover:text-white hover:border-accent-600 focus-visible:ring-primary-500',
}

const SIZES = {
  sm: 'h-9 px-3 text-body gap-1.5',
  md: 'h-11 px-5 text-body-md gap-2',
  lg: 'h-12 px-6 text-body-lg-md gap-2.5',
}

/**
 * Primary action button with motion hover/tap.
 * @typedef {object} ButtonProps
 * @property {'primary'|'accent'|'ghost'|'danger'|'outline'} [variant]
 * @property {'sm'|'md'|'lg'} [size]
 * @property {boolean} [loading]
 * @property {boolean} [fullWidth]
 * @property {React.ReactNode} [leftIcon]
 * @property {React.ReactNode} [rightIcon]
 * @property {string} [className]
 * @property {React.ReactNode} children
 */
const Button = forwardRef(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    leftIcon,
    rightIcon,
    className,
    type = 'button',
    children,
    ...rest
  },
  ref
) {
  const reduced = useReducedMotion()
  const isInactive = disabled || loading
  const glowVariant = variant === 'primary' || variant === 'accent'

  return (
    <motion.button
      ref={ref}
      type={type}
      disabled={isInactive}
      whileHover={
        reduced || isInactive
          ? undefined
          : { scale: 1.02, boxShadow: glowVariant ? '0 0 0 4px rgba(252, 179, 77, 0.25)' : undefined }
      }
      whileTap={reduced || isInactive ? undefined : { scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 220, damping: 24 }}
      className={cn(
        'relative inline-flex items-center justify-center rounded-xl font-heading font-semibold',
        'transition-colors duration-300 ease-out-soft',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        'disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className
      )}
      {...rest}
    >
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <Spinner size={size === 'lg' ? 'md' : 'sm'} />
        </span>
      )}
      <span className={cn('inline-flex items-center gap-[inherit]', loading && 'opacity-0')}>
        {leftIcon}
        {children}
        {rightIcon}
      </span>
    </motion.button>
  )
})

export default Button

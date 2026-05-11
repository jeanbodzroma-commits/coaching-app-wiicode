import { forwardRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { cn } from '../../utils/cn'

const PADDING = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-6 md:p-8',
}

/**
 * Standard card container.
 * @typedef {object} CardProps
 * @property {'none'|'sm'|'md'|'lg'} [padding]
 * @property {boolean} [interactive]  Hover lift + shadow elevated
 * @property {string} [as]            Defaults to 'div'
 * @property {string} [className]
 * @property {React.ReactNode} children
 */
const Card = forwardRef(function Card(
  { padding = 'md', interactive = false, as = 'div', className, children, ...rest },
  ref
) {
  const reduced = useReducedMotion()
  const Component = motion[as] || motion.div

  return (
    <Component
      ref={ref}
      whileHover={reduced || !interactive ? undefined : { y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(
        'bg-surface rounded-xl shadow-card',
        interactive && 'cursor-pointer transition-shadow duration-200 ease-out-soft hover:shadow-elevated',
        PADDING[padding],
        className
      )}
      {...rest}
    >
      {children}
    </Component>
  )
})

export default Card

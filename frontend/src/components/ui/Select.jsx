import { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

/**
 * Native select styled to match the design system.
 * @typedef {object} SelectProps
 * @property {string} [label]
 * @property {string} [error]
 * @property {string} [hint]
 * @property {string} [className]
 * @property {React.ReactNode} children
 */
const Select = forwardRef(function Select(
  { label, error, hint, className, id: idProp, children, ...rest },
  ref
) {
  const reactId = useId()
  const id = idProp || reactId
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-body text-ink-700 font-medium">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full appearance-none rounded-xl border bg-surface pl-3 pr-9 text-body-md text-ink-900',
            'transition-colors duration-150 ease-out-soft',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
            'disabled:bg-ink-50 disabled:text-ink-500 disabled:cursor-not-allowed',
            error ? 'border-danger-500' : 'border-ink-200 hover:border-ink-500/40'
          )}
          {...rest}
        >
          {children}
        </select>
        <ChevronDown
          className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-500 pointer-events-none"
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-caption text-danger-500">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-caption text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
})

export default Select

import { forwardRef, useId } from 'react'
import { cn } from '../../utils/cn'

/**
 * Text input with label, error, and optional left icon.
 * Forwards ref for react-hook-form compatibility.
 * @typedef {object} InputProps
 * @property {string} [label]
 * @property {string} [error]
 * @property {string} [hint]
 * @property {React.ReactNode} [leftIcon]
 * @property {string} [className]
 */
const Input = forwardRef(function Input(
  { label, error, hint, leftIcon, className, id: idProp, type = 'text', ...rest },
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
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full rounded-xl border bg-surface px-3 text-body-md text-ink-900 placeholder:text-ink-500',
            'transition-colors duration-150 ease-out-soft',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
            'disabled:bg-ink-50 disabled:text-ink-500 disabled:cursor-not-allowed',
            error ? 'border-danger-500' : 'border-ink-200 hover:border-ink-500/40',
            leftIcon && 'pl-10'
          )}
          {...rest}
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

export default Input

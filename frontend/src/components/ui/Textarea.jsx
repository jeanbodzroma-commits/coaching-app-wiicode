import { forwardRef, useId } from 'react'
import { cn } from '../../utils/cn'

/**
 * Multi-line textarea with label and error.
 * @typedef {object} TextareaProps
 * @property {string} [label]
 * @property {string} [error]
 * @property {string} [hint]
 * @property {string} [className]
 */
const Textarea = forwardRef(function Textarea(
  { label, error, hint, className, id: idProp, rows = 4, ...rest },
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
      <textarea
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={cn(
          'w-full rounded-xl border bg-surface px-3 py-2.5 text-body-md text-ink-900 placeholder:text-ink-500 resize-y',
          'transition-colors duration-150 ease-out-soft',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
          'disabled:bg-ink-50 disabled:text-ink-500 disabled:cursor-not-allowed',
          error ? 'border-danger-500' : 'border-ink-200 hover:border-ink-500/40'
        )}
        {...rest}
      />
      {error ? (
        <p id={`${id}-error`} className="text-caption text-danger-500">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-caption text-ink-500">{hint}</p>
      ) : null}
    </div>
  )
})

export default Textarea

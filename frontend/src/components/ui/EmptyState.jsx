import { cn } from '../../utils/cn'

/**
 * Reusable empty state placeholder.
 * Pass either an `image` (URL) for a photo-based illustration, or an `icon` element.
 *
 * @typedef {object} EmptyStateProps
 * @property {string} [image]
 * @property {React.ReactNode} [icon]
 * @property {string} title
 * @property {string} [description]
 * @property {React.ReactNode} [action]
 * @property {string} [className]
 */
export default function EmptyState({ image, icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center text-center py-10 px-6', className)}>
      {image && (
        <div className="relative mb-5 h-32 w-32 overflow-hidden rounded-2xl shadow-card">
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-primary-700/60 mix-blend-multiply" />
          {icon && (
            <span className="absolute inset-0 flex items-center justify-center text-white">
              {icon}
            </span>
          )}
        </div>
      )}
      {!image && icon && (
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50 text-primary-700">
          {icon}
        </div>
      )}
      <h3 className="text-h2 font-heading font-semibold text-ink-900">{title}</h3>
      {description && <p className="mt-2 max-w-md text-body-md text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

EmptyState.displayName = 'EmptyState'

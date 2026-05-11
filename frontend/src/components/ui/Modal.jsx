import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

/**
 * Animated modal rendered in a portal.
 * Closes on ESC, backdrop click, or the close button.
 * Locks body scroll while open.
 *
 * @typedef {object} ModalProps
 * @property {boolean} open
 * @property {() => void} onClose
 * @property {string} [title]
 * @property {React.ReactNode} [description]
 * @property {'sm'|'md'|'lg'|'xl'} [size]
 * @property {React.ReactNode} [footer]
 * @property {React.ReactNode} children
 * @property {string} [className]
 * @property {boolean} [dismissible]
 */
export default function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  footer,
  children,
  className,
  dismissible = true,
}) {
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (dismissible && e.key === 'Escape') onClose?.() }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, dismissible, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby={title ? 'modal-title' : undefined}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm"
            onClick={() => dismissible && onClose?.()}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={cn(
              'relative w-full bg-surface rounded-2xl shadow-elevated overflow-hidden',
              SIZES[size],
              className
            )}
          >
            {(title || dismissible) && (
              <header className="flex items-start justify-between gap-4 px-6 pt-6 pb-3">
                <div className="min-w-0">
                  {title && <h2 id="modal-title" className="text-h2 font-heading font-semibold text-ink-900">{title}</h2>}
                  {description && <p className="mt-1 text-body text-ink-500">{description}</p>}
                </div>
                {dismissible && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="-mr-2 -mt-2 rounded-full p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                    aria-label="Fermer"
                  >
                    <X className="h-5 w-5" strokeWidth={1.75} />
                  </button>
                )}
              </header>
            )}

            <div className="px-6 pb-6">
              {children}
            </div>

            {footer && (
              <footer className="border-t border-ink-200 bg-ink-50/40 px-6 py-4 flex flex-wrap items-center justify-end gap-2">
                {footer}
              </footer>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

Modal.displayName = 'Modal'

import { createContext, useCallback, useContext, useEffect, useId, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import { cn } from '../../utils/cn'

const VARIANT = {
  success: { Icon: CheckCircle2,   ring: 'border-green-200', tone: 'text-green-700' },
  error:   { Icon: XCircle,        ring: 'border-red-200',   tone: 'text-red-700' },
  warning: { Icon: AlertTriangle,  ring: 'border-amber-200', tone: 'text-amber-700' },
  info:    { Icon: Info,           ring: 'border-blue-200',  tone: 'text-blue-700' },
}

const ToastContext = createContext(null)

/**
 * Toast provider — wrap your app once.
 * Exposes `useToast()` returning `{ toast, dismiss }`.
 */
export function ToastProvider({ children, defaultDuration = 4000 }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts(curr => curr.filter(t => t.id !== id))
  }, [])

  const toast = useCallback(({ title, message, variant = 'info', duration }) => {
    const id = Math.random().toString(36).slice(2, 10)
    const ttl = duration ?? defaultDuration
    setToasts(curr => [...curr, { id, title, message, variant, ttl }])
    if (ttl > 0) {
      setTimeout(() => dismiss(id), ttl)
    }
    return id
  }, [defaultDuration, dismiss])

  const value = useMemo(() => ({
    toast,
    dismiss,
    success: (title, message, opts) => toast({ ...opts, title, message, variant: 'success' }),
    error:   (title, message, opts) => toast({ ...opts, title, message, variant: 'error' }),
    warning: (title, message, opts) => toast({ ...opts, title, message, variant: 'warning' }),
    info:    (title, message, opts) => toast({ ...opts, title, message, variant: 'info' }),
  }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastPortal toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

function ToastPortal({ toasts, dismiss }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return createPortal(
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
      <AnimatePresence initial={false}>
        {toasts.map(t => (
          <ToastItem key={t.id} {...t} onClose={() => dismiss(t.id)} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}

function ToastItem({ title, message, variant, onClose }) {
  const { Icon, ring, tone } = VARIANT[variant] || VARIANT.info
  const labelId = useId()
  return (
    <motion.div
      role="status"
      aria-labelledby={labelId}
      initial={{ opacity: 0, x: 32, scale: 0.96 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 32, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-2xl border bg-surface px-4 py-3 shadow-elevated',
        ring
      )}
    >
      <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', tone)} strokeWidth={1.75} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p id={labelId} className="text-body-md font-semibold text-ink-900">{title}</p>}
        {message && <p className="text-body text-ink-500 mt-0.5">{message}</p>}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-1 text-ink-500 hover:bg-ink-50 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </motion.div>
  )
}

/**
 * Access the toast API. Must be used inside <ToastProvider>.
 * @returns {{ toast: Function, dismiss: Function, success: Function, error: Function, warning: Function, info: Function }}
 */
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

ToastProvider.displayName = 'ToastProvider'

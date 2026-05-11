import { useId, useState, useRef, cloneElement } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '../../utils/cn'

/**
 * Lightweight tooltip with 300 ms reveal delay.
 * Wraps a single focusable child (cloned to attach handlers).
 *
 * @typedef {object} TooltipProps
 * @property {React.ReactNode} content
 * @property {'top'|'bottom'|'left'|'right'} [placement]
 * @property {number} [delayMs]
 * @property {string} [className]
 * @property {React.ReactElement} children
 */
export default function Tooltip({ content, placement = 'top', delayMs = 300, className, children }) {
  const [open, setOpen] = useState(false)
  const timer = useRef(null)
  const id = useId()

  function show() {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setOpen(true), delayMs)
  }
  function hide() {
    clearTimeout(timer.current)
    setOpen(false)
  }

  const trigger = cloneElement(children, {
    onMouseEnter: show,
    onMouseLeave: hide,
    onFocus: show,
    onBlur: hide,
    'aria-describedby': open ? id : undefined,
  })

  const positions = {
    top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left:   'right-full top-1/2 -translate-y-1/2 mr-2',
    right:  'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <span className="relative inline-flex">
      {trigger}
      <AnimatePresence>
        {open && (
          <motion.span
            id={id}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className={cn(
              'absolute z-50 whitespace-nowrap rounded-lg bg-primary-900 text-white text-caption px-2.5 py-1.5 shadow-elevated',
              positions[placement],
              className
            )}
          >
            {content}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

Tooltip.displayName = 'Tooltip'

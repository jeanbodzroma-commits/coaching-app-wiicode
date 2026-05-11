import { useEffect, useState } from 'react'
import { animate, useMotionValue, useReducedMotion } from 'framer-motion'

/**
 * Animate a numeric value from 0 to `value`.
 * Returns the current rounded display value.
 * Honors prefers-reduced-motion (returns target value immediately).
 *
 * @param {number} value
 * @param {object} [opts]
 * @param {number} [opts.duration=1.2]    Animation duration in seconds.
 * @param {number} [opts.decimals=0]      Decimals to keep (0 → integer).
 * @returns {number}
 */
export function useCountUp(value, { duration = 1.2, decimals = 0 } = {}) {
  const reduced = useReducedMotion()
  const mv = useMotionValue(0)
  const [display, setDisplay] = useState(reduced ? value : 0)

  useEffect(() => {
    if (reduced) { setDisplay(value); return }
    const controls = animate(mv, value, { duration, ease: [0.22, 1, 0.36, 1] })
    const unsub = mv.on('change', v => {
      const f = Math.pow(10, decimals)
      setDisplay(Math.round(v * f) / f)
    })
    return () => { controls.stop(); unsub() }
  }, [value, duration, decimals, mv, reduced])

  return display
}

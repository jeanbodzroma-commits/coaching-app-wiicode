import { useEffect, useState } from 'react'
import { cn } from '../../utils/cn'

/**
 * Lightweight countdown to a Date target.
 * Updates every 30 s — sufficient for jours/heures/minutes resolution.
 *
 * @typedef {object} CountdownProps
 * @property {string|Date} to
 * @property {string} [className]
 */
export default function Countdown({ to, className }) {
  const [now, setNow] = useState(() => Date.now())
  const target = new Date(to).getTime()

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])

  const diff = Math.max(0, target - now)
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)

  if (diff <= 0) {
    return <span className={cn('font-heading font-semibold', className)}>C'est maintenant</span>
  }

  return (
    <span className={cn('flex items-baseline gap-3 font-heading text-white', className)}>
      <Unit value={days} label="j" />
      <Unit value={hours} label="h" />
      <Unit value={minutes} label="min" />
    </span>
  )
}

function Unit({ value, label }) {
  return (
    <span className="flex items-baseline gap-1">
      <span className="text-h1 font-semibold tabular-nums">{value}</span>
      <span className="text-body text-white/70">{label}</span>
    </span>
  )
}

Countdown.displayName = 'Countdown'

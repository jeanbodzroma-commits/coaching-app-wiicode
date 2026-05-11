import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Compose Tailwind class strings with conflict resolution.
 * @param  {...import('clsx').ClassValue} inputs
 * @returns {string}
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

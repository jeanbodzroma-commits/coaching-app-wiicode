import { Skeleton } from '../components/ui'

/**
 * Suspense fallback for lazy-loaded route components.
 * Renders inside the main column, so styling matches the page padding.
 */
export default function RouteFallback() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 mt-4">
        {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  )
}

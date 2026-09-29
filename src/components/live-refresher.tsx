'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

/**
 * Silently re-fetch server data on an interval so live portfolio prices
 * stay current without a manual reload. Uses router.refresh() — a server
 * component re-render with no full page load.
 */
export function LiveRefresher({ intervalMs = 60_000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    // Only tick when the tab is visible — no point refreshing a hidden page.
    let timer: ReturnType<typeof setTimeout> | undefined
    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          router.refresh()
        }
        schedule()
      }, intervalMs)
    }
    schedule()

    return () => clearTimeout(timer)
  }, [router, intervalMs])

  return null
}

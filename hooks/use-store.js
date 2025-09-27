import { useState, useEffect } from 'react'

/**
 * Custom hook for safely accessing Zustand store in Next.js with SSR
 * Prevents hydration mismatch by ensuring store is only accessed on client
 * 
 * @param {Function} store - Zustand store hook
 * @param {Function} selector - Selector function to extract state
 * @returns {*} Selected state or undefined during SSR
 */
export function useStore(store, selector) {
  const result = store(selector)
  const [data, setData] = useState()

  useEffect(() => {
    setData(result)
  }, [result])

  return data
}

/**
 * Hook to check if component is hydrated (client-side ready)
 * 
 * @returns {boolean} True if hydrated, false during SSR/initial render
 */
export function useHydration() {
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)
  }, [])

  return hydrated
}
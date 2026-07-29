'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * True once the element has entered (or come within `rootMargin` of) the
 * viewport, then latched — we use it to defer paid work (Mapbox GL loads),
 * and un-mounting the map again when the user scrolls away would just bill
 * a second load on the way back.
 */
export function useInView<T extends HTMLElement>(rootMargin = '200px') {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return
    // Ancient browsers without IO: just load — never leave the map dead.
    // Can't hoist this into useState's initializer: that runs during SSR too,
    // where IntersectionObserver is always undefined, so every page would
    // render the map eagerly and hydrate mismatched.
    if (typeof IntersectionObserver === 'undefined') {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time latch, no cascade
      setInView(true)
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [inView, rootMargin])

  return { ref, inView }
}

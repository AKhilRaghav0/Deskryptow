import { useEffect } from 'react'

interface ScrollLockProps {
  lock: boolean
}

export default function ScrollLock({ lock }: ScrollLockProps) {
  useEffect(() => {
    const lenis = (window as any).__lenis as any

    if (lock && lenis) {
      lenis.stop()
    } else if (lenis) {
      lenis.start()
    }

    return () => {
      if (lenis && lock) {
        lenis.start()
      }
    }
  }, [lock])

  return null
}

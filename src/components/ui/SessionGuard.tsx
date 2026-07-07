'use client'

/**
 * SessionGuard — keeps the Supabase session alive for 24 hours from last activity.
 * - Stamps `last_active` in localStorage on every user interaction (debounced to once/min)
 * - On mount, if more than 24 h have elapsed since last activity, signs the user out
 * - Runs silently in the background without any UI
 */
import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

const KEY     = 'roamriot_last_active'
const MAX_MS  = 24 * 60 * 60 * 1000   // 24 hours in ms
const STAMP_DEBOUNCE = 60 * 1000       // stamp at most once per minute

export function SessionGuard() {
  const lastStamped = useRef(0)

  useEffect(() => {
    const supabase = createClient()

    // 1. Check inactivity on mount
    const last = Number(localStorage.getItem(KEY) ?? '0')
    if (last > 0 && Date.now() - last > MAX_MS) {
      supabase.auth.signOut().finally(() => {
        window.location.href = '/login?reason=inactivity'
      })
      return
    }

    // 2. Stamp current activity
    function stamp() {
      const now = Date.now()
      if (now - lastStamped.current > STAMP_DEBOUNCE) {
        localStorage.setItem(KEY, String(now))
        lastStamped.current = now
      }
    }

    stamp() // stamp on mount

    // 3. Refresh stamp on any user interaction
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const
    events.forEach(e => window.addEventListener(e, stamp, { passive: true }))

    // 4. Also re-check inactivity whenever the tab becomes visible again
    function onVisibilityChange() {
      if (document.visibilityState === 'visible') {
        const last = Number(localStorage.getItem(KEY) ?? '0')
        if (last > 0 && Date.now() - last > MAX_MS) {
          supabase.auth.signOut().finally(() => {
            window.location.href = '/login?reason=inactivity'
          })
        }
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      events.forEach(e => window.removeEventListener(e, stamp))
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  return null
}

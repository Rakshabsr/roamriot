import { createClient } from '@/lib/supabase/client'

type EventType = 'trip_generated' | 'itinerary_viewed' | 'destination_searched' | 'share_clicked'

interface EventProperties {
  destination?: string
  num_days?: number
  budget?: string
  travelers?: number
  trip_id?: string
  duration_seconds?: number
  share_method?: string
  [key: string]: string | number | boolean | undefined
}

// Fire-and-forget — never throws, never blocks UI
export function trackEvent(
  type: EventType,
  properties: EventProperties = {},
) {
  if (typeof window === 'undefined') return
  try {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      const sid = getSessionId()
      supabase.from('analytics_events').insert({
        event_type:  type,
        user_id:     data.user?.id ?? null,
        session_id:  sid,
        properties,
      }).then(() => {})
    })
  } catch {}
}

function getSessionId(): string {
  const key = 'roamriot_sid'
  let sid = sessionStorage.getItem(key)
  if (!sid) {
    sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
    sessionStorage.setItem(key, sid)
  }
  return sid
}

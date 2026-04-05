/**
 * RoamRiot Analytics
 * Logs usage events to Supabase analytics_events table.
 * All calls are fire-and-forget — never block the UI.
 */

export type AnalyticsEvent =
  | { event: 'trip_generated';    destination: string; num_days: number; budget: string; travelers: number; travel_variant?: string }
  | { event: 'page_view';         page: string; referrer?: string }
  | { event: 'itinerary_viewed';  trip_id: string; destination: string; duration_seconds?: number }
  | { event: 'destination_searched'; destination: string }
  | { event: 'share_clicked';     destination: string }
  | { event: 'activity_deleted';  trip_id: string }
  | { event: 'activity_added';    trip_id: string }
  | { event: 'signup_completed' }
  | { event: 'login_completed' }

/**
 * Track an analytics event. Safe to call from any client component.
 * Silently swallows errors — never crashes the app.
 */
export async function track(payload: AnalyticsEvent): Promise<void> {
  try {
    await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    // Silent — analytics must never break the user flow
  }
}

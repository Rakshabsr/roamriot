import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { fetchTripWithDays } from '@/lib/supabase/queries'
import PrintActions from './PrintActions'

export default async function PrintPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/login?redirect=/trips/${params.id}/print`)

  const trip = await fetchTripWithDays(supabase, params.id)
  if (!trip || trip.user_id !== user.id) notFound()

  const { destination, start_date, end_date, days, preferences } = trip

  const totalActivities = days.reduce((s, d) => s + d.activities.length, 0)
  const numDays = days.length

  return (
    <>
      {/* Print-specific global styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { font-size: 12pt; color: #000; background: #fff; }
          .page-break { page-break-before: always; }
          a { text-decoration: none; color: inherit; }
        }
        @media screen {
          body { background: #f8fafc; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 print:bg-white">
        {/* Toolbar — hidden when printing */}
        <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
          <a href={`/trips/${params.id}`} className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
            ← Back to trip
          </a>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{numDays} days · {totalActivities} stops</span>
            <PrintActions />
          </div>
        </div>

        {/* Print body */}
        <div className="max-w-2xl mx-auto px-6 py-10 print:px-0 print:py-0">
          {/* Header */}
          <div className="mb-8 print:mb-6">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">✈️</span>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{destination}</h1>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              {start_date} → {end_date} &nbsp;·&nbsp; {numDays} {numDays === 1 ? 'day' : 'days'} &nbsp;·&nbsp; {totalActivities} stops
            </p>
            {preferences?.travelStyle && (
              <p className="text-slate-400 text-xs mt-1 capitalize">
                {preferences.travelStyle} travel &nbsp;·&nbsp; {preferences.budget ?? 'mid'} budget
                {preferences.dietary && preferences.dietary !== 'none' ? ` · ${preferences.dietary}` : ''}
              </p>
            )}
            <div className="mt-4 border-t border-slate-200 print:border-slate-300" />
          </div>

          {/* Days */}
          {days.map((day, dayIdx) => (
            <div key={day.id} className={dayIdx > 0 ? 'mt-10 print:mt-6' : ''}>
              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Day {day.day_number}</span>
                <h2 className="text-lg font-extrabold text-slate-800">{day.date}</h2>
              </div>

              <div className="space-y-4">
                {day.activities.map((act, i) => {
                  const endMinutes = (() => {
                    const [h, m] = act.start_time.split(':').map(Number)
                    const total = h * 60 + m + act.duration_minutes
                    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
                  })()

                  return (
                    <div key={act.id} className="flex gap-4 print:gap-3">
                      {/* Time column */}
                      <div className="w-20 flex-shrink-0 pt-0.5">
                        <p className="text-sm font-bold text-slate-700">{act.start_time}</p>
                        <p className="text-xs text-slate-400">→ {endMinutes}</p>
                      </div>

                      {/* Content */}
                      <div className="flex-1 pb-4 border-b border-slate-100 print:border-slate-200 last:border-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-bold text-slate-900 text-sm leading-tight">{act.name}</p>
                            {act.location && (
                              <p className="text-xs text-slate-400 mt-0.5">{act.location}</p>
                            )}
                          </div>
                          <div className="flex-shrink-0 flex flex-col items-end gap-1">
                            {act.price_range && (
                              <span className="text-xs bg-slate-100 print:bg-transparent print:border print:border-slate-300 text-slate-600 px-2 py-0.5 rounded-full">{act.price_range}</span>
                            )}
                            {act.rating && (
                              <span className="text-xs text-amber-500">★ {act.rating.toFixed(1)}</span>
                            )}
                          </div>
                        </div>

                        {act.description && (
                          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{act.description}</p>
                        )}

                        {act.tips && (
                          <p className="text-xs text-amber-700 bg-amber-50 print:bg-transparent print:border-l-2 print:border-amber-400 mt-2 px-2 py-1 rounded-lg print:rounded-none">
                            Tip: {act.tips}
                          </p>
                        )}

                        {act.notes && (
                          <p className="text-xs text-slate-600 italic mt-1.5 pl-2 border-l-2 border-sea-300">
                            Note: {act.notes}
                          </p>
                        )}

                        {/* Duration chip */}
                        <p className="text-[10px] text-slate-400 mt-1.5">
                          {act.duration_minutes >= 60
                            ? `${Math.floor(act.duration_minutes / 60)}h ${act.duration_minutes % 60 > 0 ? `${act.duration_minutes % 60}m` : ''}`.trim()
                            : `${act.duration_minutes}m`
                          }
                          {act.category ? ` · ${act.category}` : ''}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Day separator — print only */}
              {dayIdx < days.length - 1 && (
                <div className="hidden print:block print:mt-6 print:border-t-2 print:border-slate-300" />
              )}
            </div>
          ))}

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-200 text-center print:mt-8">
            <p className="text-xs text-slate-400">Generated with RoamRiot · roamriot.app</p>
            <p className="text-xs text-slate-300 mt-1">Printed on {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </>
  )
}

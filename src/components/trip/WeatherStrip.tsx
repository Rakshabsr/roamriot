'use client'

import { useEffect, useState } from 'react'
import { Cloud, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DayForecast {
  date: string
  maxTemp: number
  minTemp: number
  rainChance: number
  windspeed: number
  code: number
}

// WMO weather code → emoji + label
function weatherInfo(code: number): { emoji: string; label: string } {
  if (code === 0)                       return { emoji: '☀️', label: 'Clear' }
  if (code <= 2)                        return { emoji: '⛅', label: 'Partly cloudy' }
  if (code === 3)                       return { emoji: '☁️', label: 'Overcast' }
  if (code <= 49)                       return { emoji: '🌫️', label: 'Foggy' }
  if (code <= 57)                       return { emoji: '🌧️', label: 'Drizzle' }
  if (code <= 67)                       return { emoji: '🌧️', label: 'Rain' }
  if (code <= 77)                       return { emoji: '❄️', label: 'Snow' }
  if (code <= 82)                       return { emoji: '🌦️', label: 'Showers' }
  if (code <= 86)                       return { emoji: '🌨️', label: 'Snow showers' }
  if (code === 95)                      return { emoji: '⛈️', label: 'Thunderstorm' }
  if (code >= 96)                       return { emoji: '⛈️', label: 'Severe storm' }
  return { emoji: '🌡️', label: 'Unknown' }
}

function shortDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en', { weekday: 'short', day: 'numeric' })
}

export function WeatherStrip({ destination, startDate, endDate }: {
  destination: string
  startDate: string
  endDate: string
}) {
  const [forecast, setForecast] = useState<DayForecast[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(false)
  const [expanded, setExpanded] = useState(false)

  const days = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000) + 1)

  useEffect(() => {
    fetch(`/api/weather?destination=${encodeURIComponent(destination)}&days=${Math.min(days + 1, 14)}`)
      .then(r => r.json())
      .then(d => {
        if (d.forecast) {
          // Slice to trip date range only
          const tripDates = d.forecast.filter((f: DayForecast) => f.date >= startDate && f.date <= endDate)
          setForecast(tripDates.length > 0 ? tripDates : d.forecast.slice(0, days))
        } else {
          setError(true)
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [destination, startDate, endDate, days])

  if (error) return null // silent fail — don't clutter the UI

  return (
    <div className="mx-4 mb-3">
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-sea-50 dark:bg-sea-900/20 border border-sea-100 dark:border-sea-800/40 hover:bg-sea-100 dark:hover:bg-sea-900/30 transition-all"
      >
        <Cloud size={14} className="text-sea-500 dark:text-sea-400 flex-shrink-0" />
        <span className="text-xs font-bold text-sea-700 dark:text-sea-300 flex-1 text-left">
          {loading ? 'Loading weather…' : `${destination.split(',')[0]} weather during your trip`}
        </span>
        {loading && <Loader2 size={12} className="animate-spin text-sea-400" />}
        {!loading && forecast.length > 0 && (
          <span className="text-xs text-sea-500 dark:text-sea-400">
            {weatherInfo(forecast[0].code).emoji} {forecast[0].maxTemp}°C
          </span>
        )}
        {!loading && (
          <span className="text-[10px] text-sea-400 dark:text-sea-600">{expanded ? '▲' : '▼'}</span>
        )}
      </button>

      {expanded && !loading && forecast.length > 0 && (
        <div className="mt-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 pb-1 min-w-max">
            {forecast.map(day => {
              const { emoji, label } = weatherInfo(day.code)
              return (
                <div key={day.date}
                  className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl bg-white dark:bg-[#111a18] border border-sea-100 dark:border-[#1e2f2b] shadow-soft min-w-[72px]">
                  <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 text-center">{shortDate(day.date)}</p>
                  <span className="text-2xl" title={label}>{emoji}</span>
                  <p className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{day.maxTemp}°</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{day.minTemp}° low</p>
                  {day.rainChance > 30 && (
                    <p className="text-[10px] font-bold text-sea-600 dark:text-sea-400">
                      {day.rainChance}% rain
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {expanded && !loading && forecast.length === 0 && (
        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-3">
          Weather data unavailable for this destination.
        </p>
      )}
    </div>
  )
}

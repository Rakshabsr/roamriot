import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, differenceInDays, addDays, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, fmt = 'EEE, MMM d') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt)
}

export function getTripDays(startDate: string, endDate: string): number {
  return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1
}

export function getDayDates(startDate: string, numDays: number): string[] {
  return Array.from({ length: numDays }, (_, i) =>
    format(addDays(parseISO(startDate), i), 'yyyy-MM-dd')
  )
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`
}

export function categoryColor(category: string): string {
  const map: Record<string, string> = {
    food:          'bg-orange-100 text-orange-700',
    attraction:    'bg-blue-100 text-blue-700',
    transport:     'bg-slate-100 text-slate-600',
    accommodation: 'bg-purple-100 text-purple-700',
    experience:    'bg-green-100 text-green-700',
    essentials:    'bg-red-100 text-red-700',
  }
  return map[category] ?? 'bg-gray-100 text-gray-600'
}

export function categoryIcon(category: string): string {
  const map: Record<string, string> = {
    food: '🍽️',
    attraction: '📍',
    transport: '🚌',
    accommodation: '🏨',
    experience: '✨',
    essentials: '💊',
  }
  return map[category] ?? '📌'
}

export function budgetLabel(budget: string): string {
  return { budget: 'Budget', mid: 'Mid-range', splurge: 'Splurge' }[budget] ?? budget
}

export function dietaryLabel(dietary: string): string {
  return {
    none: 'No restriction',
    vegetarian: 'Vegetarian',
    vegan: 'Vegan',
    jain: 'Jain',
  }[dietary] ?? dietary
}

export function youtubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`
}

export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Plus, Trash2, Wallet, TrendingUp, AlertCircle, Check, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ExpenseCategory } from '@/lib/types'

interface Expense {
  id: string
  description: string
  amount: number
  category: ExpenseCategory
  day_number: number
  currency: string
}

interface TripMeta {
  destination: string
  start_date: string
  end_date: string
  preferences: { budget: string }
}

const CATEGORY_CONFIG: Record<ExpenseCategory, { label: string; emoji: string; color: string; bg: string }> = {
  food:          { label: 'Food',       emoji: '🍽️', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
  transport:     { label: 'Transport',  emoji: '🚌', color: 'text-slate-600',  bg: 'bg-slate-50 border-slate-100'  },
  accommodation: { label: 'Stay',       emoji: '🏨', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100' },
  shopping:      { label: 'Shopping',   emoji: '🛍️', color: 'text-pink-600',   bg: 'bg-pink-50 border-pink-100'   },
  activities:    { label: 'Activities', emoji: '✨', color: 'text-sage-600',   bg: 'bg-sage-50 border-sage-100'   },
  other:         { label: 'Other',      emoji: '📌', color: 'text-slate-500',  bg: 'bg-slate-50 border-slate-100'  },
}

const BUDGET_DEFAULTS: Record<string, number> = {
  budget: 3000,
  mid: 7000,
  comfort: 14000,
  splurge: 25000,
}

function numDaysFromDates(start: string, end: string) {
  return Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86_400_000) + 1)
}

function ExpensesInner() {
  const searchParams = useSearchParams()
  const tripId = searchParams.get('tripId')

  const [trip, setTrip]           = useState<TripMeta | null>(null)
  const [expenses, setExpenses]   = useState<Expense[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)

  const [budget, setBudget]       = useState(8000)
  const [editBudget, setEditBudget] = useState(false)
  const [tempBudget, setTempBudget] = useState('8000')
  const [activeDay, setActiveDay] = useState<number | 'all'>('all')
  const [showAdd, setShowAdd]     = useState(false)

  const [desc, setDesc]     = useState('')
  const [amount, setAmount] = useState('')
  const [cat, setCat]       = useState<ExpenseCategory>('food')
  const [day, setDay]       = useState(1)

  const backHref = tripId ? `/trips/${tripId}` : '/dashboard'

  // Load trip metadata + expenses
  useEffect(() => {
    async function load() {
      if (!tripId) {
        setLoading(false)
        return
      }
      try {
        const [tripRes, expRes] = await Promise.all([
          fetch(`/api/trips/${tripId}/meta`),
          fetch(`/api/trips/${tripId}/expenses`),
        ])
        if (tripRes.ok) {
          const t = await tripRes.json()
          setTrip(t.trip)
          const defaultBudget = BUDGET_DEFAULTS[t.trip?.preferences?.budget ?? 'mid'] ?? 7000
          setBudget(defaultBudget)
          setTempBudget(String(defaultBudget))
        }
        if (expRes.ok) {
          const e = await expRes.json()
          setExpenses(e.expenses ?? [])
        }
      } catch {
        // offline or no session — keep empty state
      }
      setLoading(false)
    }
    load()
  }, [tripId])

  const numDays = trip
    ? numDaysFromDates(trip.start_date, trip.end_date)
    : Math.max(...expenses.map(e => e.day_number), 3)

  const filtered   = activeDay === 'all' ? expenses : expenses.filter(e => e.day_number === activeDay)
  const total      = filtered.reduce((s, e) => s + e.amount, 0)
  const allTotal   = expenses.reduce((s, e) => s + e.amount, 0)
  const pct        = Math.min(100, Math.round((allTotal / budget) * 100))
  const overBudget = allTotal > budget

  const byCategory = Object.entries(CATEGORY_CONFIG).map(([k, cfg]) => ({
    ...cfg, key: k as ExpenseCategory,
    total: expenses.filter(e => e.category === k).reduce((s, e) => s + e.amount, 0),
  })).filter(c => c.total > 0).sort((a, b) => b.total - a.total)

  const addExpense = useCallback(async () => {
    if (!desc.trim() || !amount) return
    setSaving(true)
    const optimistic: Expense = {
      id: `optimistic-${Date.now()}`,
      description: desc, amount: +amount, category: cat,
      day_number: day, currency: 'INR',
    }
    setExpenses(prev => [...prev, optimistic])
    setDesc(''); setAmount(''); setShowAdd(false)

    if (tripId) {
      try {
        const res = await fetch(`/api/trips/${tripId}/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description: desc, amount: +amount, category: cat, day_number: day }),
        })
        if (res.ok) {
          const { expense } = await res.json()
          setExpenses(prev => prev.map(e => e.id === optimistic.id ? expense : e))
        }
      } catch { /* keep optimistic */ }
    }
    setSaving(false)
  }, [desc, amount, cat, day, tripId])

  const deleteExpense = useCallback(async (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id))
    if (tripId && !id.startsWith('optimistic-')) {
      try {
        await fetch(`/api/trips/${tripId}/expenses/${id}`, { method: 'DELETE' })
      } catch { /* ignore */ }
    }
  }, [tripId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sea-50 to-white flex items-center justify-center">
        <Loader2 className="animate-spin text-sea-500" size={32} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sea-50 to-white">
      {/* Nav */}
      <nav className="bg-white/90 dark:bg-[#111a18]/90 backdrop-blur-xl border-b border-sea-100 dark:border-[#1e2f2b] sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href={backHref} className="btn-ghost text-xs px-3 py-1.5 gap-1.5">
            <ArrowLeft size={13} /> {trip ? trip.destination : 'Back'}
          </Link>
          <span className="font-extrabold text-gradient text-lg">Budget Tracker</span>
          {saving && <Loader2 size={14} className="animate-spin text-sea-400 ml-1" />}
          <div className="ml-auto">
            <button onClick={() => setShowAdd(v => !v)} className="btn-primary text-xs px-4 py-2 gap-1.5">
              <Plus size={13} /> Add expense
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Trip context banner */}
        {trip && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-bold text-slate-800">{trip.destination}</span>
            <span>·</span>
            <span>{numDays} day{numDays > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Budget gauge */}
        <div className={cn('card p-5 shadow-card', overBudget && 'ring-2 ring-red-300')}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1">Total budget</p>
              {editBudget ? (
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-slate-400">₹</span>
                  <input autoFocus type="number" className="input w-32 text-xl font-bold h-9 py-1" value={tempBudget}
                    onChange={e => setTempBudget(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { setBudget(+tempBudget); setEditBudget(false) } if (e.key === 'Escape') setEditBudget(false) }} />
                  <button onClick={() => { setBudget(+tempBudget); setEditBudget(false) }}
                    className="w-7 h-7 bg-sea-500 rounded-full flex items-center justify-center"><Check size={12} className="text-white" /></button>
                  <button onClick={() => setEditBudget(false)}
                    className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center"><X size={12} /></button>
                </div>
              ) : (
                <button onClick={() => { setTempBudget(String(budget)); setEditBudget(true) }}
                  className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 hover:text-sea-600 transition-colors">
                  ₹{budget.toLocaleString('en-IN')}
                </button>
              )}
            </div>
            <div className="text-right">
              <p className={cn('text-3xl font-extrabold', overBudget ? 'text-red-500' : 'text-sea-600')}>
                ₹{allTotal.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-400">spent so far</p>
            </div>
          </div>

          <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div className={cn('h-full rounded-full transition-all duration-500', overBudget ? 'bg-red-400' : 'bg-gradient-to-r from-sea-400 to-sage-400')}
              style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between text-xs font-semibold">
            <span className={overBudget ? 'text-red-500' : 'text-sea-600'}>{pct}% used</span>
            {overBudget
              ? <span className="text-red-500 flex items-center gap-1"><AlertCircle size={11} /> Over by ₹{(allTotal - budget).toLocaleString('en-IN')}</span>
              : <span className="text-sage-600">₹{(budget - allTotal).toLocaleString('en-IN')} remaining</span>
            }
          </div>
        </div>

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <div className="card p-5 shadow-soft">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-1.5"><TrendingUp size={14} /> Breakdown by category</p>
            <div className="space-y-2.5">
              {byCategory.map(c => (
                <div key={c.key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-600 dark:text-slate-300 flex items-center gap-1.5">{c.emoji} {c.label}</span>
                    <span className={cn('text-sm font-bold', c.color)}>₹{c.total.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all', c.bg.split(' ')[0].replace('-50', '-400'))}
                      style={{ width: `${Math.min(100, Math.round((c.total / allTotal) * 100))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add expense form */}
        {showAdd && (
          <div className="card p-5 shadow-card animate-fade-up">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2"><Plus size={16} className="text-sea-500" /> New expense</h3>
            <div className="space-y-3">
              <input className="input" placeholder="What did you spend on?" value={desc} onChange={e => setDesc(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input type="number" className="input pl-7" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <select className="input" value={day} onChange={e => setDay(+e.target.value)}>
                  {Array.from({ length: numDays }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>Day {d}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(Object.entries(CATEGORY_CONFIG) as [ExpenseCategory, typeof CATEGORY_CONFIG[ExpenseCategory]][]).map(([k, c]) => (
                  <button key={k} onClick={() => setCat(k)}
                    className={cn('px-2 py-2 rounded-2xl text-xs font-semibold border-2 transition-all text-center',
                      cat === k ? 'border-sea-400 bg-sea-50 text-sea-700' : 'border-slate-200 text-slate-500 dark:text-slate-400 hover:border-sea-200')}>
                    <span className="block text-base mb-0.5">{c.emoji}</span>
                    {c.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowAdd(false)} className="btn-outline flex-1 justify-center">Cancel</button>
                <button onClick={addExpense} disabled={!desc.trim() || !amount} className="btn-primary flex-1 justify-center">Add</button>
              </div>
            </div>
          </div>
        )}

        {/* Day filter tabs */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {(['all', ...Array.from({ length: numDays }, (_, i) => i + 1)] as (number | 'all')[]).map(d => (
            <button key={d} onClick={() => setActiveDay(d)}
              className={cn('flex-shrink-0 px-4 py-2 rounded-2xl text-xs font-bold transition-all',
                activeDay === d ? 'bg-sea-500 text-white shadow-soft' : 'bg-white border border-slate-200 text-slate-500 dark:text-slate-400 hover:border-sea-300')}>
              {d === 'all' ? 'All days' : `Day ${d}`}
            </button>
          ))}
        </div>

        {/* Expenses list */}
        <div className="space-y-2">
          {filtered.length === 0 && (
            <div className="card p-8 text-center text-slate-400 text-sm">
              {expenses.length === 0 ? 'No expenses yet — add your first one!' : 'No expenses for this day.'}
            </div>
          )}
          {filtered.map(e => {
            const cfg = CATEGORY_CONFIG[e.category] ?? CATEGORY_CONFIG.other
            return (
              <div key={e.id} className={cn('card p-4 flex items-center gap-3 shadow-soft border', cfg.bg)}>
                <span className="text-2xl flex-shrink-0">{cfg.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{e.description}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Day {e.day_number} · {cfg.label}</p>
                </div>
                <span className={cn('font-extrabold text-sm flex-shrink-0', cfg.color)}>
                  ₹{Number(e.amount).toLocaleString('en-IN')}
                </span>
                <button onClick={() => deleteExpense(e.id)}
                  className="w-7 h-7 rounded-full hover:bg-red-100 flex items-center justify-center transition-colors group flex-shrink-0">
                  <Trash2 size={12} className="text-slate-300 group-hover:text-red-500" />
                </button>
              </div>
            )
          })}
        </div>

        {filtered.length > 0 && (
          <div className="card p-4 bg-sea-50 border-sea-100 flex justify-between items-center">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">{activeDay === 'all' ? 'Total' : 'Day total'}</span>
            <span className="text-xl font-extrabold text-sea-700">₹{total.toLocaleString('en-IN')}</span>
          </div>
        )}

        {/* No trip context note */}
        {!tripId && (
          <div className="card p-4 bg-amber-50 border-amber-100 text-center text-sm text-amber-700">
            Open Budget Tracker from inside a trip to save expenses automatically.
          </div>
        )}
      </div>
    </div>
  )
}

export default function ExpensesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-sea-50 dark:bg-[#0a0f0e] flex items-center justify-center">
        <Loader2 className="animate-spin text-sea-500" size={32} />
      </div>
    }>
      <ExpensesInner />
    </Suspense>
  )
}

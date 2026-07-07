'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronDown, ArrowLeftRight, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Destination → currency code mapping
const DEST_CURRENCY: Record<string, { code: string; symbol: string; name: string }> = {
  india: { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  japan: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  korea: { code: 'KRW', symbol: '₩', name: 'Korean Won' },
  indonesia: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  bali: { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  thailand: { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  france: { code: 'EUR', symbol: '€', name: 'Euro' },
  portugal: { code: 'EUR', symbol: '€', name: 'Euro' },
  lisbon: { code: 'EUR', symbol: '€', name: 'Euro' },
  paris: { code: 'EUR', symbol: '€', name: 'Euro' },
  singapore: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  dubai: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  uae: { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
  usa: { code: 'USD', symbol: '$', name: 'US Dollar' },
  uk: { code: 'GBP', symbol: '£', name: 'British Pound' },
  london: { code: 'GBP', symbol: '£', name: 'British Pound' },
  australia: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  malaysia: { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  vietnam: { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
  nepal: { code: 'NPR', symbol: 'रू', name: 'Nepalese Rupee' },
  srilanka: { code: 'LKR', symbol: 'Rs', name: 'Sri Lankan Rupee' },
  maldives: { code: 'MVR', symbol: 'Rf', name: 'Maldivian Rufiyaa' },
}

function detectCurrency(destination: string) {
  const d = destination.toLowerCase()
  for (const [key, val] of Object.entries(DEST_CURRENCY)) {
    if (d.includes(key)) return val
  }
  return { code: 'USD', symbol: '$', name: 'US Dollar' }
}

const QUICK_AMOUNTS = [100, 500, 1000, 5000, 10000]

export function CurrencyConverter({ destination }: { destination: string }) {
  const [open, setOpen] = useState(false)
  const destCurrency = detectCurrency(destination)

  const [fromCur] = useState({ code: 'INR', symbol: '₹', name: 'Indian Rupee' })
  const [toCur]   = useState(destCurrency)
  const [amount, setAmount]   = useState('1000')
  const [rate, setRate]       = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [flipped, setFlipped] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')

  const from = flipped ? toCur : fromCur
  const to   = flipped ? fromCur : toCur

  const fetchRate = useCallback(async () => {
    if (from.code === to.code) { setRate(1); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/currency?from=${from.code}&to=${to.code}`)
      const data = await res.json()
      if (data.rate) {
        setRate(data.rate)
        if (data.updated) setLastUpdated(new Date(data.updated).toLocaleDateString())
      }
    } catch { /* keep stale rate */ }
    setLoading(false)
  }, [from.code, to.code])

  useEffect(() => { if (open) fetchRate() }, [open, fetchRate])

  const converted = rate && amount ? (parseFloat(amount) * rate) : null

  function formatAmount(val: number, symbol: string) {
    if (val >= 100_000) return `${symbol}${(val / 100_000).toFixed(1)}L`
    if (val >= 1_000)   return `${symbol}${(val / 1_000).toFixed(1)}K`
    return `${symbol}${val.toFixed(2)}`
  }

  return (
    <div className="mx-4 mb-3 rounded-3xl border-2 border-sage-100 dark:border-sage-900/30 bg-gradient-to-br from-white dark:from-[#1a1a10] to-sage-50 dark:to-[#1a190a] overflow-hidden shadow-soft">
      <button onClick={() => setOpen(v => !v)} className="w-full flex items-center gap-3 p-4 text-left">
        <div className="w-10 h-10 rounded-2xl bg-sage-500 flex items-center justify-center flex-shrink-0">
          <span className="text-white font-extrabold text-sm">{fromCur.symbol}/{toCur.symbol}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Currency Converter</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {fromCur.code} → {toCur.code} · tap to convert
          </p>
        </div>
        {rate && !open && (
          <span className="text-xs font-bold text-sage-600 dark:text-sage-400">
            1 {from.code} = {rate < 1 ? rate.toFixed(4) : rate.toFixed(2)} {to.code}
          </span>
        )}
        <div className={cn('w-7 h-7 rounded-full bg-sage-50 dark:bg-sage-900/30 flex items-center justify-center transition-transform flex-shrink-0', open && 'rotate-180')}>
          <ChevronDown size={14} className="text-sage-500 dark:text-sage-400" />
        </div>
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-4 animate-fade-up">
          {/* Currency pair */}
          <div className="flex items-center gap-3">
            <div className="flex-1 px-4 py-3 rounded-2xl bg-sea-50 dark:bg-sea-900/20 border border-sea-100 dark:border-sea-800/40 text-center">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{flipped ? 'To' : 'From'}</p>
              <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{from.symbol} {from.code}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{from.name}</p>
            </div>
            <button onClick={() => setFlipped(v => !v)}
              className="w-9 h-9 rounded-full bg-sage-100 dark:bg-sage-900/30 flex items-center justify-center hover:bg-sage-200 dark:hover:bg-sage-900/50 transition-colors flex-shrink-0">
              <ArrowLeftRight size={14} className="text-sage-600 dark:text-sage-400" />
            </button>
            <div className="flex-1 px-4 py-3 rounded-2xl bg-sage-50 dark:bg-sage-900/20 border border-sage-100 dark:border-sage-800/40 text-center">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{flipped ? 'From' : 'To'}</p>
              <p className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{to.symbol} {to.code}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500">{to.name}</p>
            </div>
          </div>

          {/* Input */}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-extrabold text-slate-500 dark:text-slate-400 text-lg">{from.symbol}</span>
            <input
              type="number"
              className="input pl-10 text-xl font-extrabold"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          {/* Result */}
          <div className="px-5 py-4 rounded-2xl bg-sage-50 dark:bg-sage-900/20 border-2 border-sage-200 dark:border-sage-800/40 text-center">
            {loading ? (
              <Loader2 size={20} className="animate-spin text-sage-500 mx-auto" />
            ) : converted !== null ? (
              <>
                <p className="text-3xl font-extrabold text-sage-700 dark:text-sage-300">
                  {to.symbol}{converted.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  1 {from.code} = {rate! < 1 ? rate!.toFixed(4) : rate!.toFixed(2)} {to.code}
                  {lastUpdated && <span> · Updated {lastUpdated}</span>}
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-400 dark:text-slate-500">Enter an amount above</p>
            )}
          </div>

          {/* Quick amounts */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-2">Quick convert</p>
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {QUICK_AMOUNTS.map(a => (
                <button key={a} onClick={() => setAmount(String(a))}
                  className={cn(
                    'flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-2xl border-2 transition-all text-center',
                    amount === String(a)
                      ? 'border-sage-400 bg-sage-50 dark:bg-sage-900/30 text-sage-700 dark:text-sage-300'
                      : 'border-slate-200 dark:border-[#1e2f2b] text-slate-500 dark:text-slate-400 hover:border-sage-300'
                  )}>
                  <span className="text-xs font-bold">{from.symbol}{a >= 1000 ? `${a/1000}K` : a}</span>
                  {rate && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {formatAmount(a * rate, to.symbol)}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-300 dark:text-slate-600 text-center">
            Rates are indicative. Check your bank for exact rates before transactions.
          </p>
        </div>
      )}
    </div>
  )
}

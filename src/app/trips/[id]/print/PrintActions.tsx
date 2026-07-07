'use client'

export default function PrintActions() {
  return (
    <button
      onClick={() => window.print()}
      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors"
    >
      Print / Save PDF
    </button>
  )
}

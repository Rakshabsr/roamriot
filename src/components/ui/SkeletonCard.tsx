export function TripCardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="h-28 bg-gradient-to-br from-slate-200 to-slate-100" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded-full w-3/4" />
        <div className="h-3 bg-slate-100 rounded-full w-1/2" />
        <div className="flex gap-2 mt-2">
          <div className="h-8 bg-slate-100 rounded-2xl flex-1" />
          <div className="h-8 w-8 bg-slate-100 rounded-2xl" />
        </div>
      </div>
    </div>
  )
}

export function ActivityCardSkeleton() {
  return (
    <div className="flex gap-3 animate-pulse">
      <div className="w-10 flex-shrink-0 pt-1">
        <div className="w-8 h-8 rounded-2xl bg-slate-200" />
      </div>
      <div className="flex-1 pb-4">
        <div className="card p-3.5 space-y-2">
          <div className="h-3 bg-slate-200 rounded-full w-1/3" />
          <div className="h-4 bg-slate-200 rounded-full w-4/5" />
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-slate-100 rounded-full" />
            <div className="h-5 w-12 bg-slate-100 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

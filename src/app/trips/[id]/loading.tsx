export default function TripLoading() {
  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Nav skeleton */}
      <div className="bg-white border-b border-sea-100 flex-shrink-0">
        <div className="h-14 px-4 flex items-center gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-slate-200" />
          <div className="w-24 h-5 bg-slate-200 rounded-full" />
          <div className="w-px h-4 bg-slate-200" />
          <div className="w-32 h-4 bg-slate-200 rounded-full" />
          <div className="w-40 h-4 bg-slate-100 rounded-full hidden sm:block" />
          <div className="ml-auto flex gap-2">
            <div className="w-16 h-7 bg-slate-100 rounded-2xl" />
            <div className="w-14 h-7 bg-slate-100 rounded-2xl" />
            <div className="w-16 h-7 bg-slate-100 rounded-2xl" />
          </div>
        </div>
        <div className="flex gap-1.5 px-4 pb-3 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-16 h-10 bg-slate-100 rounded-2xl flex-shrink-0" />
          ))}
        </div>
      </div>

      {/* Split panel skeleton */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left column */}
        <div className="w-full sm:w-[360px] lg:w-[420px] flex-shrink-0 bg-white border-r border-sea-100 p-4 space-y-3 animate-pulse">
          {/* Day summary card */}
          <div className="h-28 bg-gradient-to-r from-sea-100 to-sage-100 rounded-3xl" />
          {/* Activity skeletons */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-2xl bg-slate-200 flex-shrink-0 mt-1" />
              <div className="flex-1">
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
          ))}
        </div>

        {/* Map skeleton */}
        <div className="flex-1 p-3 hidden sm:block">
          <div className="w-full h-full rounded-3xl bg-gradient-to-br from-sea-50 to-sage-50 animate-pulse" />
        </div>
      </div>
    </div>
  )
}

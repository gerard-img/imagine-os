export default function PlanificadorLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Title + month nav */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-44 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-60 rounded bg-gray-100" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-gray-100" />
          <div className="h-9 w-32 rounded-lg bg-gray-200" />
          <div className="h-9 w-9 rounded-lg bg-gray-100" />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-28 rounded-full bg-gray-100" />
        <div className="h-8 w-28 rounded-full bg-gray-100" />
        <div className="h-8 w-24 rounded-full bg-gray-100" />
      </div>

      {/* Grid cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div className="h-4 w-32 rounded bg-gray-200" />
              <div className="h-5 w-16 rounded-full bg-gray-100" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-8 rounded bg-gray-50" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

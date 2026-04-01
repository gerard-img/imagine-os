export default function DashboardLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Title skeleton */}
      <div>
        <div className="h-6 w-48 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-72 rounded bg-gray-100" />
      </div>

      {/* KPI cards skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl bg-white p-5 shadow-sm border-t-4 border-t-gray-200">
            <div className="h-3 w-20 rounded bg-gray-100" />
            <div className="mt-3 h-7 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-64 rounded-lg bg-gray-100" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-7 w-20 rounded-full bg-gray-100" />
          ))}
        </div>
      </div>

      {/* Content rows skeleton */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between rounded-xl bg-white px-5 py-4 shadow-sm">
            <div className="space-y-2">
              <div className="h-4 w-48 rounded bg-gray-200" />
              <div className="h-3 w-64 rounded bg-gray-100" />
            </div>
            <div className="h-6 w-16 rounded-full bg-gray-100" />
          </div>
        ))}
      </div>
    </div>
  )
}

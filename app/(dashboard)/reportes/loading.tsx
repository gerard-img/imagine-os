export default function ReportesLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Title */}
      <div>
        <div className="h-6 w-36 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-64 rounded bg-gray-100" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-28 rounded-full bg-gray-100" />
        <div className="h-8 w-28 rounded-full bg-gray-100" />
        <div className="h-8 w-24 rounded-full bg-gray-100" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-white p-5 shadow-sm border-t-4 border-t-gray-200">
            <div className="h-2.5 w-20 rounded bg-gray-100" />
            <div className="mt-3 h-8 w-20 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-24 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="p-1">
          <div className="h-10 rounded bg-gray-50 mb-1" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-12 rounded bg-gray-50/50 mb-0.5" />
          ))}
        </div>
      </div>
    </div>
  )
}

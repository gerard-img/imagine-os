export default function DashboardPersonalLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Title */}
      <div>
        <div className="h-6 w-52 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-72 rounded bg-gray-100" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-white p-5 shadow-sm border-t-4 border-t-gray-200">
            <div className="h-2.5 w-24 rounded bg-gray-100" />
            <div className="mt-3 h-8 w-16 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-20 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Content sections */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="h-4 w-36 rounded bg-gray-100 mb-4" />
          <div className="space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded bg-gray-50" />
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="h-4 w-36 rounded bg-gray-100 mb-4" />
          <div className="h-[180px] rounded bg-gray-50" />
        </div>
      </div>
    </div>
  )
}

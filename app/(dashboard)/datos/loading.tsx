export default function InformesLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-32 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-80 rounded bg-gray-100" />
        </div>
        <div className="h-8 w-40 rounded-lg bg-gray-100" />
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-44 rounded-lg bg-gray-100" />
        <div className="flex gap-1.5">
          <div className="h-8 w-20 rounded-full bg-gray-200" />
          <div className="h-8 w-20 rounded-full bg-gray-100" />
        </div>
        <div className="h-9 w-44 rounded-lg bg-gray-100" />
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 lg:grid-cols-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-xl bg-white p-5 shadow-sm border-t-4 border-t-gray-200">
            <div className="h-2.5 w-20 rounded bg-gray-100" />
            <div className="mt-3 h-8 w-20 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-24 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="h-3 w-28 rounded bg-gray-100 mb-4" />
          <div className="h-[220px] rounded bg-gray-50" />
        </div>
        <div className="lg:col-span-2 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="h-3 w-36 rounded bg-gray-100 mb-4" />
          <div className="flex items-center gap-4">
            <div className="h-[160px] w-[160px] rounded-full bg-gray-50" />
            <div className="flex-1 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-3 w-full rounded bg-gray-50" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
        <div className="h-3 w-40 rounded bg-gray-100 mb-4" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="h-6 w-28 rounded bg-gray-50" />
              {Array.from({ length: 12 }).map((_, j) => (
                <div key={j} className="h-6 flex-1 rounded bg-gray-50" />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs + Table */}
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-28 rounded-t-lg bg-gray-100" />
        ))}
      </div>
      <div className="rounded-b-xl rounded-tr-xl bg-white shadow-sm border border-gray-100">
        <div className="p-1">
          <div className="h-9 rounded bg-gray-50 mb-1" />
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-11 rounded bg-gray-50/50 mb-0.5" />
          ))}
        </div>
      </div>
    </div>
  )
}

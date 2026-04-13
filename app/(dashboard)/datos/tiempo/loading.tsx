export default function DatosTiempoLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-24 rounded-full bg-gray-100" />
        <div className="h-8 w-28 rounded-full bg-gray-100" />
        <div className="h-8 w-28 rounded-full bg-gray-100" />
        <div className="h-8 w-24 rounded-full bg-gray-100" />
        <div className="ml-auto flex gap-1">
          <div className="h-8 w-14 rounded-full bg-gray-200" />
          <div className="h-8 w-14 rounded-full bg-gray-100" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl bg-white p-5 shadow-sm border-t-4 border-t-gray-200">
            <div className="h-2.5 w-28 rounded bg-gray-100" />
            <div className="mt-3 h-8 w-20 rounded bg-gray-200" />
            <div className="mt-2 h-3 w-24 rounded bg-gray-100" />
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="h-3 w-28 rounded bg-gray-100 mb-4" />
          <div className="h-[220px] rounded bg-gray-50" />
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="h-3 w-28 rounded bg-gray-100 mb-4" />
          <div className="h-[220px] rounded bg-gray-50" />
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
    </div>
  )
}

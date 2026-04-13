export default function DatosFocoLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Filtros */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-24 rounded-full bg-gray-100" />
        <div className="h-8 w-28 rounded-full bg-gray-100" />
        <div className="h-8 w-28 rounded-full bg-gray-100" />
        <div className="h-8 w-24 rounded-full bg-gray-100" />
        <div className="ml-auto h-8 w-40 rounded-lg bg-gray-100" />
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

      {/* Donut + Ranking */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="h-3 w-36 rounded bg-gray-100 mb-4" />
          <div className="h-[160px] rounded bg-gray-50" />
        </div>
        <div className="lg:col-span-3 rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <div className="h-3 w-32 rounded bg-gray-100 mb-4" />
          <div className="h-[200px] rounded bg-gray-50" />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="p-1">
          <div className="h-9 rounded bg-gray-50 mb-1" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-11 rounded bg-gray-50/50 mb-0.5" />
          ))}
        </div>
      </div>
    </div>
  )
}

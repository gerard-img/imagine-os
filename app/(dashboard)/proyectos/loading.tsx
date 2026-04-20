export default function ProyectosLoading() {
  return (
    <div className="space-y-5 animate-pulse">
      {/* Title */}
      <div>
        <div className="h-6 w-40 rounded bg-gray-200" />
        <div className="mt-2 h-4 w-64 rounded bg-gray-100" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-64 rounded-lg bg-gray-100" />
        <div className="h-9 w-32 rounded-lg bg-gray-100" />
        <div className="h-9 w-32 rounded-lg bg-gray-100" />
        <div className="ml-auto h-9 w-28 rounded-lg bg-gray-200" />
      </div>

      {/* Table */}
      <div className="rounded-xl bg-white shadow-sm border border-gray-100">
        <div className="p-1">
          <div className="h-10 rounded bg-gray-50 mb-1" />
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-12 rounded bg-gray-50/50 mb-0.5" />
          ))}
        </div>
      </div>
    </div>
  )
}

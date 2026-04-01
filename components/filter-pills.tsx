'use client'

interface FilterPillsProps {
  options: string[]
  active: string
  onChange: (value: string) => void
}

export function FilterPills({ options, active, onChange }: FilterPillsProps) {
  return (
    <div className="flex items-center gap-1.5">
      {options.map((option) => {
        const isActive = active === option
        return (
          <button
            key={option}
            onClick={() => onChange(option)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-100 text-muted-foreground hover:bg-gray-200'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

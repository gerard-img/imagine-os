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
                : 'bg-white text-muted-foreground hover:bg-gray-50 border border-border'
            }`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}

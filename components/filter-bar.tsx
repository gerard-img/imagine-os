'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface FilterBarProps {
  children: React.ReactNode
  className?: string
}

/**
 * Contenedor horizontal scrollable para barras de filtros.
 * Muestra flechas de navegación cuando el contenido desborda.
 */
export function FilterBar({ children, className = '' }: FilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 1)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
  }, [])

  useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', checkScroll, { passive: true })
    const ro = new ResizeObserver(checkScroll)
    ro.observe(el)
    return () => {
      el.removeEventListener('scroll', checkScroll)
      ro.disconnect()
    }
  }, [checkScroll])

  function scroll(direction: 'left' | 'right') {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' })
  }

  return (
    <div className={`relative ${className}`}>
      {/* Flecha izquierda */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1 shadow-md border border-border hover:bg-gray-50"
          aria-label="Scroll izquierda"
        >
          <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}

      {/* Contenido scrollable */}
      <div
        ref={scrollRef}
        className="flex items-center gap-3 overflow-x-auto scrollbar-none"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {children}
      </div>

      {/* Flecha derecha */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-1 shadow-md border border-border hover:bg-gray-50"
          aria-label="Scroll derecha"
        >
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  )
}

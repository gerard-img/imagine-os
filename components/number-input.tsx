'use client'

import { forwardRef, type ComponentProps } from 'react'
import { cn } from '@/lib/utils'

type NumberInputProps = Omit<ComponentProps<'input'>, 'type'> & {
  selectOnFocus?: boolean
}

/**
 * Input numérico que selecciona todo el contenido al recibir foco.
 * Compatible con react-hook-form (soporta ref forwarding).
 */
export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  function NumberInput({ selectOnFocus = true, className, onFocus, ...props }, ref) {
    function handleFocus(e: React.FocusEvent<HTMLInputElement>) {
      if (selectOnFocus) e.target.select()
      onFocus?.(e)
    }

    return (
      <input
        ref={ref}
        type="number"
        onFocus={handleFocus}
        className={cn(
          'rounded border border-border px-1.5 py-0.5 text-xs text-right font-medium outline-none focus:border-primary [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          className,
        )}
        {...props}
      />
    )
  },
)

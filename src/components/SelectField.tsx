import { useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

type SelectFieldProps = {
  label?: string
  value: string
  options: string[]
  disabled?: boolean
  onChange: (value: string) => void
  icon?: ReactNode
  variant?: 'form' | 'pill'
}

export function SelectField({
  label,
  value,
  options,
  disabled = false,
  onChange,
  icon,
  variant = 'form',
}: SelectFieldProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const isDisabled = disabled || options.length === 0

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={containerRef} className={`relative ${variant === 'form' ? 'grid gap-1.5' : 'inline-block'} min-w-0`}>
      {label && variant === 'form' && (
        <span className="text-xs font-bold text-[#696969] uppercase tracking-wider">{label}</span>
      )}

      <div className="relative w-full min-w-0">
        <div
          role="button"
          tabIndex={isDisabled ? -1 : 0}
          onClick={() => !isDisabled && setIsOpen(!isOpen)}
          onKeyDown={(e) => {
            if (!isDisabled && (e.key === ' ' || e.key === 'Enter')) {
              e.preventDefault()
              setIsOpen(!isOpen)
            }
          }}
          className={
            variant === 'form'
              ? `w-full text-left rounded-[20px] border border-[#E5E2E0] bg-[#FCFBFA] py-3 pr-10 text-sm text-[#141413] outline-none transition-all hover:border-[#C7C7C0] focus:border-[#141413] focus:bg-white focus:ring-4 focus:ring-[#141413]/5 flex items-center justify-between gap-2 min-w-0 ${
                  icon ? 'pl-11' : 'pl-4'
                } ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`
              : `cursor-pointer rounded-full bg-transparent px-4 py-2 text-sm font-semibold text-[#141413] flex items-center gap-1.5 hover:bg-[#EFEEE7]/60 transition-colors ${
                  isDisabled ? 'cursor-not-allowed opacity-50' : ''
                }`
          }
        >
          <div className="flex items-center gap-2 truncate min-w-0">
            {icon && variant === 'form' && (
              <span className="pointer-events-none absolute left-4 flex items-center text-[#696969]">
                {icon}
              </span>
            )}
            <span className="truncate">{value || 'Pilih...'}</span>
          </div>

          {/* Chevron */}
          <span className="text-[#696969] shrink-0">
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              aria-hidden="true"
              className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`}
            >
              <path
                d="M2 4l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>

        {/* Floating Menu */}
        {isOpen && (
          <div
            className={`absolute z-50 mt-1.5 max-h-60 overflow-y-auto rounded-[24px] border border-[#E5E2E0] bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.08)] animate-fade-slide-down ${
              variant === 'form' ? 'w-full left-0' : 'right-0 min-w-[220px]'
            }`}
          >
            {options.map((option) => {
              const isSelected = option === value
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left rounded-[16px] px-3.5 py-2.5 text-xs font-medium transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-[#EFEEE7] text-[#141413] font-bold'
                      : 'text-[#555555] hover:bg-[#FCFBFA] hover:text-[#141413]'
                  }`}
                >
                  <span className="truncate">{option}</span>
                  {isSelected && (
                    <span className="text-[#10b981] shrink-0 font-bold">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}



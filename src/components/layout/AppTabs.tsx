import { useState, useEffect } from 'react'
import { APP_LAYERS } from '../../types/navigation'
import type { AppLayer } from '../../types/navigation'

type AppTabsProps = {
  activeLayer: AppLayer
  onChange: (layer: AppLayer) => void
}

export function AppTabs({ activeLayer, onChange }: AppTabsProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-4 left-1/2 z-[1050] flex w-[95%] max-w-[1200px] -translate-x-1/2 items-center justify-between rounded-full transition-all duration-300 ${
        isScrolled
          ? 'bg-white/70 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)] py-2.5 px-6 backdrop-blur-md'
          : 'bg-white border border-[#E5E2E0] shadow-[0_4px_24px_rgba(0,0,0,0.07)] py-3.5 px-8 backdrop-blur-sm'
      } md:px-10`}
    >
      {/* Logo */}
      <button
        className="shrink-0 text-lg font-bold tracking-[-0.02em] text-[#141413] transition-opacity hover:opacity-70 cursor-pointer"
        type="button"
        onClick={() => onChange('salary')}
      >
        HireMap
      </button>

      {/* Nav Links */}
      <div className="mx-3 flex min-w-0 flex-1 items-center justify-center gap-1.5 overflow-x-auto md:flex-none">
        {APP_LAYERS.map((layer) => {
          const isActive = layer.id === activeLayer

          return (
            <button
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold tracking-[-0.01em] transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#141413] text-[#F3F0EE] shadow-sm'
                  : 'text-[#696969] hover:bg-[#F3F0EE] hover:text-[#141413]'
              }`}
              type="button"
              key={layer.id}
              onClick={() => onChange(layer.id)}
            >
              {layer.label}
            </button>
          )
        })}
      </div>

      {/* Right badge */}
      <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#141413] text-[11px] font-bold tracking-wider text-[#F3F0EE] sm:flex">
        HM
      </div>
    </nav>
  )
}


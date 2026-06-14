import { useEffect, useState } from 'react'
import { APP_LAYERS } from '../../types/navigation'
import type { AppLayer } from '../../types/navigation'

type AppTabsProps = {
  activeLayer: AppLayer
  onChange: (layer: AppLayer) => void
}

// Navigasi utama aplikasi yang selalu menempel di bagian atas layar.
export function AppTabs({ activeLayer, onChange }: AppTabsProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  // Mengubah style navbar setelah user mulai scroll.
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav className={getNavClassName(isScrolled)}>
      <div className="flex w-full items-center justify-between gap-3 md:w-auto">
        <button
          className="shrink-0 cursor-pointer text-lg font-bold tracking-[-0.02em] text-[#141413] transition-opacity hover:opacity-70"
          type="button"
          onClick={() => onChange('salary')}
        >
          HireMap
        </button>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#141413] text-[10px] font-bold tracking-wider text-[#F3F0EE] md:hidden">
          HM
        </div>
      </div>

      <div className="flex w-full min-w-0 items-center gap-1.5 overflow-x-auto rounded-full bg-[#F3F0EE]/70 p-1 md:mx-3 md:w-auto md:flex-1 md:justify-center md:bg-transparent md:p-0 lg:flex-none">
        {APP_LAYERS.map((layer) => (
          <TabButton
            key={layer.id}
            layer={layer.id}
            label={layer.label}
            isActive={layer.id === activeLayer}
            onClick={onChange}
          />
        ))}
      </div>

      <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#141413] text-[11px] font-bold tracking-wider text-[#F3F0EE] md:flex">
        HM
      </div>
    </nav>
  )
}

// Satu tombol tab agar style active/inactive mudah dibaca.
function TabButton({
  layer,
  label,
  isActive,
  onClick,
}: {
  layer: AppLayer
  label: string
  isActive: boolean
  onClick: (layer: AppLayer) => void
}) {
  return (
    <button
      className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3.5 py-2 text-xs font-semibold tracking-[-0.01em] transition-all duration-150 sm:px-4 md:px-5 md:py-2.5 md:text-sm ${
        isActive
          ? 'bg-[#141413] text-[#F3F0EE] shadow-sm'
          : 'text-[#696969] hover:bg-[#F3F0EE] hover:text-[#141413]'
      }`}
      type="button"
      onClick={() => onClick(layer)}
    >
      {label}
    </button>
  )
}

function getNavClassName(isScrolled: boolean) {
  const baseClass =
    'fixed left-1/2 top-3 z-[1050] flex w-[calc(100%-1rem)] max-w-[1200px] -translate-x-1/2 flex-col items-stretch gap-2 rounded-[28px] transition-all duration-300 md:top-4 md:w-[95%] md:flex-row md:items-center md:justify-between md:rounded-full md:px-10'

  const scrolledClass =
    'border border-white/20 bg-white/80 px-4 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-md md:px-6 md:py-2.5'

  const defaultClass =
    'border border-[#E5E2E0] bg-white px-4 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.07)] backdrop-blur-sm md:px-8 md:py-3.5'

  return `${baseClass} ${isScrolled ? scrolledClass : defaultClass}`
}

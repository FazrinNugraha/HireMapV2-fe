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
      <div className="flex items-center gap-2 shrink-0">
        <button
          className="cursor-pointer text-base font-extrabold tracking-[-0.03em] text-[#141413] transition-opacity hover:opacity-70"
          type="button"
          onClick={() => onChange('salary')}
        >
          HireVision
        </button>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-full bg-[#F3F0EE]/60 p-0.5 no-scrollbar md:mx-3 md:w-auto md:flex-initial md:justify-center md:bg-transparent md:p-0">
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

      <div className="hidden w-8 shrink-0 md:block" />
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
      className={`shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold tracking-[-0.01em] transition-all duration-150 md:px-5 md:py-2 md:text-xs ${isActive
          ? 'bg-[#141413] text-[#F3F0EE] shadow-sm'
          : 'text-[#696969] hover:text-[#141413]'
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
    'fixed left-1/2 top-3 z-[1050] flex w-[calc(100%-1rem)] max-w-[1200px] -translate-x-1/2 flex-row items-center justify-between gap-3 rounded-full transition-all duration-300 md:top-4 md:w-[95%] md:px-8'

  const scrolledClass =
    'border border-white/20 bg-white/80 px-3 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-md md:px-6 md:py-2'

  const defaultClass =
    'border border-[#E5E2E0] bg-white px-4 py-2 shadow-[0_4px_24px_rgba(0,0,0,0.07)] backdrop-blur-sm md:px-8 md:py-2.5'

  return `${baseClass} ${isScrolled ? scrolledClass : defaultClass}`
}

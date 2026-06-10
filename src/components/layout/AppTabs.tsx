import { APP_LAYERS } from '../../types/navigation'
import type { AppLayer } from '../../types/navigation'

type AppTabsProps = {
  activeLayer: AppLayer
  onChange: (layer: AppLayer) => void
}

export function AppTabs({ activeLayer, onChange }: AppTabsProps) {
  return (
    <nav className="fixed top-4 left-1/2 z-[1050] flex w-[95%] max-w-[1200px] -translate-x-1/2 items-center justify-between rounded-full bg-white px-4 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.07)] md:px-8">
      {/* Logo */}
      <button
        className="shrink-0 text-base font-bold tracking-[-0.02em] text-[#141413] transition-opacity hover:opacity-70"
        type="button"
        onClick={() => onChange('salary')}
      >
        HireMap
      </button>

      {/* Nav Links */}
      <div className="mx-3 flex min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto md:flex-none">
        {APP_LAYERS.map((layer) => {
          const isActive = layer.id === activeLayer

          return (
            <button
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold tracking-[-0.01em] transition-all duration-150 ${
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
      <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#141413] text-[10px] font-bold tracking-wider text-[#F3F0EE] sm:flex">
        HM
      </div>
    </nav>
  )
}


import { APP_LAYERS } from '../../types/navigation'
import type { AppLayer } from '../../types/navigation'

type AppTabsProps = {
  activeLayer: AppLayer
  onChange: (layer: AppLayer) => void
}

export function AppTabs({ activeLayer, onChange }: AppTabsProps) {
  return (
    <nav className="fixed top-4 left-1/2 z-50 flex w-[95%] max-w-[1200px] -translate-x-1/2 items-center justify-between rounded-full bg-white px-4 py-3 shadow-[0_4px_20px_rgba(0,0,0,0.15)] md:px-8">
      <button
        className="text-lg font-bold text-[#000000]"
        type="button"
        onClick={() => onChange('salary')}
      >
        HireMap
      </button>

      <div className="mx-3 flex min-w-0 flex-1 justify-center overflow-x-auto md:flex-none md:gap-8">
        {APP_LAYERS.map((layer) => {
          const isActive = layer.id === activeLayer

          return (
            <button
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-[#fbf9f3] text-[#aa3700] shadow-sm'
                  : 'text-[#464742] hover:text-[#aa3700]'
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

      <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#efeee7] text-[#000000] sm:flex">
        ●
      </div>
    </nav>
  )
}

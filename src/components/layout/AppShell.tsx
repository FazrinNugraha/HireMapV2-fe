import type { ReactNode } from 'react'
import { AppFooter } from './AppFooter'
import { AppTabs } from './AppTabs'
import type { AppLayer } from '../../types/navigation'

type AppShellProps = {
  activeLayer: AppLayer
  children: ReactNode
  onLayerChange: (layer: AppLayer) => void
  onGoHome?: () => void
  hasPrediction?: boolean
}

// Kerangka global aplikasi: navbar atas, konten halaman aktif, lalu footer.
export function AppShell({ activeLayer, children, onLayerChange, onGoHome, hasPrediction = false }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#fbf9f3] pt-32 text-[#1b1c18] md:pt-24">
      <AppTabs activeLayer={activeLayer} onChange={onLayerChange} onGoHome={onGoHome} hasPrediction={hasPrediction} />
      {children}
      <AppFooter />
    </div>
  )
}

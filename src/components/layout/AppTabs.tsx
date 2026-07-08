import { useEffect, useState } from 'react'
import type { AppLayer } from '../../types/navigation'

type AppTabsProps = {
  activeLayer: AppLayer
  onChange?: (layer: AppLayer) => void
  onGoHome?: () => void
  hasPrediction?: boolean
}

// Navigasi utama aplikasi yang selalu menempel di bagian atas layar.
// Menampilkan progress bar terintegrasi sesuai referensi UX.
export function AppTabs({ activeLayer, onGoHome, hasPrediction = false }: AppTabsProps) {
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

  const progressPercentage = getProgressPercentage(activeLayer, hasPrediction)

  return (
    <nav className={getNavClassName(isScrolled)}>
      <div className="flex items-center gap-2 shrink-0">
        <button
          className="cursor-pointer text-base font-extrabold tracking-[-0.03em] text-[#141413] transition-opacity hover:opacity-70"
          type="button"
          onClick={onGoHome}
        >
          HireVision
        </button>
      </div>

      {/* Progress display berdasarkan referensi */}
      <div className="flex flex-col flex-1 max-w-[500px] gap-1.5 md:ml-6">
        <div className="flex justify-between items-end text-[10px] font-extrabold text-[#141413] uppercase tracking-wider select-none px-0.5">
          <span className="text-[#F37338]">{progressPercentage}%</span>
          <span className="text-[#696969]">{getStepText(activeLayer)}</span>
        </div>
        {/* Progress Bar Line */}
        <div className="w-full h-1.5 bg-[#F3F0EE] rounded-full overflow-hidden border border-[#E5E2E0]/40">
          <div
            className="h-full bg-[#F37338] transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </nav>
  )
}

function getNavClassName(isScrolled: boolean) {
  const baseClass =
    'fixed left-1/2 top-3 z-[1050] flex w-[calc(100%-1rem)] max-w-[1200px] -translate-x-1/2 flex-row items-center justify-between gap-6 rounded-full transition-all duration-300 md:top-4 md:w-[95%] md:px-8'

  const scrolledClass =
    'border border-white/20 bg-white/80 px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-md md:px-6 md:py-3'

  const defaultClass =
    'border border-[#E5E2E0] bg-white px-5 py-3.5 shadow-[0_4px_24px_rgba(0,0,0,0.07)] backdrop-blur-sm md:px-8 md:py-4'

  return `${baseClass} ${isScrolled ? scrolledClass : defaultClass}`
}

function getProgressPercentage(activeLayer: AppLayer, hasPrediction: boolean) {
  if (!hasPrediction) return 15
  switch (activeLayer) {
    case 'salary':
      return 30
    case 'spatial':
      return 45
    case 'journey':
      return 60
    case 'commuter':
      return 75
    case 'analysis':
      return 90
    case 'consultant':
      return 100
    default:
      return 15
  }
}

function getStepText(activeLayer: AppLayer) {
  switch (activeLayer) {
    case 'salary':
      return 'Step 1 of 6: Salary Prediction'
    case 'spatial':
      return 'Step 2 of 6: Spatial Map'
    case 'journey':
      return 'Step 3 of 6: Career Journey'
    case 'commuter':
      return 'Step 4 of 6: Commuter Simulator'
    case 'analysis':
      return 'Step 5 of 6: Analytics & Insight'
    case 'consultant':
      return 'Step 6 of 6: AI Consultant'
    default:
      return 'Step 1 of 6: Salary Prediction'
  }
}


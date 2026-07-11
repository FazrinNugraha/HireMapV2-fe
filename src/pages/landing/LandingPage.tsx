import { useLandingScroll } from './useLandingScroll'
import { LandingNavbar } from './components/LandingNavbar'
import { LandingHero } from './components/LandingHero'
import { LandingFeaturesSection } from './components/LandingFeaturesSection'
import { LandingDirectorySection } from './components/LandingDirectorySection'
import { LandingFooter } from './components/LandingFooter'

type LandingPageProps = {
  onStart: () => void
}

export function LandingPage({ onStart }: LandingPageProps) {
  const isScrolled = useLandingScroll()

  return (
    <div className="landing-body min-h-screen flex flex-col overflow-x-hidden">
      <LandingNavbar isScrolled={isScrolled} onStart={onStart} />
      <LandingHero onStart={onStart} />
      <LandingFeaturesSection onStart={onStart} />
        <LandingDirectorySection onStart={onStart} />
      <LandingFooter onStart={onStart} />
    </div>
  )
}

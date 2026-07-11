import { heroChecklistItems } from '../landingContent'

type LandingHeroProps = {
  onStart: () => void
}

export function LandingHero({ onStart }: LandingHeroProps) {
  return (
    <header className="landing-hero min-h-screen flex flex-col items-center justify-center text-center px-6 md:px-12 pt-20 pb-12">
      <div className="landing-hero-orb" />
      <div className="landing-hero-orb-2" />

      <div className="relative z-10 max-w-[920px] mx-auto flex flex-col items-center gap-4">
        <h1 className="w-full text-[clamp(2.6rem,6.2vw,4.3rem)] font-extrabold tracking-[-0.045em] leading-[1.04] text-[#141413]">
          <span className="block md:whitespace-nowrap">Sistem Pendukung Keputusan untuk</span>
          <span className="block text-[#F37338] md:whitespace-nowrap">Optimasi Karir Jabodetabek.</span>
        </h1>

        <p className="max-w-[680px] text-[clamp(1rem,1.5vw,1.2rem)] leading-[1.55] text-[#696969] font-normal mt-1">
          Platform data-driven dan peta interaktif untuk membantu Anda mengambil keputusan karir terbaik di wilayah Jabodetabek. Validasi tawaran kerja Anda lewat integrasi prediksi gaji pasar, estimasi biaya hunian, serta simulasi rute komuter secara real-time
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <button
            onClick={onStart}
            type="button"
            className="btn-primary-pill px-8 py-3 text-base font-semibold shadow-sm"
          >
            Mulai Analisis
          </button>
          <a
            href="#features"
            className="btn-secondary-pill px-8 py-3 text-base font-semibold flex items-center justify-center"
          >
            Fitur
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-x-8 gap-y-2 mt-5">
          {heroChecklistItems.map((item) => (
            <div key={item} className="landing-hero-check-item">
              <span className="landing-hero-check-icon-orange">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
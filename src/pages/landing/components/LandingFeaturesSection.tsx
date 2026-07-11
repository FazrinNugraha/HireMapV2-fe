import { featureSteps } from '../landingContent'

type LandingFeaturesSectionProps = {
  onStart: () => void
}

function FeatureIcon({ title }: { title: string }) {
  if (title === 'Salary Prediction') {
    return (
      <svg className="h-10 w-10 text-[#141413] group-hover:text-[#F37338] transition-colors" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="5" y="11" width="22" height="14" rx="3" stroke="currentColor" strokeWidth="2.2" />
        <path d="M20 15H27V21H20V15Z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx="16" cy="7.5" r="3" stroke="currentColor" strokeWidth="2.2" />
        <path d="M16 6V9" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14.5 7.5H17.5" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    )
  }

  if (title === 'Spatial Map') {
    return (
      <svg className="h-10 w-10 text-[#141413] group-hover:text-[#F37338] transition-colors" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 22L16 27L28 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M4 17L16 22L28 17" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" strokeLinecap="round" />
        <path d="M16 4C12.5 4 10 6.5 10 10C10 14.5 16 22 16 22C16 22 22 14.5 22 10C22 6.5 19.5 4 16 4Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
        <circle cx="16" cy="10" r="2" fill="currentColor" />
      </svg>
    )
  }

  if (title === 'Commuter Simulator') {
    return (
      <svg className="h-10 w-10 text-[#141413] group-hover:text-[#F37338] transition-colors" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="7" y="6" width="18" height="20" rx="4" stroke="currentColor" strokeWidth="2.2" />
        <rect x="10" y="9" width="12" height="7" rx="1.5" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2.2" />
        <circle cx="11" cy="21" r="1.5" fill="currentColor" />
        <circle cx="21" cy="21" r="1.5" fill="currentColor" />
        <path d="M5 28H27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 28L6 31" stroke="currentColor" strokeWidth="2" />
        <path d="M23 28L26 31" stroke="currentColor" strokeWidth="2" />
      </svg>
    )
  }

  if (title === 'Career Analytics') {
    return (
      <svg className="h-10 w-10 text-[#141413] group-hover:text-[#F37338] transition-colors" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="16" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="2.2" />
        <rect x="13" y="11" width="4" height="15" rx="1" stroke="currentColor" strokeWidth="2.2" />
        <rect x="20" y="6" width="4" height="20" rx="1" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2.2" />
        <path d="M4 23C10 20 15 11 25 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M21 7H25V11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  return (
    <svg className="h-10 w-10 text-[#141413] group-hover:text-[#F37338] transition-colors" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 22H6C4.9 22 4 21.1 4 20V7C4 5.9 4.9 5 6 5H20C21.1 5 22 5.9 22 7V9" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M14 26L10 26L10 22H10C8.9 22 8 21.1 8 20V13C8 11.9 8.9 11 10 11H24C25.1 11 26 11.9 26 13V20C26 21.1 25.1 22 24 22H20L14 26Z" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round" />
      <path d="M19 14.5C18 15.5 17 15.5 17 15.5C17 15.5 18 15.5 19 16.5C20 15.5 21 15.5 21 15.5C21 15.5 20 15.5 19 14.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function LandingFeaturesSection({ onStart }: LandingFeaturesSectionProps) {
  return (
    <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <p className="eyebrow justify-center">Alur Keputusan DSS</p>
        <h2 className="text-3xl md:text-5xl font-black tracking-[-0.03em] mt-3 text-[#141413]">
          Fitur Utama Pendukung Keputusan Karir
        </h2>
        <p className="text-sm md:text-base text-[#696969] mt-3">
          Analisis data riil pasar tenaga kerja di wilayah DKI Jakarta, Bogor, Depok, Tangerang, dan Bekasi.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-y-12 lg:gap-x-2 mt-16 max-w-295 mx-auto w-full">
        {featureSteps.map((step, index) => (
          <div key={step.title} className="flex items-center w-full lg:w-auto">
            <div className="flex flex-col items-center text-center max-w-47.5 group cursor-pointer" onClick={onStart}>
              <div className="w-24 h-24 rounded-full border border-[#141413]/20 bg-white flex items-center justify-center transition-all duration-300 group-hover:border-[#F37338] group-hover:scale-105 shadow-sm">
                <FeatureIcon title={step.title} />
              </div>
              <h3 className="text-[17px] font-extrabold text-[#141413] mt-5 group-hover:text-[#F37338] transition-colors tracking-tight">
                {step.title}
              </h3>
              <p className="text-[13px] leading-relaxed text-[#696969] mt-2 font-normal">
                {step.description}
              </p>
            </div>

            {index < featureSteps.length - 1 ? (
              <div className="hidden lg:flex items-center justify-center pt-9 shrink-0 opacity-40">
                <svg className="h-6 w-6 text-[#141413]" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <polyline points="14 6 20 12 14 18" />
                </svg>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  )
}
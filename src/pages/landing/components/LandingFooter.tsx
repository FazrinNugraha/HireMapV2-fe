type LandingFooterProps = {
  onStart: () => void
}

export function LandingFooter({ onStart }: LandingFooterProps) {
  return (
    <footer className="w-full bg-[#141413] text-white/70 pt-20 pb-10 border-t border-white/5 mt-auto">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-16 border-b border-white/10">
          <div className="lg:col-span-7 flex flex-col gap-6 text-left">
            <h2 className="text-3xl md:text-[40px] font-black leading-[1.15] text-white tracking-[-0.03em] max-w-2xl">
              Wujudkan karir impian dengan estimasi gaji presisi, <br />
              <span className="text-[#F37338]">dengan kecerdasan AI terpercaya.</span>
            </h2>
            <div className="flex flex-col sm:flex-row gap-x-6 gap-y-2.5 mt-2">
              <div className="flex items-center gap-2 text-[14.5px] font-semibold text-white/80">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F37338]/10 text-[#F37338]">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.2" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>100% Gratis selamanya</span>
              </div>
              <div className="flex items-center gap-2 text-[14.5px] font-semibold text-white/80">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F37338]/10 text-[#F37338]">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3.2" viewBox="0 0 24 24">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <span>Data Real-time Jabodetabek</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col items-start justify-between gap-6 text-left">
            <p className="text-[14.5px] leading-relaxed text-white/60 font-normal">
              Dengan memadukan machine learning untuk prediksi gaji dan analisis spasial Jabodetabek, HireVision membantu pencari kerja mengambil keputusan karir yang cerdas, hemat, dan terencana.
            </p>
            <button
              onClick={onStart}
              type="button"
              className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full bg-white hover:bg-white/90 px-7 py-3.5 text-sm font-extrabold text-[#141413] transition-all hover:scale-105 active:scale-95"
            >
              Mulai Analisis Karir
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 py-10">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="landing-nav-logo-wrap bg-white/5 p-1 rounded-lg">
              <img
                src="/logo_virevision_transparent.png"
                alt="HireVision Logo"
                className="landing-nav-logo-img filter brightness-0 invert"
              />
            </div>
            <span className="text-[18px] font-extrabold tracking-tight text-white">HireVision</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[14.5px] font-semibold text-white/60">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:text-[#F37338] transition-colors">
              Beranda
            </button>
            <a href="#features" className="hover:text-[#F37338] transition-colors">
              Fitur
            </a>
            <a href="#eksplorasi" className="hover:text-[#F37338] transition-colors">
              Eksplorasi
            </a>
          </div>

          <a
            href="https://github.com/FazrinNugraha"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/60 hover:border-white/30 hover:text-white transition-all"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
            </svg>
          </a>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/5 text-xs text-white/40">
          <span>&copy; 2026 HireVision. Hak cipta dilindungi.</span>
          <div className="flex items-center gap-6">
            <button onClick={onStart} className="hover:text-white transition-colors">Terms of Service</button>
            <button onClick={onStart} className="hover:text-white transition-colors">Privacy Policy</button>
          </div>
        </div>
      </div>
    </footer>
  )
}
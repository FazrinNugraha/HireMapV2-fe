export function AppFooter() {
  return (
    <footer className="mt-20 w-full bg-[#141413] text-white">
      <div className="mx-auto max-w-[1280px] px-6 pb-10 pt-12 md:px-10">
        {/* Top row */}
        <div className="mb-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <div className="mb-2 text-lg font-bold tracking-[-0.02em] text-white">HireMap</div>
            <p className="text-sm leading-6 text-white/50">
              Prediksi gaji, peta karir spasial, dan konsultasi AI untuk pasar kerja Jabodetabek.
            </p>
          </div>

          <div className="flex flex-wrap gap-10">
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.04em] text-white/40">
                Platform
              </h4>
              <ul className="flex flex-col gap-2 text-sm text-white/70">
                <li><a className="transition-colors hover:text-white" href="#salary">Salary Prediction</a></li>
                <li><a className="transition-colors hover:text-white" href="#spatial">Spatial Map</a></li>
                <li><a className="transition-colors hover:text-white" href="#consultant">AI Consultant</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.04em] text-white/40">
                Legal
              </h4>
              <ul className="flex flex-col gap-2 text-sm text-white/70">
                <li><a className="transition-colors hover:text-white" href="#privacy">Privacy Policy</a></li>
                <li><a className="transition-colors hover:text-white" href="#terms">Terms of Use</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10" />

        {/* Bottom row */}
        <div className="mt-6 flex flex-col gap-2 text-xs text-white/35 md:flex-row md:items-center md:justify-between">
          <span>© 2026 HireMap. All rights reserved.</span>
          <span>Data estimasi — bukan penawaran kerja resmi.</span>
        </div>
      </div>
    </footer>
  )
}


type LandingNavbarProps = {
  isScrolled: boolean
  onStart: () => void
}

export function LandingNavbar({ isScrolled, onStart }: LandingNavbarProps) {
  return (
    <nav className={`landing-nav flex items-center justify-between ${isScrolled ? 'scrolled' : ''}`}>
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="landing-nav-logo-wrap">
          <img
            src="/logo_virevision_transparent.png"
            alt="HireVision Logo"
            className="landing-nav-logo-img"
          />
        </div>
        <span className="text-[18px] font-extrabold tracking-tight text-[#141413]">HireVision</span>
      </div>

      <button onClick={onStart} className="landing-nav-login-btn">
        Masuk
      </button>
    </nav>
  )
}
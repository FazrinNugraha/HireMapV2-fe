export function AppFooter() {
  return (
    <footer className="mx-auto mt-16 flex w-full max-w-[1200px] flex-col gap-3 border-t border-[#e5e2e0] px-5 py-8 text-xs text-[#464742] md:flex-row md:items-center md:justify-between md:px-10">
      <div className="text-sm font-semibold text-[#000000]">HireMap</div>
      <div>© 2026 HireMap. All rights reserved.</div>
      <div className="flex gap-5">
        <a className="underline hover:text-[#000000]" href="#privacy">
          Privacy
        </a>
        <a className="underline hover:text-[#000000]" href="#terms">
          Terms
        </a>
        <a className="underline hover:text-[#000000]" href="#support">
          Support
        </a>
      </div>
    </footer>
  )
}

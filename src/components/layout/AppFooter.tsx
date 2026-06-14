type FooterLink = {
  label: string
  href: string
}

const PLATFORM_LINKS: FooterLink[] = [
  { label: 'Salary Prediction', href: '#salary' },
  { label: 'Spatial Map', href: '#spatial' },
  { label: 'Analytics & Insight', href: '#analysis' },
  { label: 'AI Consultant', href: '#consultant' },
]

const LEGAL_LINKS: FooterLink[] = [
  { label: 'Privacy Policy', href: '#privacy' },
  { label: 'Terms of Use', href: '#terms' },
]

// Footer global untuk identitas produk, link platform, dan catatan legal.
export function AppFooter() {
  return (
    <footer className="mt-20 w-full bg-[#141413] text-white">
      <div className="mx-auto max-w-[1280px] px-6 pb-10 pt-12 md:px-10">
        <div className="mb-10 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <FooterBrand />

          <div className="flex flex-wrap gap-10">
            <FooterLinkGroup title="Platform" links={PLATFORM_LINKS} />
            <FooterLinkGroup title="Legal" links={LEGAL_LINKS} />
          </div>
        </div>

        <div className="h-px bg-white/10" />

        <div className="mt-6 flex flex-col gap-2 text-xs text-white/35 md:flex-row md:items-center md:justify-between">
          <span>(c) 2026 HireMap. All rights reserved.</span>
          <span>Data estimasi - bukan penawaran kerja resmi.</span>
        </div>
      </div>
    </footer>
  )
}

// Blok identitas singkat produk.
function FooterBrand() {
  return (
    <div className="max-w-xs">
      <div className="mb-2 text-lg font-bold tracking-[-0.02em] text-white">
        HireMap
      </div>
      <p className="text-sm leading-6 text-white/50">
        Prediksi gaji, peta karir spasial, dan konsultasi AI untuk pasar kerja
        Jabodetabek.
      </p>
    </div>
  )
}

// Satu kelompok link footer seperti Platform atau Legal.
function FooterLinkGroup({
  title,
  links,
}: {
  title: string
  links: FooterLink[]
}) {
  return (
    <div>
      <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.04em] text-white/40">
        {title}
      </h4>
      <ul className="flex flex-col gap-2 text-sm text-white/70">
        {links.map((link) => (
          <li key={link.href}>
            <a className="transition-colors hover:text-white" href={link.href}>
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

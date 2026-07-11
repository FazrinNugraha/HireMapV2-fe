import { directorySections } from '../landingContent'

type LandingDirectorySectionProps = {
  onStart: () => void
}

type DirectoryColumnProps = {
  title: string
  items: readonly string[]
  onStart: () => void
  isFirst?: boolean
}

function DirectoryColumn({ title, items, onStart, isFirst = false }: DirectoryColumnProps) {
  return (
    <div className={`flex flex-col ${isFirst ? '' : 'lg:border-l lg:border-[#141413]/10 lg:pl-6'}`}>
      <h4 className="text-[14px] font-black uppercase tracking-[0.03em] text-[#141413] mb-4 pb-2.5 border-b border-[#141413]/15">
        {title}
      </h4>
      <ul className="space-y-2 text-[13.5px]">
        {items.map((item) => (
          <li key={item} className="group/item">
            <button
              onClick={onStart}
              className="flex items-center gap-1.5 text-left text-[#4F4F54] hover:text-[#F37338] font-medium transition-all duration-200 group-hover/item:translate-x-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#F37338] scale-0 group-hover/item:scale-100 transition-transform duration-200 shrink-0" />
              <span>{item}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LandingDirectorySection({ onStart }: LandingDirectorySectionProps) {
  return (
    <section id="eksplorasi" className="w-full bg-[#EFEEE7] mt-12 border-t border-[#E5E2E0]">
      <div className="py-24 px-6 md:px-12 max-w-[1280px] mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="eyebrow justify-center mb-2">DIREKTORI INPUT</p>
          <h3 className="text-3xl md:text-5xl font-black text-[#141413] tracking-[-0.03em]">Mulai Eksplorasi Anda</h3>
          <p className="text-sm md:text-base text-[#696969] mt-3">
            Butuh inspirasi? Lihat kriteria input dan skenario keputusan karir paling populer di Jabodetabek hari ini.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-y-12 gap-x-6 text-left max-w-[1180px] mx-auto">
          {directorySections.map((section, index) => (
            <DirectoryColumn
              key={section.title}
              title={section.title}
              items={section.items}
              onStart={onStart}
              isFirst={index === 0}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
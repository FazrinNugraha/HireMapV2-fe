import { useEffect, useState } from 'react'

type LandingPageProps = {
  onStart: () => void
}

export function LandingPage({ onStart }: LandingPageProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="landing-body min-h-screen flex flex-col overflow-x-hidden">
      {/* Landing Navbar */}
      <nav className={`landing-nav py-4 px-6 md:px-12 flex items-center justify-between transition-all duration-300 ${
        isScrolled ? 'landing-nav.scrolled bg-[#141413]/90 text-white shadow-xl' : 'bg-transparent text-white'
      }`}>
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-[-0.04em]">HireVision</span>
          <span className="text-[10px] font-bold uppercase tracking-widest bg-[#F37338] text-white px-2 py-0.5 rounded">DSS</span>
        </div>
        <button
          onClick={onStart}
          className="cursor-pointer rounded-full bg-white hover:bg-[#F37338] text-[#141413] hover:text-white px-6 py-2 text-xs font-extrabold tracking-tight transition-all duration-200 active:scale-95"
        >
          Mulai Analisis
        </button>
      </nav>

      {/* Hero Section */}
      <header className="landing-hero pt-32 pb-24 px-6 md:px-12 flex flex-col items-center justify-center text-center min-h-[90vh]">
        <div className="landing-hero-orb" />
        <div className="landing-hero-orb-2" />

        <div className="relative z-10 max-w-4xl flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
            <span className="flex h-2 w-2 rounded-full bg-[#F37338] animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">
              Interactive Decision Support System
            </span>
          </div>

          <h1 className="text-4xl md:text-6.5xl font-extrabold tracking-[-0.03em] leading-[1.08] text-white">
            Navigasi Karir & <span className="gradient-text-orange">Gaji Ideal</span> Anda di Jabodetabek
          </h1>

          <p className="max-w-2xl text-base md:text-lg leading-relaxed text-white/70">
            Ukur kelayakan finansial Anda secara presisi. Prediksi gaji pasar kompetitif, petakan lokasi industri, simulasikan rute komuter harian, dan konsultasikan karir Anda bersama AI expert.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <button
              onClick={onStart}
              type="button"
              className="cursor-pointer inline-flex items-center justify-center gap-2.5 rounded-full bg-[#F37338] hover:bg-[#CF4500] px-8 py-4 text-sm font-extrabold text-white transition-all duration-200 shadow-lg shadow-[#F37338]/20 hover:scale-[1.03] active:scale-[0.98]"
            >
              Mulai Analisis Sekarang
              <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <a
              href="#features"
              className="inline-flex items-center justify-center gap-2.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 px-8 py-4 text-sm font-bold text-white transition-all backdrop-blur-sm"
            >
              Pelajari Fitur
            </a>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-16 w-full pt-10 border-t border-white/10">
            <div className="landing-stat-card text-center">
              <p className="text-2xl md:text-3.5xl font-extrabold text-[#F37338]">98%</p>
              <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wider font-bold">Akurasi Model</p>
            </div>
            <div className="landing-stat-card text-center">
              <p className="text-2xl md:text-3.5xl font-extrabold text-white">10+</p>
              <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wider font-bold">Kategori Industri</p>
            </div>
            <div className="landing-stat-card text-center">
              <p className="text-2xl md:text-3.5xl font-extrabold text-white">5 Wilayah</p>
              <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wider font-bold">Cakupan Kota</p>
            </div>
            <div className="landing-stat-card text-center">
              <p className="text-2xl md:text-3.5xl font-extrabold text-white">AI Consult</p>
              <p className="text-[10px] text-white/50 mt-1 uppercase tracking-wider font-bold">Rekomendasi Pintar</p>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-[1280px] mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="eyebrow justify-center">Alur Keputusan DSS</p>
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-3 text-[#141413]">
            Fitur Utama Pendukung Keputusan Karir
          </h2>
          <p className="text-sm md:text-base text-[#696969] mt-3">
            Analisis data riil pasar tenaga kerja di wilayah DKI Jakarta, Bogor, Depok, Tangerang, dan Bekasi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="landing-card">
            <div className="landing-card-icon">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#141413] mb-2">Salary Prediction</h3>
            <p className="text-sm leading-relaxed text-[#696969] mb-4">
              Hitung estimasi gaji berdasarkan posisi, kategori pekerjaan, level pengalaman, latar pendidikan, dan sertifikasi.
            </p>
            <span className="text-xs font-bold text-[#F37338] mt-auto">Langkah Pertama &rarr;</span>
          </div>

          {/* Card 2 */}
          <div className="landing-card">
            <div className="landing-card-icon">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#141413] mb-2">Spatial Map</h3>
            <p className="text-sm leading-relaxed text-[#696969] mb-4">
              Visualisasikan sebaran pasar kerja dan bandingkan biaya hunian (kos) antar wilayah untuk menemukan lokasi kerja terbaik.
            </p>
            <span className="text-xs font-bold text-[#F37338] mt-auto">Analisis Spasial &rarr;</span>
          </div>

          {/* Card 3 */}
          <div className="landing-card">
            <div className="landing-card-icon">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#141413] mb-2">Commuter Simulator</h3>
            <p className="text-sm leading-relaxed text-[#696969] mb-4">
              Simulasikan rute, jarak tempuh, durasi perjalanan, serta kalkulasi pengeluaran bulanan transportasi harian Anda.
            </p>
            <span className="text-xs font-bold text-[#F37338] mt-auto">Ukur Efisiensi &rarr;</span>
          </div>

          {/* Card 4 */}
          <div className="landing-card">
            <div className="landing-card-icon">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#141413] mb-2">Career Analytics</h3>
            <p className="text-sm leading-relaxed text-[#696969] mb-4">
              Dapatkan DSS Feasibility Score kelayakan finansial Anda beserta proyeksi kenaikan jenjang karir dan pertumbuhan gaji berkala.
            </p>
            <span className="text-xs font-bold text-[#F37338] mt-auto">Rencana Karir &rarr;</span>
          </div>

          {/* Card 5 */}
          <div className="landing-card lg:col-span-2">
            <div className="landing-card-icon">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-[#141413] mb-2">AI Consultant Expert</h3>
            <p className="text-sm leading-relaxed text-[#696969] mb-4">
              Asisten bimbingan berbasis AI yang menganalisis profil dan memberikan rekomendasi taktis negosiasi gaji, pemilihan kos murah dekat MRT/LRT, dan peluang karir di Jabodetabek.
            </p>
            <span className="text-xs font-bold text-[#F37338] mt-auto">Bimbingan Interaktif &rarr;</span>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section className="py-20 px-6 md:px-12 max-w-[1200px] mx-auto w-full my-12">
        <div className="landing-cta-banner text-white rounded-[36px] p-8 md:p-16 text-center relative overflow-hidden flex flex-col items-center gap-6">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight max-w-2xl leading-tight">
            Siap Menentukan Langkah Karir Terbaik Anda?
          </h2>
          <p className="text-sm md:text-base text-white/70 max-w-xl">
            Gunakan model DSS interaktif kami secara instan untuk mendapatkan insight gaji, opsi hunian terbaik, dan saran karir yang dipersonalisasi.
          </p>
          <button
            onClick={onStart}
            type="button"
            className="cursor-pointer inline-flex items-center justify-center gap-2 rounded-full bg-[#F37338] hover:bg-[#CF4500] px-8 py-4 text-sm font-extrabold text-white transition-all shadow-lg hover:scale-105 active:scale-95 mt-4"
          >
            Mulai Hitung Sekarang
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-8 bg-[#141413] text-white/50 text-xs border-t border-white/5 text-center">
        <p>&copy; 2026 HireVision Decision Support System. All rights reserved.</p>
        <p className="mt-1 text-white/30">Didukung oleh Machine Learning dan AI Consultant.</p>
      </footer>
    </div>
  )
}

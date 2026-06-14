type ErrorBannerProps = {
  message: string | null
}

/**
 * Banner error global.
 * Dipakai untuk menampilkan pesan API/form tanpa mengubah layout halaman utama.
 */
export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null

  return (
    <div className="animate-fade-slide-down mb-4 flex items-start gap-3 rounded-[20px] border border-[#CF4500]/20 bg-white px-5 py-4 text-sm text-[#9A3A0A] shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      <span className="mt-px shrink-0 text-base leading-none" aria-hidden="true">⚠</span>
      <span className="leading-6">{message}</span>
    </div>
  )
}


type ErrorBannerProps = {
  message: string | null
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null

  return (
    <div className="rounded-[20px] border border-[#CF4500]/30 bg-white px-5 py-4 text-sm text-[#9A3A0A]">
      {message}
    </div>
  )
}


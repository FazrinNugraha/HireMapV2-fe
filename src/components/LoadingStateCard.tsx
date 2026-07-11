type LoadingStateCardProps = {
  title: string
  description: string
}

export function LoadingStateCard({ title, description }: LoadingStateCardProps) {
  return (
    <div className="flex min-h-80 flex-1 flex-col items-center justify-center rounded-3xl border border-[#E5E2E0] bg-white p-6 text-center shadow-[0_8px_30px_rgba(0,0,0,0.06)] md:min-h-105 md:rounded-4xl md:p-10">
      <div className="relative flex items-center justify-center">
        <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-[#3860BE]/10 opacity-75" />
        <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#3860BE]/10 text-[#3860BE]">
          <svg className="h-6 w-6 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      </div>
      <h3 className="mt-6 text-base font-bold text-[#141413] md:text-lg">
        {title}
      </h3>
      <p className="mt-2 max-w-sm text-xs leading-5 text-[#696969]">
        {description}
      </p>
    </div>
  )
}
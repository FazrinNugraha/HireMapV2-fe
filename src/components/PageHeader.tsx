import { API_BASE_URL } from '../services/api'

export function PageHeader() {
  return (
    <header className="rounded-[32px] bg-white px-6 py-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
      <p className="text-sm font-bold tracking-[0.04em] text-[#CF4500] uppercase">
        HireMap Integration
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.02em] md:text-5xl">
        Salary prediction flow
      </h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-[#565656] md:text-base">
        Frontend ini fokus menyambungkan React ke FastAPI dulu. API aktif:{' '}
        <code className="rounded-full bg-[#F3F0EE] px-3 py-1 text-sm">{API_BASE_URL}</code>
      </p>
    </header>
  )
}


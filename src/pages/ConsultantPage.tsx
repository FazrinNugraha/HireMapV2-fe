import { useRef, type FormEvent } from 'react'
import { ActiveCareerContext } from '../components/ActiveCareerContext'
import { AiConsultantCard } from '../components/AiConsultantCard'
import type { ChatMessage, SalaryPredictionResponse } from '../types/api'

type ConsultantPageProps = {
  prediction: SalaryPredictionResponse | null
  chatInput: string
  chatHistory: ChatMessage[]
  isChatLoading: boolean
  onGoToSalary: () => void
  onChatInputChange: (value: string) => void
  onQuickQuestion: (value: string) => void
  onChatSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function ConsultantPage({
  prediction,
  chatInput,
  chatHistory,
  isChatLoading,
  onGoToSalary,
  onChatInputChange,
  onQuickQuestion,
  onChatSubmit,
}: ConsultantPageProps) {
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <main className="mx-auto grid w-full max-w-[1280px] grid-cols-1 gap-6 px-5 py-8 md:grid-cols-12 md:px-10">
      <ActiveCareerContext prediction={prediction} onGoToSalary={onGoToSalary} />
      <AiConsultantCard
        chatInput={chatInput}
        chatHistory={chatHistory}
        isLoading={isChatLoading}
        hasPredictionContext={prediction !== null}
        formRef={formRef}
        onChatInputChange={onChatInputChange}
        onQuickQuestion={onQuickQuestion}
        onSubmit={onChatSubmit}
      />
    </main>
  )
}

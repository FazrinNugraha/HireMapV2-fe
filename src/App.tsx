import { useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorBanner } from './components/ErrorBanner'
import { AppShell } from './components/layout/AppShell'
import {
  DEFAULT_CHAT_MESSAGE,
  DEFAULT_SALARY_FORM,
  DEFAULT_TARGET_SALARY,
} from './constants/defaults'
import { useMetadata } from './hooks/useMetadata'
import { ConsultantPage } from './pages/ConsultantPage'
import { SalaryPage } from './pages/SalaryPage'
import { SpatialPage } from './pages/SpatialPage'
import { evaluateSalary, predictSalary, sendAiChat } from './services/api'
import type {
  ChatMessage,
  SalaryEvaluationResponse,
  SalaryPredictionRequest,
  SalaryPredictionResponse,
} from './types/api'
import type { AppLayer } from './types/navigation'

type LoadingState = {
  prediction: boolean
  evaluation: boolean
  chat: boolean
}

const INITIAL_LOADING_STATE: LoadingState = {
  prediction: false,
  evaluation: false,
  chat: false,
}

export default function App() {
  const [activeLayer, setActiveLayer] = useState<AppLayer>('salary')
  const [form, setForm] = useState<SalaryPredictionRequest>(DEFAULT_SALARY_FORM)
  const [prediction, setPrediction] = useState<SalaryPredictionResponse | null>(null)
  const [evaluation, setEvaluation] = useState<SalaryEvaluationResponse | null>(null)
  const [targetSalary, setTargetSalary] = useState(DEFAULT_TARGET_SALARY)
  const [chatInput, setChatInput] = useState(DEFAULT_CHAT_MESSAGE)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState<LoadingState>(INITIAL_LOADING_STATE)
  const [error, setError] = useState<string | null>(null)

  const {
    metadata,
    isLoading: isMetadataLoading,
    error: metadataError,
  } = useMetadata(setForm)

  const visibleError = error ?? metadataError

  async function handlePredict(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!metadata || loading.prediction || form.job_title.trim().length === 0) return

    setError(null)
    setEvaluation(null)
    setLoading((current) => ({ ...current, prediction: true }))

    try {
      const result = await predictSalary({
        ...form,
        job_title: form.job_title.trim(),
      })
      setPrediction(result)
      setChatHistory([])
    } catch (predictionError) {
      setError(getErrorMessage(predictionError, 'Gagal menghitung prediksi gaji.'))
    } finally {
      setLoading((current) => ({ ...current, prediction: false }))
    }
  }

  async function handleEvaluate() {
    if (!prediction || loading.evaluation) return

    const salaryInRupiah = Math.round(Number(targetSalary) * 1_000_000)
    if (!Number.isFinite(salaryInRupiah) || salaryInRupiah <= 0) {
      setError('Masukkan angka gaji evaluasi yang valid.')
      return
    }

    setError(null)
    setLoading((current) => ({ ...current, evaluation: true }))

    try {
      const result = await evaluateSalary({
        input_salary: salaryInRupiah,
        prediction,
      })
      setEvaluation(result)
    } catch (evaluationError) {
      setError(getErrorMessage(evaluationError, 'Gagal mengevaluasi gaji.'))
    } finally {
      setLoading((current) => ({ ...current, evaluation: false }))
    }
  }

  async function handleChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const message = chatInput.trim()
    if (!message || loading.chat) return

    const nextHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: message }]
    setChatHistory(nextHistory)
    setChatInput('')
    setError(null)
    setLoading((current) => ({ ...current, chat: true }))

    try {
      const result = await sendAiChat({
        message,
        history: chatHistory,
        prediction_context: prediction,
      })
      setChatHistory([...nextHistory, { role: 'assistant', content: result.reply }])
    } catch (chatError) {
      setError(getErrorMessage(chatError, 'Gagal menghubungi AI consultant.'))
    } finally {
      setLoading((current) => ({ ...current, chat: false }))
    }
  }

  return (
    <AppShell activeLayer={activeLayer} onLayerChange={setActiveLayer}>
      <div className="mx-auto w-full max-w-[1280px] px-5 md:px-10">
        <ErrorBanner message={visibleError} />
      </div>

      {activeLayer === 'salary' && (
        <SalaryPage
          form={form}
          metadata={metadata}
          prediction={prediction}
          evaluation={evaluation}
          targetSalary={targetSalary}
          isMetadataLoading={isMetadataLoading}
          isPredicting={loading.prediction}
          isEvaluating={loading.evaluation}
          onFormChange={setForm}
          onPredict={handlePredict}
          onTargetSalaryChange={setTargetSalary}
          onEvaluate={handleEvaluate}
        />
      )}

      {activeLayer === 'spatial' && (
        <SpatialPage metadata={metadata} prediction={prediction} />
      )}

      {activeLayer === 'consultant' && (
        <ConsultantPage
          prediction={prediction}
          chatInput={chatInput}
          chatHistory={chatHistory}
          isChatLoading={loading.chat}
          onGoToSalary={() => setActiveLayer('salary')}
          onChatInputChange={setChatInput}
          onQuickQuestion={setChatInput}
          onChatSubmit={handleChat}
        />
      )}
    </AppShell>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}


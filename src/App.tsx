import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'
import { ErrorBanner } from './components/ErrorBanner'
import { AppShell } from './components/layout/AppShell'
import {
  DEFAULT_CHAT_MESSAGE,
  DEFAULT_SALARY_FORM,
} from './constants/defaults'
import { useMetadata } from './hooks/useMetadata'
import { AnalysisPage } from './pages/AnalysisPage'
import { ConsultantPage } from './pages/ConsultantPage'
import { SalaryPage } from './pages/SalaryPage'
import { SpatialPage } from './pages/SpatialPage'
import { predictSalary, sendAiChat, getSpatialSummary } from './services/api'
import type {
  ChatMessage,
  SalaryPredictionRequest,
  SalaryPredictionResponse,
  SpatialSummaryItem,
} from './types/api'
import type { AppLayer } from './types/navigation'

type LoadingState = {
  prediction: boolean
  chat: boolean
}

const INITIAL_LOADING_STATE: LoadingState = {
  prediction: false,
  chat: false,
}

export default function App() {
  const [activeLayer, setActiveLayer] = useState<AppLayer>('salary')
  const [form, setForm] = useState<SalaryPredictionRequest>(DEFAULT_SALARY_FORM)
  const [prediction, setPrediction] = useState<SalaryPredictionResponse | null>(null)
  const [spatialSummary, setSpatialSummary] = useState<SpatialSummaryItem[]>([])

  useEffect(() => {
    getSpatialSummary()
      .then(setSpatialSummary)
      .catch(console.error)
  }, [])

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
    setLoading((current) => ({ ...current, prediction: true }))

    try {
      const startTime = Date.now()

      const result = await predictSalary({
        ...form,
        job_title: form.job_title.trim(),
      })

      // Force loading state to stay active for 2.2 seconds (2200ms)
      const elapsedTime = Date.now() - startTime
      const delayNeeded = 2200 - elapsedTime
      if (delayNeeded > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayNeeded))
      }

      setPrediction(result)
      setChatHistory([])
    } catch (predictionError) {
      setError(getErrorMessage(predictionError, 'Gagal menghitung prediksi gaji.'))
    } finally {
      setLoading((current) => ({ ...current, prediction: false }))
    }
  }



  // Called from FeasibilityScoreCard → navigate to AI Consultant and pre-fill the audit prompt
  function handleRequestAudit(prompt: string) {
    setChatInput(prompt)
    setActiveLayer('consultant')
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
      const startTime = Date.now()

      const result = await sendAiChat({
        message,
        history: chatHistory,
        prediction_context: prediction,
      })

      // Paksa animasi typing loading bertahan minimal 3 detik (3000ms)
      const elapsedTime = Date.now() - startTime
      const delayNeeded = 3000 - elapsedTime
      if (delayNeeded > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayNeeded))
      }

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
          spatialSummary={spatialSummary}
          isMetadataLoading={isMetadataLoading}
          isPredicting={loading.prediction}
          onFormChange={setForm}
          onPredict={handlePredict}
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

      {activeLayer === 'analysis' && (
        <AnalysisPage
          prediction={prediction}
          spatialSummary={spatialSummary}
          onGoToSalary={() => setActiveLayer('salary')}
          onRequestAudit={handleRequestAudit}
        />
      )}
    </AppShell>
  )
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}


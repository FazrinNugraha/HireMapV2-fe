import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ErrorBanner } from './components/ErrorBanner'
import { AppShell } from './components/layout/AppShell'
import {
  DEFAULT_CHAT_MESSAGE,
  DEFAULT_SALARY_FORM,
} from './constants/defaults'
import { useMetadata } from './hooks/useMetadata'
import { AnalysisPage } from './pages/AnalysisPage'
import { CommuterPage } from './pages/CommuterPage'
import { ConsultantPage } from './pages/ConsultantPage'
import { SalaryPage } from './pages/SalaryPage'
import { SpatialPage } from './pages/SpatialPage'
import { getSpatialSummary, predictSalary, sendAiChat } from './services/api'
import type {
  ChatMessage,
  SalaryPredictionRequest,
  SalaryPredictionResponse,
  SpatialSummaryItem,
} from './types/api'
import type { AppLayer } from './types/navigation'

const PREDICTION_LOADING_DELAY_MS = 2200
const CHAT_LOADING_DELAY_MS = 3000

type LoadingState = {
  prediction: boolean
  chat: boolean
}

const INITIAL_LOADING_STATE: LoadingState = {
  prediction: false,
  chat: false,
}

// Root aplikasi: menyimpan state global yang dipakai lintas tab.
export default function App() {
  const [activeLayer, setActiveLayer] = useState<AppLayer>('salary')
  const [form, setForm] = useState<SalaryPredictionRequest>(DEFAULT_SALARY_FORM)
  const [prediction, setPrediction] = useState<SalaryPredictionResponse | null>(null)
  const [spatialSummary, setSpatialSummary] = useState<SpatialSummaryItem[]>([])
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

  // Data spasial dipakai oleh Analisis Karir untuk DSS score.
  useEffect(() => {
    getSpatialSummary()
      .then(setSpatialSummary)
      .catch(console.error)
  }, [])

  // Submit form salary, lalu simpan hasilnya sebagai konteks global aplikasi.
  async function handlePredict(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const jobTitle = form.job_title.trim()
    if (!metadata || loading.prediction || jobTitle.length === 0) return

    setError(null)
    setLoadingState('prediction', true)

    try {
      const startedAt = Date.now()
      const result = await predictSalary({ ...form, job_title: jobTitle })

      await waitForMinimumDuration(startedAt, PREDICTION_LOADING_DELAY_MS)

      setPrediction(result)
      setChatHistory([])
    } catch (predictionError) {
      setError(getErrorMessage(predictionError, 'Gagal menghitung prediksi gaji.'))
    } finally {
      setLoadingState('prediction', false)
    }
  }

  // Dari DSS score, user bisa langsung membuka AI Consultant dengan prompt audit.
  function handleRequestAudit(prompt: string) {
    setChatInput(prompt)
    setActiveLayer('consultant')
  }

  // Submit pesan chat dan tambahkan balasan AI ke history.
  async function handleChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const message = chatInput.trim()
    if (!message || loading.chat) return

    const nextHistory: ChatMessage[] = [
      ...chatHistory,
      { role: 'user', content: message },
    ]

    setChatHistory(nextHistory)
    setChatInput('')
    setError(null)
    setLoadingState('chat', true)

    try {
      const startedAt = Date.now()
      const result = await sendAiChat({
        message,
        history: chatHistory,
        prediction_context: prediction,
      })

      await waitForMinimumDuration(startedAt, CHAT_LOADING_DELAY_MS)

      setChatHistory([...nextHistory, { role: 'assistant', content: result.reply }])
    } catch (chatError) {
      setError(getErrorMessage(chatError, 'Gagal menghubungi AI consultant.'))
    } finally {
      setLoadingState('chat', false)
    }
  }

  // Helper kecil agar update loading per fitur tetap konsisten.
  function setLoadingState(key: keyof LoadingState, value: boolean) {
    setLoading((current) => ({ ...current, [key]: value }))
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
          isMetadataLoading={isMetadataLoading}
          isPredicting={loading.prediction}
          onFormChange={setForm}
          onPredict={handlePredict}
        />
      )}

      {activeLayer === 'spatial' && (
        <SpatialPage metadata={metadata} prediction={prediction} />
      )}

      {activeLayer === 'commuter' && (
        <CommuterPage
          prediction={prediction}
          spatialSummary={spatialSummary}
          onGoToSalary={() => setActiveLayer('salary')}
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

// Menjaga loading minimal agar transisi UI tidak terasa terlalu mendadak.
async function waitForMinimumDuration(startedAt: number, minimumDuration: number) {
  const elapsedTime = Date.now() - startedAt
  const delayNeeded = minimumDuration - elapsedTime

  if (delayNeeded > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayNeeded))
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

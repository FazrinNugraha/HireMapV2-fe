import type { FormEvent } from 'react'
import { QUICK_CHAT_QUESTIONS } from '../constants/defaults'
import type { ChatMessage } from '../types/api'

type AiConsultantCardProps = {
  chatInput: string
  chatHistory: ChatMessage[]
  isLoading: boolean
  hasPredictionContext: boolean
  onChatInputChange: (value: string) => void
  onQuickQuestion: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function AiConsultantCard({
  chatInput,
  chatHistory,
  isLoading,
  hasPredictionContext,
  onChatInputChange,
  onQuickQuestion,
  onSubmit,
}: AiConsultantCardProps) {
  return (
    <section className="flex h-[calc(100vh-190px)] min-h-[620px] flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_4px_20px_rgba(0,0,0,0.08)] md:col-span-8">
      <div className="border-b border-[#e4e2dc] bg-white p-6">
        <h1 className="text-3xl font-semibold tracking-[-0.02em] text-[#000000]">
          AI Career Consultant
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#464742]">
          Ask about negotiation, interview strategy, skill growth, or housing decisions.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_CHAT_QUESTIONS.map((question) => (
            <button
              className="rounded-full border border-[#c7c7c0] bg-[#fbf9f3] px-4 py-2 text-sm font-semibold text-[#1b1c18] transition-colors hover:border-[#000000]"
              type="button"
              key={question}
              onClick={() => onQuickQuestion(question)}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-6 overflow-y-auto bg-[#fbf9f3] p-6">
        {chatHistory.length === 0 ? (
          <WelcomeMessage hasPredictionContext={hasPredictionContext} />
        ) : (
          chatHistory.map((message, index) => (
            <ChatBubble message={message} key={`${message.role}-${index}`} />
          ))
        )}
      </div>

      <form className="border-t border-[#e4e2dc] bg-white p-6" onSubmit={onSubmit}>
        <div className="flex items-center gap-4 rounded-full bg-[#efeee7] p-2 pl-6 focus-within:ring-2 focus-within:ring-[#000000]">
          <input
            className="min-w-0 flex-1 border-none bg-transparent text-sm text-[#000000] outline-none placeholder:text-[#464742]"
            value={chatInput}
            onChange={(event) => onChatInputChange(event.target.value)}
            placeholder="Ask about salary, career, interview, or housing strategy..."
          />
          <button
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#000000] text-white transition-colors hover:bg-[#aa3700] disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={isLoading}
            aria-label="Send message"
          >
            {isLoading ? '…' : '→'}
          </button>
        </div>
      </form>
    </section>
  )
}

function WelcomeMessage({ hasPredictionContext }: { hasPredictionContext: boolean }) {
  return (
    <div className="flex max-w-[85%] gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#000000] text-white">
        AI
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-[#e4e2dc] p-4 text-sm leading-6 text-[#000000]">
        {hasPredictionContext
          ? 'Saya sudah menerima konteks prediksi terbaru. Tanyakan negosiasi gaji, strategi interview, skill growth, atau keputusan hunian.'
          : 'Jalankan prediksi gaji dulu agar saya bisa memberi saran yang lebih personal berdasarkan posisi, lokasi, dan estimasi kos.'}
      </div>
    </div>
  )
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex max-w-[85%] gap-4 ${isUser ? 'self-end flex-row-reverse' : ''}`}>
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          isUser ? 'bg-[#e4e2dc] text-[#000000]' : 'bg-[#000000] text-white'
        }`}
      >
        {isUser ? 'U' : 'AI'}
      </div>
      <div
        className={`rounded-2xl p-4 text-sm leading-6 ${
          isUser
            ? 'rounded-tr-sm bg-[#000000] text-white'
            : 'rounded-tl-sm bg-[#e4e2dc] text-[#000000]'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}


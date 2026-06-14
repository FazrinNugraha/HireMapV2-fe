import type { FormEvent, RefObject } from "react";
import { FeatureHeader } from "./FeatureHeader";
import { QUICK_CHAT_QUESTIONS } from "../constants/defaults";
import type { ChatMessage } from "../types/api";

type AiConsultantCardProps = {
  chatInput: string;
  chatHistory: ChatMessage[];
  isLoading: boolean;
  hasPredictionContext: boolean;
  formRef?: RefObject<HTMLFormElement | null>;
  onChatInputChange: (value: string) => void;
  onQuickQuestion: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

/**
 * Chat card untuk AI Career Consultant.
 * Komponen ini hanya menangani tampilan chat; state dan request API tetap dikontrol dari page.
 */
export function AiConsultantCard({
  chatInput,
  chatHistory,
  isLoading,
  hasPredictionContext,
  formRef,
  onChatInputChange,
  onQuickQuestion,
  onSubmit,
}: AiConsultantCardProps) {
  return (
    <section className="flex h-full min-h-[700px] min-w-0 flex-col overflow-hidden rounded-[32px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.08)] md:col-span-8">
      {/* Header */}
      <div className="border-b border-[#E4E2DC] bg-white p-6 md:p-7">
        <FeatureHeader
          title="AI Career Consultant"
          description="Tanyakan soal negosiasi, strategi interview, skill growth, atau keputusan hunian."
        />

        {/* Quick question chips */}
        <div className="mt-4 flex flex-wrap gap-2">
          {QUICK_CHAT_QUESTIONS.map((question) => (
            <button
              className="rounded-full border border-[#C7C7C0] bg-[#F3F0EE] px-4 py-2 text-xs font-semibold text-[#141413] transition-all hover:border-[#141413] hover:bg-white"
              type="button"
              key={question}
              onClick={() => onQuickQuestion(question)}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Chat body */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto bg-[#FCFBFA] p-6">
        {chatHistory.length === 0 ? (
          <WelcomeMessage hasPredictionContext={hasPredictionContext} />
        ) : (
          chatHistory.map((message, index) => (
            <ChatBubble message={message} key={`${message.role}-${index}`} />
          ))
        )}
        {isLoading && <TypingIndicator />}
      </div>

      {/* Input */}
      <form
        className="border-t border-[#E4E2DC] bg-white p-5"
        onSubmit={onSubmit}
        ref={formRef}
      >
        <div className="flex items-center gap-3 rounded-full bg-[#EFEEE7] p-1.5 pl-5 focus-within:ring-2 focus-within:ring-[#141413]/20">
          <input
            className="min-w-0 flex-1 border-none bg-transparent text-sm text-[#141413] outline-none placeholder:text-[#696969]"
            value={chatInput}
            onChange={(event) => onChatInputChange(event.target.value)}
            placeholder="Tanya soal gaji, karir, interview, atau hunian..."
          />
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#141413] text-white transition-colors hover:bg-[#AA3700] disabled:cursor-not-allowed disabled:opacity-50"
            type="submit"
            disabled={isLoading || !chatInput.trim()}
            aria-label="Kirim pesan"
          >
            {isLoading ? (
              <span
                className="spinner"
                style={{ width: "14px", height: "14px", borderWidth: "1.5px" }}
              />
            ) : (
              <span className="text-base leading-none">→</span>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

const IconUser = (
  <svg
    className="w-5 h-5 text-[#141413]"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const IconConsultant = (
  <svg
    className="w-5 h-5 text-white"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
    <path d="m12 11 1 2-1 2-1-2z" />
  </svg>
);

function WelcomeMessage({
  hasPredictionContext,
}: {
  hasPredictionContext: boolean;
}) {
  return (
    <div className="flex max-w-[85%] gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#141413] text-white">
        {IconConsultant}
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-[#E4E2DC] px-4 py-3 text-sm leading-6 text-[#141413]">
        {hasPredictionContext
          ? "Saya sudah menerima konteks prediksi terbaru. Tanyakan negosiasi gaji, strategi interview, skill growth, atau keputusan hunian."
          : "Jalankan prediksi gaji dulu agar saya bisa memberi saran yang lebih personal berdasarkan posisi, lokasi, dan estimasi kos."}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex max-w-[85%] gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#141413] text-white">
        {IconConsultant}
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-[#E4E2DC] px-4 py-3">
        <span
          className="h-2 w-2 animate-bounce rounded-full bg-[#696969]"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="h-2 w-2 animate-bounce rounded-full bg-[#696969]"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="h-2 w-2 animate-bounce rounded-full bg-[#696969]"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex max-w-[85%] gap-3 ${isUser ? "self-end flex-row-reverse" : ""}`}
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-[#EFEEE7]" : "bg-[#141413]"
        }`}
      >
        {isUser ? IconUser : IconConsultant}
      </div>
      <div
        className={`rounded-2xl px-4 py-3 text-sm leading-6 ${
          isUser
            ? "rounded-tr-sm bg-[#141413] text-[#F3F0EE]"
            : "max-h-[360px] overflow-y-auto rounded-tl-sm bg-[#E4E2DC] text-[#141413]"
        }`}
      >
        {isUser ? message.content : parseMarkdown(message.content)}
      </div>
    </div>
  );
}

// Parser markdown ringan untuk response AI. Sengaja terbatas agar output tetap aman dan konsisten.
function parseMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, index) => {
        const currentLine = line.trim();

        // Horizontal rule
        if (currentLine === "---") {
          return <hr key={index} className="my-3 border-t border-[#C7C7C0]" />;
        }

        // Headings
        if (currentLine.startsWith("####")) {
          return (
            <h4
              key={index}
              className="mt-3 mb-1 text-sm font-bold text-[#141413]"
            >
              {renderInlineMarkdown(currentLine.replace(/^####\s*/, ""))}
            </h4>
          );
        }
        if (currentLine.startsWith("###")) {
          return (
            <h3
              key={index}
              className="mt-4 mb-1 text-base font-bold text-[#141413]"
            >
              {renderInlineMarkdown(currentLine.replace(/^###\s*/, ""))}
            </h3>
          );
        }
        if (currentLine.startsWith("##")) {
          return (
            <h2
              key={index}
              className="mt-4 mb-2 text-lg font-bold text-[#141413]"
            >
              {renderInlineMarkdown(currentLine.replace(/^##\s*/, ""))}
            </h2>
          );
        }

        // List items
        if (currentLine.startsWith("* ") || currentLine.startsWith("- ")) {
          const cleanText = currentLine.replace(/^[*-]\s*/, "");
          return (
            <li
              key={index}
              className="ml-4 list-disc text-sm text-[#262627] mb-1"
            >
              {renderInlineMarkdown(cleanText)}
            </li>
          );
        }

        // Empty line
        if (!currentLine) {
          return <div key={index} className="h-2" />;
        }

        // Normal paragraph
        return (
          <p key={index} className="text-sm text-[#262627] leading-6">
            {renderInlineMarkdown(currentLine)}
          </p>
        );
      })}
    </div>
  );
}

// Renderer inline hanya mendukung bold/italic sederhana yang umum keluar dari AI.
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const boldText = part.slice(2, -2);
      return (
        <strong key={index} className="font-bold text-[#141413]">
          {boldText}
        </strong>
      );
    }
    const subParts = part.split(/(\*.*?\*)/g);
    if (subParts.length > 1) {
      return (
        <span key={index}>
          {subParts.map((subPart, subIndex) => {
            if (subPart.startsWith("*") && subPart.endsWith("*")) {
              return (
                <em key={subIndex} className="italic">
                  {subPart.slice(1, -1)}
                </em>
              );
            }
            return subPart;
          })}
        </span>
      );
    }
    return part;
  });
}

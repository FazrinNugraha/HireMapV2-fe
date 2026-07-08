import { useRef, type FormEvent } from "react";
import { ActiveCareerContext } from "../components/ActiveCareerContext";
import { AiConsultantCard } from "../components/AiConsultantCard";
import type { ChatMessage, SalaryPredictionResponse } from "../types/api";

type ConsultantPageProps = {
  prediction: SalaryPredictionResponse | null;
  chatInput: string;
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
  onGoToSalary: () => void;
  onPrevStep: () => void;
  onChatInputChange: (value: string) => void;
  onQuickQuestion: (value: string) => void;
  onChatSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

// Halaman AI Consultant: konteks prediksi di kiri, chat rekomendasi di kanan.
export function ConsultantPage({
  prediction,
  chatInput,
  chatHistory,
  isChatLoading,
  onGoToSalary,
  onPrevStep,
  onChatInputChange,
  onQuickQuestion,
  onChatSubmit,
}: ConsultantPageProps) {
  // Ref dipakai komponen chat untuk submit/focus form dari quick action.
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <main className="page-shell flex flex-col gap-6 md:gap-8">
      {/* Header section with step back navigation */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="page-title">
            AI Consultant
          </h1>
          <p className="page-description">
            Konsultasi karir interaktif yang didukung AI berbasis profil kelayakan Anda.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={onPrevStep}
            className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-[#E5E2E0] bg-white px-4 py-2 text-xs font-bold text-[#696969] hover:text-[#141413] transition-all active:scale-95"
          >
            &lt; Sebelumnya
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-12">
        <ActiveCareerContext
          prediction={prediction}
          onGoToSalary={onGoToSalary}
        />
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
      </div>
    </main>
  );
}

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
  onChatInputChange,
  onQuickQuestion,
  onChatSubmit,
}: ConsultantPageProps) {
  // Ref dipakai komponen chat untuk submit/focus form dari quick action.
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <main className="page-shell grid grid-cols-1 items-stretch gap-6 md:grid-cols-12">
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
    </main>
  );
}

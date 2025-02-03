/* eslint-disable @typescript-eslint/no-unused-vars */
import { Questions, QuestionAnswers } from "@/app/types";

interface QuestionsSectionProps {
  questions: Questions;
  answers: QuestionAnswers;
  onAnswer: (questionKey: keyof Questions, answer: "oui" | "non") => void;
  onGenerateResume: () => void;
  loadingResume: boolean;
}

export function QuestionsSection({
  questions,
  answers,
  onAnswer,
  onGenerateResume,
  loadingResume,
}: QuestionsSectionProps) {
  const allQuestionsAnswered = Object.keys(answers).length === Object.keys(questions).length;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Questions complémentaires</h2>
      <div className="space-y-2">
        {Object.entries(questions).map(([key, question]) => {
          const isAnswered = answers[question] !== undefined;
          return (
            <div key={key} className={`p-3 rounded-md transition-all ${
              isAnswered ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'
            }`}>
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-gray-700">{question}</p>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => onAnswer(key, "oui")}
                    disabled={loadingResume}
                    className={`px-3 py-1 rounded-md text-sm transition-all ${
                      answers[question] === "oui"
                        ? "bg-green-600 text-white ring-2 ring-green-600 ring-offset-2"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Oui
                  </button>
                  <button
                    onClick={() => onAnswer(key, "non")}
                    disabled={loadingResume}
                    className={`px-3 py-1 rounded-md text-sm transition-all ${
                      answers[question] === "non"
                        ? "bg-red-600 text-white ring-2 ring-red-600 ring-offset-2"
                        : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    Non
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {loadingResume && (
        <div className="text-sm text-gray-600 animate-pulse text-center">
          Mise à jour de l&apos;analyse en cours...
        </div>
      )}

      {!allQuestionsAnswered && (
        <div className="text-sm text-gray-600 text-center">
          Répondez à toutes les questions pour mettre à jour l&apos;analyse
        </div>
      )}

      {allQuestionsAnswered && !loadingResume && (
        <button
          onClick={onGenerateResume}
          className="w-full mt-2 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
        >
          Générer le résumé
        </button>
      )}
    </div>
  );
}

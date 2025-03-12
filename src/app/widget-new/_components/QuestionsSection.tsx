import { QuestionAnswers, Questions } from "@/app/types";
import { generateResume } from "@/app/actions";
import React, { useState } from "react";
import type { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { Button } from "./Button";

interface QuestionsSectionProps {
  questions: Questions;
  answers: QuestionAnswers;
  setAnswers: React.Dispatch<React.SetStateAction<QuestionAnswers>>;
  setDescriptionHasBeenUpdated: React.Dispatch<React.SetStateAction<boolean>>;
  intitule: string;
  currentSelection: RowRecord | null;
  columnMapping: WidgetColumnMap | null;
  goToThematiquesLeviers: () => void;
}

export function QuestionsSection({
  questions,
  answers,
  setAnswers,
  intitule,
  currentSelection,
  columnMapping,
  goToThematiquesLeviers,
  setDescriptionHasBeenUpdated,
}: QuestionsSectionProps) {
  const [resume, setResume] = useState<string | null>(null);
  const [loadingResume, setLoadingResume] = useState(false);

  const handleAnswer = async (questionKey: keyof Questions, answer: "oui" | "non") => {
    //todo still need this condition despite the step isolation ?
    if (!questions || !questions[questionKey]) return;

    const fullQuestion = questions[questionKey];
    console.log("Storing answer for question:", fullQuestion, answer);

    // Update answers
    const updatedAnswers = {
      ...answers,
      [fullQuestion as string]: answer,
    };
    setAnswers(updatedAnswers);
  };

  const handleGenerateResume = async () => {
    //todo still need this condition despite the step isolation ?
    if (!questions || Object.keys(answers).length === 0) return;

    const formattedAnswers = Object.entries(answers).reduce<Record<string, "oui" | "non">>(
      (acc, [question, answer]) => {
        acc[question] = answer;
        return acc;
      },
      {},
    );

    console.log("Formatted answers for resume:", formattedAnswers);

    setLoadingResume(true);
    try {
      const resumeText = await generateResume(intitule, formattedAnswers);
      console.log("Generated resume:", resumeText);
      setResume(resumeText);
    } catch (error) {
      console.error("Error generating resume:", error);
    } finally {
      setLoadingResume(false);
    }
  };

  const allQuestionsAnswered = Object.keys(answers).length === Object.keys(questions).length;

  const applyNewDescriptionToGrist = async () => {
    if (!currentSelection || !columnMapping?.description || !resume) {
      console.error("Cannot update description: Missing required data");
      setDescriptionHasBeenUpdated(false);
      return;
    }

    try {
      await grist.selectedTable.update({
        id: currentSelection.id,
        fields: { [columnMapping.description as string]: resume },
      });
      setDescriptionHasBeenUpdated(true);
      goToThematiquesLeviers();
    } catch (error) {
      console.error("Error updating description in Grist:", error);
      setDescriptionHasBeenUpdated(false);
    }
  };

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Enrichir la description du projet</h2>
      <span className="text-sm text-gray-600">
        Répondez à ces questions pour obtenir une proposition de description enrichie.
      </span>
      <div className="space-y-2">
        {Object.entries(questions).map(([key, question]) => {
          const isAnswered = answers[question] !== undefined;
          return (
            <div
              key={key}
              className={`p-3 rounded-md transition-all ${
                isAnswered ? "bg-blue-50 border border-blue-100" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm text-gray-700">{question}</p>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => handleAnswer(key, "oui")}
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
                    onClick={() => handleAnswer(key, "non")}
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

      <div>
        {!allQuestionsAnswered && (
          <div className="text-sm text-gray-600 text-center">
            Répondez à toutes les questions pour mettre à jour l&apos;analyse
          </div>
        )}

        <Button
          onClick={handleGenerateResume}
          disabled={!allQuestionsAnswered || loadingResume}
          isLoading={loadingResume}
          fullWidth
          className="mt-2"
        >
          Voir la proposition
        </Button>

        {loadingResume && (
          <div className="text-sm text-gray-600 animate-pulse text-center">
            Génération de la nouvelle description...
          </div>
        )}

        {resume && (
          <>
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h2 className="text-sm font-medium text-gray-500 mb-2">Nouvelle description</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{resume}</p>
            </div>
            <Button onClick={applyNewDescriptionToGrist} fullWidth className="mt-2">
              Appliquer la nouvelle description
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

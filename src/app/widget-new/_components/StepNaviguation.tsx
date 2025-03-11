import React, { FC } from "react";

type StepNaviguationProps = {
  currentStep: string;
  thematiquesHaveBeenSaved: boolean;
  leviersHaveBeenSaved: boolean;
  goToThematiquesLeviers: () => void;
  goToQuestions: () => void;
};

export const StepNaviguation:FC<StepNaviguationProps> = ({
  currentStep,
  thematiquesHaveBeenSaved,
  leviersHaveBeenSaved,
  goToThematiquesLeviers,
  goToQuestions,
}) => {
  return (
    <div className="flex justify-center mb-6">
      <div className="flex items-center space-x-2">
        <button
          onClick={goToThematiquesLeviers}
          className={`px-4 py-2 rounded-md text-sm transition-all ${
            currentStep === "thematiques-leviers"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Thématiques et leviers
        </button>
        <div className="w-8 h-0.5 bg-gray-300"></div>
        <button
          onClick={goToQuestions}
          disabled={!thematiquesHaveBeenSaved || !leviersHaveBeenSaved}
          className={`px-4 py-2 rounded-md text-sm transition-all ${
            currentStep === "questions" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          } ${!thematiquesHaveBeenSaved || !leviersHaveBeenSaved ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          Questions
        </button>
      </div>
    </div>
  );
};

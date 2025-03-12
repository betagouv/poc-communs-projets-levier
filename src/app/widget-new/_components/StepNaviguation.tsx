import React, { FC } from "react";
import { Button } from "./Button";

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
        <Button
          onClick={goToThematiquesLeviers}
          variant={currentStep === "thematiques-leviers" ? "primary" : "secondary"}
          size="sm"
        >
          Thématiques et leviers
        </Button>
        <div className="w-8 h-0.5 bg-gray-300"></div>
        <Button
          onClick={goToQuestions}
          disabled={!thematiquesHaveBeenSaved || !leviersHaveBeenSaved}
          variant={currentStep === "questions" ? "primary" : "secondary"}
          size="sm"
        >
          Questions
        </Button>
      </div>
    </div>
  );
};

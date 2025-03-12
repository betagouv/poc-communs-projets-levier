import React, { FC } from "react";

type StepNaviguationProps = {
  currentStep: string;
  thematiquesHaveBeenSaved: boolean;
  leviersHaveBeenSaved: boolean;
  goToThematiquesLeviers: () => void;
  goToQuestions: () => void;
  isEnrichingDescription?: boolean;
};

export const StepNaviguation: FC<StepNaviguationProps> = ({
  currentStep,
  thematiquesHaveBeenSaved,
  leviersHaveBeenSaved,
  goToThematiquesLeviers,
  goToQuestions,
  isEnrichingDescription = false,
}) => {
  // Define steps and their order
  const steps = [
    { id: "thematiques-leviers", label: "Thématiques et leviers" },
    { id: "questions", label: "Enrichissement description" },
  ];

  // Find the index of the current step
  const currentStepIndex = steps.findIndex((step) => step.id === currentStep);

  const handleStepNavigation = (step: (typeof steps)[number]) => {
    if (step.id === "thematiques-leviers") {
      goToThematiquesLeviers();
    } else if (step.id === "questions") {
      if (isEnrichingDescription || (thematiquesHaveBeenSaved && leviersHaveBeenSaved)) {
        goToQuestions();
      }
    }
  };

  return (
    <div className="flex items-center w-full mb-6">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          {/* Step circle with number */}
          <div className="flex items-center">
            <div
              className={`flex items-center justify-center w-10 h-10 rounded-full text-white font-medium cursor-pointer ${
                index === currentStepIndex
                  ? "bg-blue-500" // current step
                  : "bg-gray-400" // future step
              }`}
              onClick={() => handleStepNavigation(step)}
            >
              {index + 1}
            </div>
            <span
              className={`ml-3 text-sm font-medium ${index === currentStepIndex ? "text-gray-900" : "text-gray-500"}`}
            >
              {step.label}
            </span>
          </div>

          {/* Connector line between steps */}
          {index < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-4 ${index < currentStepIndex ? "bg-blue-600" : "bg-gray-300"}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

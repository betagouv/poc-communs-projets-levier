import React, { FC } from "react";
import type { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { Button } from "./Button";
import { SuccessMessage } from "@/app/widget-new/_components/SuccessMessage";

type ProjectDetailProps = {
  currentSelection: RowRecord | null;
  columnMapping: WidgetColumnMap | null;
  isLoadingLeviers: boolean;
  isLoadingCompetences: boolean;
  analyzeCurrentRow: () => Promise<void>;
  descriptionHasBeenUpdated: boolean;
  allLeviersScoresLow?: boolean;
  goToQuestions?: () => void;
};

export const ProjectDetail: FC<ProjectDetailProps> = ({
  currentSelection,
  columnMapping,
  isLoadingCompetences,
  isLoadingLeviers,
  analyzeCurrentRow,
  descriptionHasBeenUpdated,
  allLeviersScoresLow = false,
  goToQuestions,
}) => {
  //todo remove h2
  return (
    <div>
      <h1 className="text-md font-bold mb-2">Détail du projet</h1>
      {currentSelection ? (
        <div>
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Intitulé de l&#39;opération</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {(currentSelection[columnMapping?.intitule as string] as string) || "Aucun intitulé disponible"}
            </p>
          </div>

          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h2 className="text-sm font-medium text-gray-500 mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {(currentSelection[columnMapping?.description as string] as string) || "Aucune description disponible"}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-center">Veuillez sélectionner une ligne pour commencer l&#39;analyse</p>
        </div>
      )}

      {descriptionHasBeenUpdated && <SuccessMessage message="Description mise à jour avec succès !" />}

      <Button
        onClick={analyzeCurrentRow}
        disabled={isLoadingLeviers || isLoadingCompetences || !currentSelection}
        isLoading={isLoadingLeviers || isLoadingCompetences}
        fullWidth
      >
        {isLoadingLeviers || isLoadingCompetences ? "Analyse en cours..." : "Identifier des thématiques / leviers"}
      </Button>

      {allLeviersScoresLow && !isLoadingLeviers && !isLoadingCompetences && (
        <div className="mt-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
            <p className="text-sm text-yellow-700">
              L&#39;intitulé et la description actuels ne permettent pas de détecter avec confiance les leviers et les
              thématiques liées. Nous vous recommandons d&#39;enrichir la description de votre projet en répondant à
              quelques questions.
            </p>
          </div>
          <Button onClick={goToQuestions} variant="outline" fullWidth>
            Enrichir la description du projet
          </Button>
        </div>
      )}
    </div>
  );
};

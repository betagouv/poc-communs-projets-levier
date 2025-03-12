import React, { FC } from "react";
import type { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { Button } from "./Button";
import { SuccessMessage } from "@/app/widget-new/_components/SuccessMessage";
import { analyzeProject } from "@/app/actions";
import { push } from "@socialgouv/matomo-next";
import { CompetencesResult, LeviersResult } from "@/app/types";

type ProjectDetailProps = {
  currentSelection: RowRecord | null;
  columnMapping: WidgetColumnMap | null;
  isLoadingLeviers: boolean;
  isLoadingCompetences: boolean;
  descriptionHasBeenUpdated: boolean;
  allLeviersScoresLow?: boolean;
  goToQuestions?: () => void;
  setIsLoadingLeviers: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingCompetences: React.Dispatch<React.SetStateAction<boolean>>;
  setError: React.Dispatch<React.SetStateAction<string | undefined>>;
  setLeviersResult: React.Dispatch<React.SetStateAction<LeviersResult | undefined>>;
  setCompetencesResult: React.Dispatch<React.SetStateAction<CompetencesResult | undefined>>;
  setAllLeviersScoresLow: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ProjectDetail: FC<ProjectDetailProps> = ({
  currentSelection,
  columnMapping,
  isLoadingCompetences,
  isLoadingLeviers,
  descriptionHasBeenUpdated,
  allLeviersScoresLow = false,
  goToQuestions,
  setIsLoadingLeviers,
  setIsLoadingCompetences,
  setError,
  setLeviersResult,
  setCompetencesResult,
  setAllLeviersScoresLow,
}) => {
  const analyzeCurrentRow = async () => {
    push(["trackEvent", "Analysis", "Start"]);
    setError(undefined);

    try {
      if (!currentSelection || !columnMapping?.description) {
        throw new Error("No record selected or missing description column mapping");
      }

      const intitule = currentSelection[columnMapping.intitule as string];
      const description = currentSelection[columnMapping.description as string];

      setIsLoadingCompetences(true);
      setIsLoadingLeviers(true);

      // Combine intitule with description if available
      const projectText = description ? `${intitule}\n${description}` : (intitule as string);

      // Analyse des compétences
      const thematiquesData = (await analyzeProject(projectText, "competences")) as CompetencesResult;
      setCompetencesResult(thematiquesData);
      setIsLoadingCompetences(false);

      // Analyse des leviers
      const leviersData = (await analyzeProject(projectText, "TE")) as LeviersResult;
      setLeviersResult(leviersData);
      setIsLoadingLeviers(false);

      if (leviersData.leviers) {
        setAllLeviersScoresLow(checkIfAllLeviersScoreAreLow(leviersData.leviers));
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error occurred");
      setIsLoadingCompetences(false);
      setIsLoadingLeviers(false);
    }
  };

  const checkIfAllLeviersScoreAreLow = (leviers: Record<string, number>) => {
    if (!leviers || Object.keys(leviers).length === 0) return false;

    return Object.values(leviers).every((score) => score < 0.7);
  };

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

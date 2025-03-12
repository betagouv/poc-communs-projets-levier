import React, { FC } from "react";
import { CompetencesResult } from "@/app/types";
import { push } from "@socialgouv/matomo-next";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import type { RowRecord } from "grist/GristData";
import { CheckMark } from "@/app/widget-new/_components/Icons/CheckMark";
import { SuccessMessage } from "@/app/widget-new/_components/SuccessMessage";
import { Button } from "./Button";

type CompetencesResultsProps = {
  isLoadingCompetences: boolean;
  competencesResult: CompetencesResult | undefined;
  columnMapping: WidgetColumnMap | null;
  setError: (error: string) => void;
  currentSelection: RowRecord | null;
  thematiquesHaveBeenSaved: boolean;
  setThematiquesHaveBeenSaved: React.Dispatch<React.SetStateAction<boolean>>;
};

export const ThematiquesSection: FC<CompetencesResultsProps> = ({
  isLoadingCompetences,
  competencesResult,
  columnMapping,
  currentSelection,
  setError,
  thematiquesHaveBeenSaved,
  setThematiquesHaveBeenSaved,
}) => {
  const saveCompetences = async () => {
    try {
      if (!currentSelection || !competencesResult?.competences) {
        throw new Error("No record or competences selected");
      }
      const competences = competencesResult.competences;
      const mainCompetenceColumnId = columnMapping?.thematique_prioritaire;
      const secondaryCompetenceColumnId = columnMapping?.thematique_secondaire;

      await grist.selectedTable.update({
        id: currentSelection.id,
        fields: {
          [mainCompetenceColumnId as string]: `${competences[0].competence}${
            competences[0].sous_competence ? ` > ${competences[0].sous_competence}` : ""
          }`,
          [secondaryCompetenceColumnId as string]: competences[1]
            ? `${competences[1].competence}${
                competences[1].sous_competence ? ` > ${competences[1].sous_competence}` : ""
              }`
            : "",
        },
      });

      setThematiquesHaveBeenSaved(true);
      push(["trackEvent", "Competences", "Save"]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save competences");
    }
  };

  return (
    <div className="mb-8 mt-4">
      {isLoadingCompetences ? (
        <div className="p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin h-5 w-5 text-gray-500 mr-2"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-gray-600">Analyse des thématiques en cours...</span>
          </div>
        </div>
      ) : competencesResult?.competences ? (
        <>
          <h3 className="font-semibold mb-3 text-gray-800">Thématiques suggérées :</h3>
          <div className="space-y-3">
            {competencesResult.competences
              .sort((a, b) => b.score - a.score)
              .slice(0, 2)
              .map((comp, index) => {
                const percentage = (comp.score * 100).toFixed(0);
                return (
                  <div key={index} className="p-4 border rounded-lg bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-700">{comp.competence}</span>
                        {comp.sous_competence && (
                          <>
                            <CheckMark />
                            <span className="text-gray-600">{comp.sous_competence}</span>
                          </>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-600">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
          </div>
          <Button onClick={saveCompetences} fullWidth className="mt-4" icon={<CheckMark />}>
            Appliquer les thématiques
          </Button>
          {thematiquesHaveBeenSaved && <SuccessMessage message="Thématiques ajoutées avec succès" />}
        </>
      ) : null}
    </div>
  );
};

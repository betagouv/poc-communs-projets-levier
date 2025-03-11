import React, { FC } from "react";
import type { RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { LoadingSpinner } from "./Icons/LoadingSpinner";

type ProjectDetailProps = {
  currentSelection: RowRecord | null;
  columnMapping: WidgetColumnMap | null;
  isLoadingLeviers: boolean;
  isLoadingCompetences: boolean;
  analyzeCurrentRow: () => Promise<void>;
};

export const ProjectDetail: FC<ProjectDetailProps> = ({
  currentSelection,
  columnMapping,
  isLoadingCompetences,
  isLoadingLeviers,
  analyzeCurrentRow,
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

      <button
        onClick={analyzeCurrentRow}
        disabled={isLoadingLeviers || isLoadingCompetences || !currentSelection}
        className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-sm flex items-center justify-center"
      >
        {isLoadingLeviers || isLoadingCompetences ? (
          <span className="flex items-center justify-center">
            <LoadingSpinner /> Analyse en cours...
          </span>
        ) : (
          "Identifier des  thématiques / leviers"
        )}
      </button>
    </div>
  );
};

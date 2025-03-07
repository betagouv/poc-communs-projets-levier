import React, { useEffect, useState } from "react";
import { analyzeProject } from "@/app/actions";
import { CompetencesResult, LeviersResult } from "@/app/types";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import type { CellValue, RowRecord } from "grist/GristData";
import { push } from "@socialgouv/matomo-next";

type ReferenceTable = {
  FNV: string[];
  Levier: string[];
};

export const GristAnalyzer = () => {
  const [isLoadingLeviers, setIsLoadingLeviers] = useState(false);
  const [isLoadingCompetences, setIsLoadingCompetences] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [leviersResult, setLeviersResult] = useState<LeviersResult | undefined>();
  const [competencesResult, setCompetencesResult] = useState<CompetencesResult | undefined>();
  const [selectedLevers, setSelectedLevers] = useState<Set<string>>(new Set());
  const [currentSelection, setCurrentSelection] = useState<RowRecord | null>(null);
  const [columnMapping, setColumnMapping] = useState<WidgetColumnMap | null>(null);
  const [FNV_ReferenceTable, setFNV_ReferenceTable] = useState<ReferenceTable | null>(null);

  useEffect(() => {
    grist.ready({
      requiredAccess: "full",
      columns: [
        { name: "description", type: "Text" },
        { name: "leviers" },
        { name: "thematique_prioritaire", type: "Choice" },
        { name: "thematique_secondaire", type: "Choice" },
      ],
    });

    grist.onRecord((record: RowRecord | null, mappings) => {
      // Get current selection directly from state setter to avoid stale closure
      setCurrentSelection((prevSelection) => {
        // Only reset state if the row selection has actually changed
        if (record?.id !== prevSelection?.id) {
          setLeviersResult(undefined);
          setCompetencesResult(undefined);
          setSelectedLevers(new Set());
        }
        return record;
      });

      setColumnMapping(mappings);
    });

    fetchFNVReferencesTable();
    // Empty dependency array since we only want to set up listeners once
  }, []);

  const fetchFNVReferencesTable = async (): Promise<void> => {
    const levierReferenceTable: { FNV: string[]; Levier: string[] } = await grist.docApi.fetchTable("Thematiques_FNV");
    setFNV_ReferenceTable(levierReferenceTable);
  };

  async function getLeverIds(leverNames: string[], levierReferenceTable: ReferenceTable) {
    const leverIds = [];
    for (const name of leverNames) {
      const matchedLevierIndex = levierReferenceTable.Levier.findIndex((levier) => levier === name);
      leverIds.push(matchedLevierIndex + 1);
    }
    return leverIds;
  }

  const analyzeCurrentRow = async () => {
    push(["trackEvent", "Analysis", "Start"]);
    setError(undefined);

    try {
      if (!currentSelection || !columnMapping?.description) {
        throw new Error("No record selected or missing description column mapping");
      }

      const description = currentSelection[columnMapping.description as string];

      if (!description) {
        throw new Error("Pas de description remplie dans la ligne sélectionnée");
      }

      setIsLoadingCompetences(true);
      setIsLoadingLeviers(true);

      analyzeProject(description as string, "competences")
        .then((result) => {
          setCompetencesResult(result as CompetencesResult);
        })
        .catch((error) => {
          console.error("Failed to load competences:", error);
        })
        .finally(() => {
          setIsLoadingCompetences(false);
        });

      analyzeProject(description as string, "TE")
        .then((result) => {
          setLeviersResult(result as LeviersResult);
        })
        .catch((error) => {
          console.error("Failed to load leviers:", error);
        })
        .finally(() => {
          setIsLoadingLeviers(false);
        });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unknown error occurred");
      setIsLoadingCompetences(false);
      setIsLoadingLeviers(false);
    }
  };

  const toggleLever = (leverName: string) => {
    setSelectedLevers((prev) => {
      const newSelected = new Set(prev);
      if (newSelected.has(leverName)) {
        push(["trackEvent", "Leviers", "Deselect", leverName]);
        newSelected.delete(leverName);
      } else {
        push(["trackEvent", "Leviers", "Select", leverName]);
        newSelected.add(leverName);
      }
      return newSelected;
    });
  };

  const saveLevers = async () => {
    try {
      if (!currentSelection) {
        throw new Error("No record selected");
      }

      const leversColumnId = columnMapping?.leviers;
      const leversArray = Array.from(selectedLevers);

      // at this stage the FNV_ReferenceTable is populated
      const leverIds = await getLeverIds(leversArray, FNV_ReferenceTable!);

      // Update the ReferenceList column with the array of row IDs
      await grist.selectedTable.update({
        id: currentSelection.id,
        fields: { [leversColumnId as string]: ["L", ...leverIds] as unknown as CellValue },
      });

      push(["trackEvent", "Leviers", "Save", `Count: ${selectedLevers.size}`]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save levers");
      push(["trackEvent", "Leviers", "Error", error instanceof Error ? error.message : "Save failed"]);
    }
  };

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
      push(["trackEvent", "Competences", "Save"]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save competences");
    }
  };

  // Helper function to get description from current selection
  const getCurrentDescription = () => {
    if (!currentSelection) return null;

    const description = currentSelection[columnMapping?.description as string];
    return description as string;
  };

  return (
    <div className="p-4 max-w-xl mx-auto bg-white min-h-screen">
      {/* Description display */}
      {currentSelection ? (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h2 className="text-sm font-medium text-gray-500 mb-2">Description sélectionnée :</h2>
          <p className="text-gray-700 whitespace-pre-wrap">
            {getCurrentDescription() || "Aucune description disponible"}
          </p>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500 text-center">Veuillez sélectionner une ligne pour analyser sa description</p>
        </div>
      )}

      <button
        onClick={analyzeCurrentRow}
        disabled={isLoadingLeviers || isLoadingCompetences || !currentSelection}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-sm"
      >
        {isLoadingLeviers || isLoadingCompetences ? (
          <span className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
            Analyse en cours...
          </span>
        ) : (
          "Analyser la description"
        )}
      </button>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
          <svg
            className="h-5 w-5 mr-2 text-red-500"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {error}
        </div>
      )}

      <div className="mt-6 space-y-6">
        {/* Competences Section */}
        <div className="mb-8">
          <h3 className="font-semibold mb-3 text-gray-800">Thématiques identifiées :</h3>

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
                                <svg
                                  className="h-4 w-4 text-gray-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
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
              <button
                onClick={saveCompetences}
                className="mt-4 w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-sm flex items-center justify-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Appliquer les thématiques
              </button>
            </>
          ) : null}
        </div>

        {/* Leviers Section */}
        <div>
          <h3 className="font-semibold mb-3 text-gray-800">Leviers identifiés :</h3>

          {isLoadingLeviers ? (
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
                <span className="text-gray-600">Analyse des leviers en cours...</span>
              </div>
            </div>
          ) : leviersResult?.leviers ? (
            <>
              <div className="space-y-2">
                {Object.entries(leviersResult.leviers).map(([name, score], index) => {
                  const percentage = (score * 100).toFixed(0);

                  return (
                    <label
                      key={index}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-400 ${
                        selectedLevers.has(name)
                          ? "border-blue-500 bg-blue-50 shadow-sm"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLevers.has(name)}
                        onChange={() => toggleLever(name)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <div className="flex justify-between items-center w-full ml-3">
                        <span className="text-gray-700 font-medium">{name}</span>
                        <div className="flex items-center space-x-3">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                          </div>
                          <span className="text-sm text-gray-600 font-medium">{percentage}%</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>

              <button
                disabled={selectedLevers.size === 0}
                onClick={saveLevers}
                className="mt-6 w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 font-medium shadow-sm flex items-center justify-center"
              >
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Enregistrer les leviers ({selectedLevers.size})
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

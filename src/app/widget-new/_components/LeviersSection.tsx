import React, { FC } from "react";
import { LeviersResult, FNVReferenceTable } from "@/app/types";
import { push } from "@socialgouv/matomo-next";
import type { CellValue, RowRecord } from "grist/GristData";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { SuccessMessage } from "@/app/widget-new/_components/SuccessMessage";
import { Button } from "./Button";
import { CheckMark } from "@/app/widget-new/_components/Icons/CheckMark";

type LeviersSectionProps = {
  leviersResult: LeviersResult | undefined;
  isLoadingLeviers: boolean;
  selectedLevers: Set<string>;
  currentSelection: RowRecord | null;
  columnMapping: WidgetColumnMap | null;
  setSelectedLevers: React.Dispatch<React.SetStateAction<Set<string>>>;
  FNV_ReferenceTable: FNVReferenceTable | null;
  setError: (error: string) => void;
  leviersHaveBeenSaved: boolean;
  setLeviersHaveBeenSaved: React.Dispatch<React.SetStateAction<boolean>>;
};

async function getLeverIds(leverNames: string[], levierReferenceTable: FNVReferenceTable) {
  const leverIds = [];
  for (const name of leverNames) {
    const matchedLevierIndex = levierReferenceTable.Levier.findIndex((levier) => levier === name);
    leverIds.push(matchedLevierIndex + 1);
  }
  return leverIds;
}

export const LeviersSection: FC<LeviersSectionProps> = ({
  leviersResult,
  isLoadingLeviers,
  selectedLevers,
  setSelectedLevers,
  currentSelection,
  columnMapping,
  FNV_ReferenceTable,
  setError,
  leviersHaveBeenSaved,
  setLeviersHaveBeenSaved,
}) => {
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

      setLeviersHaveBeenSaved(true);
      push(["trackEvent", "Leviers", "Save", `Count: ${selectedLevers.size}`]);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to save levers");
      push(["trackEvent", "Leviers", "Error", error instanceof Error ? error.message : "Save failed"]);
    }
  };

  return (
    <div>
      {isLoadingLeviers ? (
        <div className="p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-center">
            <svg
              className="animate-spin -ml-1 mr-3 h-5 w-5 text-blue-500"
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
            <span className="text-black">Analyse des leviers en cours...</span>
          </div>
        </div>
      ) : leviersResult?.leviers ? (
        <>
          <h3 className="font-semibold mb-2 text-black">Leviers suggérés :</h3>
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
                    <span className="text-black font-medium">{name}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="text-sm text-black font-medium">{percentage}%</span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <Button
            disabled={selectedLevers.size === 0}
            onClick={saveLevers}
            fullWidth
            className="mt-3"
            icon={<CheckMark />}
          >
            Appliquer les leviers ({selectedLevers.size})
          </Button>

          {leviersHaveBeenSaved && <SuccessMessage message="Leviers ajoutées avec succès" />}
        </>
      ) : null}
    </div>
  );
};

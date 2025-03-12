import React, { useEffect, useState } from "react";
import type { RowRecord } from "grist/GristData";
import { CompetencesResult, LeviersResult, QuestionAnswers } from "@/app/types";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { push } from "@socialgouv/matomo-next";
import { analyzeProject } from "@/app/actions";
import { ProjectDetail } from "./ProjectDetail";
import { ThematiquesSection } from "./ThematiquesSection";
import { LeviersSection } from "./LeviersSection";
import { ErrorDisplay } from "./ErrorDisplay";
import { QuestionsSection } from "./QuestionsSection";
import { StepNaviguation } from "./StepNaviguation";

type ReferenceTable = {
  FNV: string[];
  Levier: string[];
};

export const WidgetGrist = () => {
  const [isLoadingLeviers, setIsLoadingLeviers] = useState(false);
  const [isLoadingCompetences, setIsLoadingCompetences] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [answers, setAnswers] = useState<QuestionAnswers>({});
  const [leviersResult, setLeviersResult] = useState<LeviersResult | undefined>();
  const [competencesResult, setCompetencesResult] = useState<CompetencesResult | undefined>();
  const [selectedLevers, setSelectedLevers] = useState<Set<string>>(new Set());
  const [currentSelection, setCurrentSelection] = useState<RowRecord | null>(null);
  const [columnMapping, setColumnMapping] = useState<WidgetColumnMap | null>(null);
  const [FNV_ReferenceTable, setFNV_ReferenceTable] = useState<ReferenceTable | null>(null);
  const [leviersHaveBeenSaved, setLeviersHaveBeenSaved] = useState(false);
  const [thematiquesHaveBeenSaved, setThematiquesHaveBeenSaved] = useState(false);
  const [descriptionHasBeenUpdated, setDescriptionHasBeenUpdated] = useState(false);
  const [currentStep, setCurrentStep] = useState<"thematiques-leviers" | "questions">("thematiques-leviers");
  const [allLeviersScoresLow, setAllLeviersScoresLow] = useState(false);

  const fetchFNVReferencesTable = async (): Promise<void> => {
    const levierReferenceTable: { FNV: string[]; Levier: string[] } = await grist.docApi.fetchTable("Thematiques_FNV");
    setFNV_ReferenceTable(levierReferenceTable);
  };

  useEffect(() => {
    grist.ready({
      requiredAccess: "full",
      columns: [
        { name: "intitule", type: "Text" },
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
          setAnswers({});
          setDescriptionHasBeenUpdated(false);
          setLeviersHaveBeenSaved(false);
          setThematiquesHaveBeenSaved(false);
          setAllLeviersScoresLow(false);
        }
        return record;
      });

      setColumnMapping(mappings);
    });

    fetchFNVReferencesTable();
    // Empty dependency array since we only want to set up listeners once
  }, []);

  //todo move this to the ProjectDetail component
  const analyzeCurrentRow = async () => {
    push(["trackEvent", "Analysis", "Start"]);
    setError(undefined);

    try {
      if (!currentSelection || !columnMapping?.description) {
        throw new Error("No record selected or missing description column mapping");
      }

      const intitule = currentSelection[columnMapping.intitule as string];
      const description = currentSelection[columnMapping.description as string];

      if (!intitule) {
        throw new Error("Pas de description remplie dans la ligne sélectionnée");
      }

      setIsLoadingCompetences(true);
      setIsLoadingLeviers(true);

      // Combine intitule with description if available
      const projectText =
        description && typeof description === "string" && description.trim() !== ""
          ? `${intitule}\n${description}`
          : (intitule as string);

      analyzeProject(projectText, "competences")
        .then((result) => {
          setCompetencesResult(result as CompetencesResult);
        })
        .catch((error) => {
          console.error("Failed to load competences:", error);
        })
        .finally(() => {
          setIsLoadingCompetences(false);
        });

      analyzeProject(projectText, "TE")
        .then((result) => {
          const leviersResult = result as LeviersResult;
          setLeviersResult(leviersResult);

          // Check if all levier scores are below 0.7
          if (leviersResult.leviers) {
            setAllLeviersScoresLow(checkLeviersScores(leviersResult.leviers));
          }
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

  // Fonction pour passer à l'étape des questions lorsque les thématiques et leviers ont été sauvegardés
  useEffect(() => {
    if (thematiquesHaveBeenSaved && leviersHaveBeenSaved) {
      setCurrentStep("questions");
    }
  }, [thematiquesHaveBeenSaved, leviersHaveBeenSaved]);

  const goToThematiquesLeviers = () => {
    setCurrentStep("thematiques-leviers");
  };

  const goToQuestions = () => {
    setCurrentStep("questions");
  };

  const redirectToStep1AfterNewDescriptionHasBeenApplierd = () => {
    goToThematiquesLeviers();
    setLeviersResult(undefined);
    setCompetencesResult(undefined);
    setSelectedLevers(new Set());
    setLeviersHaveBeenSaved(false);
    setThematiquesHaveBeenSaved(false);
  };

  const displayStep1 = currentStep === "thematiques-leviers";
  const displayStep2 = currentStep === "questions";

  // Function to check if all levier scores are below 0.7
  const checkLeviersScores = (leviers: Record<string, number>) => {
    if (!leviers || Object.keys(leviers).length === 0) return false;

    // Check if all scores are below 0.7
    return Object.values(leviers).every((score) => score < 0.7);
  };

  return (
    <div className="p-4 max-w-xl mx-auto bg-white min-h-screen">
      <StepNaviguation
        currentStep={currentStep}
        thematiquesHaveBeenSaved={thematiquesHaveBeenSaved}
        leviersHaveBeenSaved={leviersHaveBeenSaved}
        goToThematiquesLeviers={goToThematiquesLeviers}
        goToQuestions={goToQuestions}
        isEnrichingDescription={allLeviersScoresLow && currentStep === "questions"}
      />

      {displayStep1 && (
        <>
          <ProjectDetail
            columnMapping={columnMapping}
            currentSelection={currentSelection}
            analyzeCurrentRow={analyzeCurrentRow}
            isLoadingCompetences={isLoadingCompetences}
            isLoadingLeviers={isLoadingLeviers}
            descriptionHasBeenUpdated={descriptionHasBeenUpdated}
            allLeviersScoresLow={allLeviersScoresLow}
            goToQuestions={goToQuestions}
          />

          <ErrorDisplay error={error} />
          <ThematiquesSection
            // useful to force a "remount" when the current selection changes to reinitialise the state of the success message in the component
            isLoadingCompetences={isLoadingCompetences}
            competencesResult={competencesResult}
            columnMapping={columnMapping}
            currentSelection={currentSelection}
            setError={setError}
            thematiquesHaveBeenSaved={thematiquesHaveBeenSaved}
            setThematiquesHaveBeenSaved={setThematiquesHaveBeenSaved}
          />

          <LeviersSection
            leviersResult={leviersResult}
            isLoadingLeviers={isLoadingLeviers}
            selectedLevers={selectedLevers}
            setSelectedLevers={setSelectedLevers}
            currentSelection={currentSelection}
            columnMapping={columnMapping}
            FNV_ReferenceTable={FNV_ReferenceTable}
            setError={setError}
            leviersHaveBeenSaved={leviersHaveBeenSaved}
            setLeviersHaveBeenSaved={setLeviersHaveBeenSaved}
          />
        </>
      )}

      {displayStep2 && (
        <QuestionsSection
          setAnswers={setAnswers}
          answers={answers}
          setDescriptionHasBeenUpdated={setDescriptionHasBeenUpdated}
          intitule={currentSelection![columnMapping?.intitule as string] as string}
          currentSelection={currentSelection}
          columnMapping={columnMapping}
          goToThematiquesLeviers={redirectToStep1AfterNewDescriptionHasBeenApplierd}
        />
      )}
    </div>
  );
};

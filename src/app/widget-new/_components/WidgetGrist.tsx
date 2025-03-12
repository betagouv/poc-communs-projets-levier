import React, { useEffect, useState } from "react";
import type { RowRecord } from "grist/GristData";
import { CompetencesResult, LeviersResult, QuestionAnswers, Questions } from "@/app/types";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { push } from "@socialgouv/matomo-next";
import { analyzeProject, generateQuestions } from "@/app/actions";
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
  const [questions, setQuestions] = useState<Questions | null>(null);
  const [answers, setAnswers] = useState<QuestionAnswers>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [leviersResult, setLeviersResult] = useState<LeviersResult | undefined>();
  const [competencesResult, setCompetencesResult] = useState<CompetencesResult | undefined>();
  const [selectedLevers, setSelectedLevers] = useState<Set<string>>(new Set());
  const [currentSelection, setCurrentSelection] = useState<RowRecord | null>(null);
  const [columnMapping, setColumnMapping] = useState<WidgetColumnMap | null>(null);
  const [FNV_ReferenceTable, setFNV_ReferenceTable] = useState<ReferenceTable | null>(null);
  const [leviersHaveBeenSaved, setLeviersHaveBeenSaved] = useState(false);
  const [thematiquesHaveBeenSaved, setThematiquesHaveBeenSaved] = useState(false);
  const [currentStep, setCurrentStep] = useState<"thematiques-leviers" | "questions">("thematiques-leviers");

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
          setQuestions(null);
          setAnswers({});
          setLeviersHaveBeenSaved(false);
          setThematiquesHaveBeenSaved(false);
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
      const projectText = description && typeof description === 'string' && description.trim() !== '' 
        ? `${intitule}\n${description}`
        : intitule as string;

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

  // todo put that in questions
  const handleGenerateQuestions = async () => {
    if (!currentSelection || !leviersResult) return;
    
    const intitule = currentSelection[columnMapping?.intitule as string];
    const description = currentSelection[columnMapping?.description as string];
    
    // Combine intitule with description if available
    const projectText = description && typeof description === 'string' && description.trim() !== '' 
      ? `${intitule}\n${description}`
      : intitule as string;
    
    setLoadingQuestions(true);
    try {
      const questions = await generateQuestions(projectText);
      console.log("Received questions:", questions);

      if (questions) {
        console.log("Setting questions state...");
        setQuestions(questions);
        console.log("Questions state updated");
      } else {
        console.log("No questions received");
      }
    } catch (error) {
      console.error("Error generating questions:", error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // auto generate questions when leviers and thematiques have been saved
  useEffect(() => {
    if (thematiquesHaveBeenSaved && leviersHaveBeenSaved && !questions) {
      handleGenerateQuestions();
      setCurrentStep("questions");
    }
  }, [thematiquesHaveBeenSaved, leviersHaveBeenSaved, questions]);

  console.log("questions", questions);
  console.log("thematiquesHaveBeenSaved", thematiquesHaveBeenSaved);
  console.log("leviersHaveBeenSaved", leviersHaveBeenSaved);

  const goToThematiquesLeviers = () => {
    setCurrentStep("thematiques-leviers");
  };

  const goToQuestions = () => {
    setCurrentStep("questions");
  };

  const displayStep1 = currentStep === "thematiques-leviers";
  const displayStep2 = currentStep === "questions";

  return (
    <div className="p-4 max-w-xl mx-auto bg-white min-h-screen">
      <StepNaviguation
        currentStep={currentStep}
        thematiquesHaveBeenSaved={thematiquesHaveBeenSaved}
        leviersHaveBeenSaved={leviersHaveBeenSaved}
        goToThematiquesLeviers={goToThematiquesLeviers}
        goToQuestions={goToQuestions}
      />

      {displayStep1 && (
        <>
          <ProjectDetail
            columnMapping={columnMapping}
            currentSelection={currentSelection}
            analyzeCurrentRow={analyzeCurrentRow}
            isLoadingCompetences={isLoadingCompetences}
            isLoadingLeviers={isLoadingLeviers}
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
      {loadingQuestions && (
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      )}
      {displayStep2 && questions && (
        <QuestionsSection
          setAnswers={setAnswers}
          questions={questions}
          answers={answers}
          intitule={currentSelection![columnMapping?.intitule as string] as string}
          currentSelection={currentSelection}
          columnMapping={columnMapping}
          goToThematiquesLeviers={goToThematiquesLeviers}
        />
      )}
    </div>
  );
};

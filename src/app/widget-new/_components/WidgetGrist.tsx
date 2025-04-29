import React, { useEffect, useState } from "react";
import type { RowRecord } from "grist/GristData";
import {
  CompetenceReferenceTable,
  CompetencesResult,
  FNVReferenceTable,
  LeviersResult,
  QuestionAnswers,
} from "@/app/types";
import { WidgetColumnMap } from "grist/CustomSectionAPI";
import { ProjectDetail } from "./ProjectDetail";
import { ThematiquesSection } from "./ThematiquesSection";
import { LeviersSection } from "./LeviersSection";
import { ErrorDisplay } from "./ErrorDisplay";
import { QuestionsSection } from "./QuestionsSection";
import { StepNaviguation } from "./StepNaviguation";

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
  const [FNV_ReferenceTable, setFNV_ReferenceTable] = useState<FNVReferenceTable | null>(null);
  const [competenceReferenceTable, setCompetenceReferenceTable] = useState<CompetenceReferenceTable | null>(null);
  const [leviersHaveBeenSaved, setLeviersHaveBeenSaved] = useState(false);
  const [thematiquesHaveBeenSaved, setThematiquesHaveBeenSaved] = useState(false);
  const [descriptionHasBeenUpdated, setDescriptionHasBeenUpdated] = useState(false);
  const [currentStep, setCurrentStep] = useState<"thematiques-leviers" | "questions">("thematiques-leviers");
  const [allLeviersScoresLow, setAllLeviersScoresLow] = useState(false);

  const fetchReferencesTable = async (): Promise<void> => {
    const levierReferenceTable: FNVReferenceTable = await grist.docApi.fetchTable("Thematiques_FNV");
    const competenceReferenceTable: CompetenceReferenceTable = await grist.docApi.fetchTable(
      "Referentiel_competences_M57_2025",
    );
    setFNV_ReferenceTable(levierReferenceTable);
    setCompetenceReferenceTable(competenceReferenceTable);
  };

  useEffect(() => {
    grist.ready({
      requiredAccess: "full",
      columns: [
        { name: "intitule", type: "Text" },
        { name: "description", type: "Text" },
        { name: "code_thematique_prioritaire" },
        { name: "code_thematique_secondaire" },
        { name: "leviers" },
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
          setCurrentStep("thematiques-leviers");
          setDescriptionHasBeenUpdated(false);
          setLeviersHaveBeenSaved(false);
          setThematiquesHaveBeenSaved(false);
          setAllLeviersScoresLow(false);
        }
        return record;
      });

      setColumnMapping(mappings);
    });

    fetchReferencesTable();
    // Empty dependency array since we only want to set up listeners once
  }, []);

  useEffect(() => {
    if (thematiquesHaveBeenSaved && leviersHaveBeenSaved) {
      setCurrentStep("questions");
    }
  }, [thematiquesHaveBeenSaved, leviersHaveBeenSaved]);

  // Log pour déboguer l'état des réponses
  useEffect(() => {
    console.log("[WidgetGrist] Answers state updated", {
      answersCount: Object.keys(answers).length,
      answers,
    });
  }, [answers]);

  const goToThematiquesLeviers = () => {
    setCurrentStep("thematiques-leviers");
  };

  const goToQuestions = () => {
    setCurrentStep("questions");
  };

  const redirectToStep1AfterNewDescriptionHasBeenApplied = () => {
    goToThematiquesLeviers();
    setLeviersResult(undefined);
    setCompetencesResult(undefined);
    setSelectedLevers(new Set());
    setLeviersHaveBeenSaved(false);
    setThematiquesHaveBeenSaved(false);
    setAllLeviersScoresLow(false);
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
        isEnrichingDescription={allLeviersScoresLow && currentStep === "questions"}
      />

      {displayStep1 && (
        <>
          <ProjectDetail
            columnMapping={columnMapping}
            currentSelection={currentSelection}
            isLoadingCompetences={isLoadingCompetences}
            isLoadingLeviers={isLoadingLeviers}
            descriptionHasBeenUpdated={descriptionHasBeenUpdated}
            allLeviersScoresLow={allLeviersScoresLow}
            goToQuestions={goToQuestions}
            setIsLoadingLeviers={setIsLoadingLeviers}
            setIsLoadingCompetences={setIsLoadingCompetences}
            setError={setError}
            setLeviersResult={setLeviersResult}
            setCompetencesResult={setCompetencesResult}
            setAllLeviersScoresLow={setAllLeviersScoresLow}
          />

          <ErrorDisplay error={error} />

          {(competencesResult || isLoadingCompetences) && <hr className="my-6 border-gray-200 border-t-2" />}

          <ThematiquesSection
            isLoadingCompetences={isLoadingCompetences}
            competencesResult={competencesResult}
            columnMapping={columnMapping}
            currentSelection={currentSelection}
            setError={setError}
            competenceReferenceTable={competenceReferenceTable}
            thematiquesHaveBeenSaved={thematiquesHaveBeenSaved}
            setThematiquesHaveBeenSaved={setThematiquesHaveBeenSaved}
          />

          {(competencesResult || isLoadingCompetences) && <hr className="my-6 border-gray-200 border-t-2" />}

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

      {displayStep2 && currentSelection && columnMapping && (
        <QuestionsSection
          setAnswers={setAnswers}
          answers={answers}
          setDescriptionHasBeenUpdated={setDescriptionHasBeenUpdated}
          intitule={currentSelection[columnMapping.intitule as string] as string}
          currentSelection={currentSelection}
          columnMapping={columnMapping}
          goToThematiquesLeviers={redirectToStep1AfterNewDescriptionHasBeenApplied}
        />
      )}
    </div>
  );
};

"use client";
import { useState } from "react";
import { AnalysisForm } from "./_components/AnalysisForm";
import { analyzeProject, generateQuestions, generateResume, reclassifyProject } from "@/app/actions";
import { CompetencesResult, LeviersResult, QuestionAnswers, Questions } from "@/app/types";
import { ClassificationSection } from "./_components/ClassificationSection";
import { CompetencesSection } from "./_components/CompetencesSection";
import { LeversSection } from "./_components/LeversSection";
import { QuestionsSection } from "./_components/QuestionsSection";
import { ResumeSection } from "./_components/ResumeSection";

export default function AnalyzerPage() {
  const [description, setDescription] = useState("");
  const [teResults, setTeResults] = useState<LeviersResult | null>(null);
  const [compResults, setCompResults] = useState<CompetencesResult | null>(null);
  const [questions, setQuestions] = useState<Questions | null>(null);
  const [answers, setAnswers] = useState<QuestionAnswers>({});
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [resume, setResume] = useState<string | null>(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [loadingReclassification, setLoadingReclassification] = useState(false);

  const handleAnalysis = async (type: "TE" | "competences") => {
    // Reset all states when starting a new analysis
    setTeResults(null);
    setCompResults(null);
    setQuestions(null);
    setAnswers({});
    setResume(null);
    setLoadingQuestions(false);
    setLoadingResume(false);
    setLoadingReclassification(false);

    setLoading(true);
    try {
      console.log("Starting analysis with description:", description);
      const data = await analyzeProject(description, type);
      console.log("Analysis result:", data);
      if (type === "TE") {
        console.log("Setting TE results:", data);
        setTeResults(data as LeviersResult);
      } else {
        setCompResults(data as CompetencesResult);
      }
    } catch (error) {
      console.error("Error in handleAnalysis:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!description || !teResults) return;
    setLoadingQuestions(true);
    try {
      console.log("Starting question generation...");
      console.log("Current description:", description);
      console.log("Current teResults:", teResults);

      const questions = await generateQuestions(description, teResults);
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

  const handleAnswer = async (questionKey: keyof Questions, answer: "oui" | "non") => {
    if (!questions || !questions[questionKey] || !description) return;

    const fullQuestion = questions[questionKey];
    console.log("Storing answer for question:", fullQuestion, answer);

    // Update answers
    const updatedAnswers = {
      ...answers,
      [fullQuestion as string]: answer,
    };
    setAnswers(updatedAnswers);
  };

  const handleGenerateResume = async () => {
    if (!description || !questions || Object.keys(answers).length === 0) return;

    console.log("Current answers state:", answers);
    const formattedAnswers = Object.entries(answers).reduce<Record<string, "oui" | "non">>(
      (acc, [question, answer]) => {
        acc[question] = answer;
        return acc;
      },
      {},
    );

    console.log("Formatted answers for resume:", formattedAnswers);

    setLoadingResume(true);
    try {
      const resumeText = await generateResume(description, formattedAnswers);
      console.log("Generated resume:", resumeText);
      setResume(resumeText);
    } catch (error) {
      console.error("Error generating resume:", error);
    } finally {
      setLoadingResume(false);
    }
  };

  const handleReclassify = async () => {
    if (!resume) return;

    setLoadingReclassification(true);
    try {
      console.log("Starting reclassification with resume:", resume);
      const result = await reclassifyProject(resume);
      console.log("Reclassification result:", result);
      setTeResults(result);
    } catch (error) {
      console.error("Error during reclassification:", error);
    } finally {
      setLoadingReclassification(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:text-gray-900">
      <main className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Analyseur de Projet</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Left Column - Main Analysis */}
          <div>
            <AnalysisForm
              description={description}
              onDescriptionChange={setDescription}
              onAnalyze={handleAnalysis}
              loading={loading}
            />
            <div>
              {teResults && (
                <>
                  <ClassificationSection
                    classification={teResults.classification}
                    handleGenerateQuestions={handleGenerateQuestions}
                  />
                  <LeversSection
                    levers={teResults.leviers}
                    raisonnement={teResults.raisonnement}
                    onGenerateQuestions={handleGenerateQuestions}
                    loadingQuestions={loadingQuestions}
                  />
                  {compResults && <CompetencesSection results={compResults} />}
                </>
              )}
            </div>
          </div>

          {/* Right Column - Questions and Reclassification */}
          <div>
            {loadingQuestions && (
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            )}

            {questions && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <QuestionsSection
                  questions={questions}
                  answers={answers}
                  onAnswer={handleAnswer}
                  onGenerateResume={handleGenerateResume}
                  loadingResume={loadingResume}
                />
              </div>
            )}

            {resume && (
              <div className="mt-8">
                <ResumeSection
                  resume={resume}
                  onReclassify={handleReclassify}
                  loadingReclassification={loadingReclassification}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

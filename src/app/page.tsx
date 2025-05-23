"use client";
import { useState } from "react";
import { analyzeProject, generateQuestions, generateResume, reclassifyProject } from "@/app/actions";
import { CompetencesResult, LeviersResult, QuestionAnswers, Questions } from "@/app/types";

export default function Home() {
  const [description, setDescription] = useState("");
  const [teResults, setTeResults] = useState<LeviersResult | null>(null);
  const [compResults, setCompResults] = useState<CompetencesResult | null>(null);
  const [questions, setQuestions] = useState<Questions | null>(null);
  const [answers, setAnswers] = useState<QuestionAnswers>({});
  const [loading, setLoading] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [resume, setResume] = useState<string | null>(null);
  const [loadingResume, setLoadingResume] = useState(false);
  const [reclassificationResult, setReclassificationResult] = useState<LeviersResult | null>(null);
  const [loadingReclassification, setLoadingReclassification] = useState(false);

  const handleAnalysis = async (type: "TE" | "competences") => {
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

      const questions = await generateQuestions(description);
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

  const handleAnswer = (questionKey: keyof Questions, answer: "oui" | "non") => {
    if (!questions || !questions[questionKey]) return;

    const fullQuestion = questions[questionKey];
    console.log("Storing answer for question:", fullQuestion, answer);

    setAnswers((prev) => ({
      ...prev,
      [fullQuestion as string]: answer,
    }));
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
      setReclassificationResult(result);
    } catch (error) {
      console.error("Error during reclassification:", error);
    } finally {
      setLoadingReclassification(false);
    }
  };

  const renderResults = (results: LeviersResult) => {
    return (
      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-bold mb-4">Analyse de la description du projet</h2>

        {/* Classification Section */}
        <div className="space-y-2">
          <h3 className="font-semibold">Classification du projet :</h3>
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
              results.classification?.includes("projet a un lien avec la transition écologique")
                ? "bg-green-100 text-green-800"
                : results.classification?.includes("pas de lien avec la transition écologique")
                  ? "bg-red-100 text-red-800"
                  : "bg-orange-100 text-orange-800"
            }`}
          >
            {results.classification || "Non classifié"}
          </div>
        </div>

        {/* Levers Section */}
        {results.leviers && Object.entries(results.leviers).length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Leviers identifiés :</h3>
            <div className="space-y-2">
              {Object.entries(results.leviers).map(([name, score], index) => {
                const percentage = (score * 100).toFixed(0);
                return (
                  <div key={index} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                    <span className="font-medium">{name}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-48 bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="text-sm text-gray-600 min-w-[3rem]">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reasoning Section - Moved up */}
        {results.raisonnement && (
          <div className="space-y-3">
            <details className="group">
              <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-semibold flex items-center">
                <span>Raisonnement</span>
                <svg
                  className="ml-2 w-5 h-5 transform transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="mt-3 bg-white border rounded-lg p-4">
                <p className="whitespace-pre-wrap">{results.raisonnement}</p>
              </div>
            </details>
          </div>
        )}

        {/* Préciser mon projet button */}
        <div className="flex justify-center my-6">
          <button
            onClick={handleGenerateQuestions}
            disabled={loadingQuestions}
            className="bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors font-medium"
          >
            {loadingQuestions ? "Génération..." : "Préciser mon projet"}
          </button>
        </div>

        {/* Questions Section */}
        <QuestionsSection
          questions={questions}
          answers={answers}
          onAnswer={handleAnswer}
          onGenerateResume={handleGenerateResume}
          loadingResume={loadingResume}
        />

        {/* Resume Section */}
        {resume && (
          <div className="space-y-6">
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-3">
              <h3 className="font-semibold text-lg text-gray-800">Résumé du projet :</h3>
              <div className="prose prose-sm max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">{resume}</p>
              </div>
            </div>

            {/* Reclassification button */}
            <div className="flex justify-center">
              <button
                onClick={handleReclassify}
                disabled={loadingReclassification}
                className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 disabled:bg-gray-400 transition-colors"
              >
                {loadingReclassification ? "Classification en cours..." : "Classifier le projet enrichi"}
              </button>
            </div>

            {/* Reclassification results */}
            {reclassificationResult && (
              <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-4">
                <h3 className="font-semibold text-lg text-gray-800">Nouvelle classification :</h3>
                <div
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
                    reclassificationResult.classification?.includes("projet a un lien avec la transition écologique")
                      ? "bg-green-100 text-green-800"
                      : reclassificationResult.classification?.includes("pas de lien avec la transition écologique")
                        ? "bg-red-100 text-red-800"
                        : "bg-orange-100 text-orange-800"
                  }`}
                >
                  {reclassificationResult.classification || "Non classifié"}
                </div>

                {/* Show comparison if classification changed */}
                {teResults && teResults.classification !== reclassificationResult.classification && (
                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <span className="font-medium">Note :</span> La classification a changé après l&#39;enrichissement
                      du projet.
                    </p>
                  </div>
                )}

                {/* Levers Section for reclassification */}
                {reclassificationResult.leviers?.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="font-semibold">Leviers identifiés :</h4>
                    <div className="space-y-2">
                      {Object.entries(reclassificationResult.leviers).map(([name, score], index) => {
                        const percentage = (score * 100).toFixed(0);
                        return (
                          <div key={index} className="bg-white border rounded-lg p-4 flex items-center justify-between">
                            <span className="font-medium">{name}</span>
                            <div className="flex items-center space-x-3">
                              <div className="w-48 bg-gray-200 rounded-full h-2.5">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }} />
                              </div>
                              <span className="text-sm text-gray-600 min-w-[3rem]">{percentage}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add Reasoning Section for reclassification - Moved after Levers */}
                {reclassificationResult.raisonnement && (
                  <div className="space-y-3">
                    <details className="group">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-semibold flex items-center">
                        <span>Raisonnement</span>
                        <svg
                          className="ml-2 w-5 h-5 transform transition-transform group-open:rotate-180"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div className="mt-3 bg-white border rounded-lg p-4">
                        <p className="whitespace-pre-wrap">{reclassificationResult.raisonnement}</p>
                      </div>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Debug JSON */}
        <div className="mt-6">
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">Voir les données JSON</summary>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Première analyse :</h4>
                <pre className="mt-2 bg-gray-100 p-4 rounded-md overflow-auto">{JSON.stringify(results, null, 2)}</pre>
              </div>

              {reclassificationResult && (
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Après enrichissement :</h4>
                  <pre className="mt-2 bg-gray-100 p-4 rounded-md overflow-auto">
                    {JSON.stringify(reclassificationResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </details>
        </div>
      </div>
    );
  };

  const renderCompetencesResults = (results: CompetencesResult) => {
    // Sort competences by score in descending order
    const sortedCompetences = [...results.competences].sort((a, b) => b.score - a.score);

    return (
      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-bold mb-4">Analyse des compétences</h2>

        {/* Competences Section */}
        <div className="space-y-3">
          <h3 className="font-semibold">Compétences identifiées :</h3>
          <div className="space-y-2">
            {sortedCompetences.map((comp, index) => {
              const percentage = (comp.score * 100).toFixed(0);
              return (
                <div key={index} className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{comp.competence}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-48 bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }} />
                      </div>
                      <span className="text-sm text-gray-600 min-w-[3rem]">{percentage}%</span>
                    </div>
                  </div>
                  {comp.sous_competence && (
                    <div className="mt-2 px-3 py-1 bg-blue-50 border border-blue-100 rounded-md">
                      <span className="text-blue-700 font-medium">Sous-compétence:</span>
                      <span className="ml-2 text-blue-600">{comp.sous_competence}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Show original JSON for debugging */}
        <div className="mt-6">
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">Voir les données JSON</summary>
            <pre className="mt-2 bg-gray-100 p-4 rounded-md overflow-auto">{JSON.stringify(results, null, 2)}</pre>
          </details>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:text-gray-900">
      <main className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Analyseur de Projet</h1>

        <form className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
          <div>
            <label htmlFor="description" className="block mb-2 text-sm font-medium text-gray-900">
              Description du projet
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border rounded-lg min-h-[150px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-600"
              placeholder="Entrez la description de votre projet..."
            />
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAnalysis("TE")}
              className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:bg-gray-400 transition-colors"
            >
              {loading ? "Analyse en cours..." : "Analyse lien TE et leviers SGPE"}
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAnalysis("competences")}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
            >
              {loading ? "Analyse en cours..." : "Analyse compétences des collectivités"}
            </button>
          </div>
        </form>

        {teResults && renderResults(teResults)}
        {compResults && renderCompetencesResults(compResults)}
      </main>
    </div>
  );
}

const QuestionsSection = ({
  questions,
  answers,
  onAnswer,
  onGenerateResume,
  loadingResume,
}: {
  questions: Questions | null;
  answers: QuestionAnswers;
  onAnswer: (question: keyof Questions, answer: "oui" | "non") => void;
  onGenerateResume: () => void;
  loadingResume: boolean;
}) => {
  if (!questions) return null;

  // Check if all questions have been answered using the full question text
  const allQuestionsAnswered = Object.values(questions).every((question) => question && answers[question]);

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 space-y-6">
      <h3 className="font-semibold text-lg text-gray-800">Questions pour préciser votre projet :</h3>
      <div className="space-y-4">
        {Object.entries(questions).map(
          ([key, question]) =>
            question && (
              <div key={key} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <span className="font-medium text-gray-700 min-w-[40px]">{key}:</span>
                    <span className="text-gray-800">{question}</span>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => onAnswer(key as keyof Questions, "oui")}
                      className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                        answers[question] === "oui"
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Oui
                    </button>
                    <button
                      onClick={() => onAnswer(key as keyof Questions, "non")}
                      className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                        answers[question] === "non"
                          ? "bg-red-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Non
                    </button>
                  </div>
                </div>
              </div>
            ),
        )}
      </div>

      {/* Resume button */}
      <div className="flex justify-center pt-4">
        <button
          onClick={onGenerateResume}
          disabled={!allQuestionsAnswered || loadingResume}
          className={`px-6 py-2 rounded-lg font-medium transition-colors ${
            allQuestionsAnswered
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          {loadingResume ? "Génération..." : "Résumer mon projet"}
        </button>
      </div>
    </div>
  );
};

"use client";
import { useState } from "react";
import { analyzeProject } from "@/app/actions";
import { CompetencesResult, LeviersResult } from "@/app/types";

export default function Home() {
  const [description, setDescription] = useState("");
  const [teResults, setTeResults] = useState<LeviersResult | null>(null);
  const [compResults, setCompResults] = useState<CompetencesResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAnalysis = async (type: "TE" | "competences") => {
    setLoading(true);
    try {
      const data = await analyzeProject(description, type);
      if (type === "TE") {
        setTeResults(data as LeviersResult);
      } else {
        setCompResults(data as CompetencesResult);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderResults = (results: LeviersResult) => {
    return (
      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-bold mb-4">Analyse de la description du projet</h2>

        {/* Project Status */}
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
        {results.leviers.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Leviers identifiés :</h3>
            <div className="space-y-2">
              {results.leviers.map((levier, index) => {
                const [name, score] = Object.entries(levier)[0];
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

        {/* Reasoning Section */}
        {results.raisonnement && (
          <div className="space-y-3">
            <h3 className="font-semibold">Raisonnement :</h3>
            <div className="bg-white border rounded-lg p-4">
              <p className="whitespace-pre-wrap">{results.raisonnement}</p>
            </div>
          </div>
        )}

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

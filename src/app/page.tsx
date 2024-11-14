'use client'
import { useState } from "react";

interface Levier {
  [key: string]: number;
}

interface AnalysisResult {
  projet: string;
  is_related: boolean;
  leviers: Levier[];
}

const MOCKED_DATA = {
  "projet": "Pose de centrales solaires photovoltaïques sur bâtiments communaux (école, garderie et salle des fêtes)",
  "is_related": true,
  "leviers": [
      {"Electricité renouvelable": 0.95} as Levier,
      {"Rénovation (tertiaire)": 0.6} as Levier
  ]
}

export default function Home() {
  const [description, setDescription] = useState("");
  const [results, setResults] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      //const data = await analyzeProject(description);
      setResults(MOCKED_DATA as AnalysisResult);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderResults = (results: AnalysisResult) => {
    return (
      <div className="mt-8 space-y-6">
        <h2 className="text-xl font-bold mb-4">Analyse de la description du projet</h2>
        
        {/* Project Status */}
        <div className="space-y-2">
          <h3 className="font-semibold">Statut du projet :</h3>
          <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            results.is_related 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {results.is_related 
              ? '✓ En lien avec la transition écologique' 
              : '✗ Non lié à la transition écologique'}
          </div>
        </div>

        {/* Levers Section */}
        {results.is_related && results.leviers.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Leviers identifiés :</h3>
            <div className="space-y-2">
              {results.leviers.map((levier, index) => {
                const [name, score] = Object.entries(levier)[0];
                const percentage = (score * 100).toFixed(0);
                
                return (
                  <div 
                    key={index} 
                    className="bg-white border rounded-lg p-4 flex items-center justify-between"
                  >
                    <span className="font-medium">{name}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-48 bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-blue-600 h-2.5 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 min-w-[3rem]">
                        {percentage}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Show original JSON for debugging */}
        <div className="mt-6">
          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
              Voir les données JSON
            </summary>
            <pre className="mt-2 bg-gray-100 p-4 rounded-md overflow-auto">
              {JSON.stringify(results, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <main className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Analyseur de Projet</h1>
        
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
          <div>
            <label htmlFor="description" className="block mb-2 font-medium">
              Description du Projet
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 border rounded-lg min-h-[150px] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder:text-gray-600"
              placeholder="Entrez la description de votre projet..."
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Analyse en cours...' : 'Analyser'}
          </button>
        </form>

        {results && renderResults(results)}
      </main>
    </div>
  );
}

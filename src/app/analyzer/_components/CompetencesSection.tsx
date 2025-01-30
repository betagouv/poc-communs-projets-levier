import { CompetencesResult } from "@/app/types";


export interface CompetencesSectionProps {
    results: CompetencesResult;
  }
export const CompetencesSection = ({ results }: CompetencesSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Compétences identifiées :</h3>
      <div className="space-y-3">
        {results.competences
          .sort((a, b) => b.score - a.score)
          .map((comp, index) => {
            const percentage = (comp.score * 100).toFixed(0);
            return (
              <div key={index} className="bg-white border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-700">{comp.competence}</span>
                    {comp.sous_competence && (
                      <>
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-gray-600">{comp.sous_competence}</span>
                      </>
                    )}
                  </div>
                  <span className="text-sm font-medium text-gray-600">{percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}; 
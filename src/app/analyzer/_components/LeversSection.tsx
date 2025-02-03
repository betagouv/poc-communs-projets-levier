

export interface LeversSectionProps {
    levers: Record<string, number>;
    raisonnement: string | null;
    onGenerateQuestions: () => Promise<void>;
    loadingQuestions: boolean;
  }
  

export const LeversSection = ({
  levers,
  raisonnement,
}: LeversSectionProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h3 className="font-semibold">Leviers identifiés :</h3>
        <div className="space-y-2">
          {Object.entries(levers).map(([name, score], index) => {
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

      {raisonnement && (
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
            <p className="whitespace-pre-wrap">{raisonnement}</p>
          </div>
        </details>
      )}
    </div>
  );
}; 
export interface ClassificationSectionProps {
  classification: string | null;
  handleGenerateQuestions: () => void;
}

export function ClassificationSection({ classification, handleGenerateQuestions }: ClassificationSectionProps) {
  const hasEcologicalLink = classification?.toLowerCase().includes("a un lien avec la transition écologique");

  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Classification</h2>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div
            className={`px-3 py-1 rounded-md text-sm ${
              hasEcologicalLink
                ? "bg-green-100 text-green-800 border border-green-200"
                : "bg-orange-100 text-orange-800"
            }`}
          >
            {classification}
          </div>
          <button
            className={`ml-4 px-4 py-2 rounded-md text-sm transition-colors whitespace-nowrap ${
              hasEcologicalLink
                ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
            onClick={handleGenerateQuestions}
          >
            Préciser mon projet
          </button>
        </div>
      </div>
    </div>
  );
}

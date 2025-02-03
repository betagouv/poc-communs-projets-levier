import { useState } from "react";

export interface ResumeSectionProps {
  resume: string;
  onReclassify: () => Promise<void>;
  loadingReclassification: boolean;
}

export const ResumeSection = ({ resume, onReclassify, loadingReclassification }: ResumeSectionProps) => {
  const [displayNewClassificationHint, setDisplayNewClassificationHint] = useState(false);

  const handleClick = () => {
    setDisplayNewClassificationHint(true);
    onReclassify();
  };
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Résumé enrichi :</h3>
      <div className="bg-white border rounded-lg p-4">
        <p className="whitespace-pre-wrap text-gray-700">{resume}</p>
      </div>
      <div className="flex justify-center">
        <button
          onClick={handleClick}
          disabled={loadingReclassification}
          className="bg-indigo-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-indigo-600 disabled:bg-gray-400 transition-colors font-medium"
        >
          {loadingReclassification ? "Reclassification..." : "Reclassifier le projet"}
        </button>
      </div>

      {displayNewClassificationHint && !loadingReclassification && (
        <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-md text-sm">
          La classification et le raisonnement ont changé après l&#39;enrichissement du projet
        </div>
      )}
    </div>
  );
};

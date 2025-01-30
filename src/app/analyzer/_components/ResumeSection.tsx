export interface ResumeSectionProps {
  resume: string;
  onReclassify: () => Promise<void>;
  loadingReclassification: boolean;
}

export const ResumeSection = ({ resume, onReclassify, loadingReclassification }: ResumeSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Résumé enrichi :</h3>
      <div className="bg-white border rounded-lg p-4">
        <p className="whitespace-pre-wrap text-gray-700">{resume}</p>
      </div>
      <div className="flex justify-center">
        <button
          onClick={onReclassify}
          disabled={loadingReclassification}
          className="bg-indigo-500 text-white px-4 py-2 text-sm rounded-lg hover:bg-indigo-600 disabled:bg-gray-400 transition-colors font-medium"
        >
          {loadingReclassification ? "Reclassification..." : "Reclassifier le projet"}
        </button>
      </div>
    </div>
  );
};

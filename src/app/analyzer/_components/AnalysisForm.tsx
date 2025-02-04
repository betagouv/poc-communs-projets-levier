interface AnalysisFormProps {
  description: string;
  onDescriptionChange: (value: string) => void;
  onAnalyze: (type: "TE" | "competences") => Promise<void>;
  loading: boolean;
}

export const AnalysisForm = ({ description, onDescriptionChange, onAnalyze, loading }: AnalysisFormProps) => {
  return (
    <form className="space-y-4 bg-white p-6 rounded-lg shadow-sm">
      <div className="flex flex-col gap-4">
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          className="w-full p-4 border rounded-lg resize-none h-32"
          placeholder="Décrivez votre projet..."
        />
        <button
          onClick={() => onAnalyze("TE")}
          disabled={loading || !description}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
        >
          {loading ? "Analyse en cours..." : "Analyser les leviers"}
        </button>
      </div>
    </form>
  );
};

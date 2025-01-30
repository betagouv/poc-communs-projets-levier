import { LeviersResult } from "@/app/types";

interface ReclassificationSectionProps {
  result: LeviersResult;
  originalClassification: string | null;
}

export const ReclassificationSection = ({ result }: ReclassificationSectionProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${
            result.classification?.includes("projet a un lien avec la transition écologique")
              ? "bg-green-100 text-green-800"
              : result.classification?.includes("pas de lien avec la transition écologique")
                ? "bg-red-100 text-red-800"
                : "bg-orange-100 text-orange-800"
          }`}
        >
          {result.classification || "Non classifié"}
        </div>

        {result.raisonnement && (
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
              <p className="whitespace-pre-wrap">{result.raisonnement}</p>
            </div>
          </details>
        )}
      </div>
    </div>
  );
};

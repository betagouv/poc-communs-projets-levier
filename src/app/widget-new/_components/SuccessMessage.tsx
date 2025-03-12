export const SuccessMessage = ({ message }: { message: string }) => (
  <div className="flex items-center  p-2 mb-4 border border-green-600 rounded">
    <svg className="w-5 h-5 mr-2" fill="green" viewBox="0 0 20 20">
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
    <span className="text-black">{message}</span>
  </div>
);

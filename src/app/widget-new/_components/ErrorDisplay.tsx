import React, { FC } from "react";

type ErrorProps = {
  error: string | undefined;
};

export const ErrorDisplay: FC<ErrorProps> = ({ error }) => {
  if (!error) {
    return null;
  }
  return (
    <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
      <svg
        className="h-5 w-5 mr-2 text-red-500"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>
      {error}
    </div>
  );
};

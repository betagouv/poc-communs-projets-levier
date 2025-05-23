export interface LeviersResult {
  projet: string;
  classification: string | null;
  leviers: Record<string, number>;
  raisonnement: string | null;
  questions?: Questions;
}

interface Competence {
  competence: string;
  sous_competence: string;
  code: string;
  score: number;
}

export interface CompetencesResult {
  projet: string;
  competences: Competence[];
}

export interface Questions {
  [key: string]: string; // question text as key, additional metadata as value if needed
}

export interface QuestionAnswers {
  [question: string]: "oui" | "non";
}

// Add this to help with type safety
export interface FormattedQuestionAnswer {
  question: string;
  answer: "oui" | "non";
}

export type FNVReferenceTable = {
  FNV: string[];
  Levier: string[];
};

export type CompetenceReferenceTable = {
  code: string[];
  competence_sous_competence: string[];
};

export interface LeviersResult {
  projet: string;
  classification: string;
  leviers: Record<string, number>[];
  raisonnement: string;
  questions?: Questions;
}

interface Competence {
  competence: string;
  sous_competence: string;
  score: number;
}

export interface CompetencesResult {
  projet: string;
  competences: Competence[];
}

export interface Questions {
  Q1: string | null;
  Q2: string | null;
  Q3: string | null;
}

export interface QuestionAnswers {
  [question: string]: "oui" | "non";
}

// Add this to help with type safety
export interface FormattedQuestionAnswer {
  question: string;
  answer: "oui" | "non";
}

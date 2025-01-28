export interface LeviersResult {
  levier1: number;
  levier2: number;
  levier3: number;
  levier4: number;
  levier5: number;
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

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
  Q1?: "oui" | "non";
  Q2?: "oui" | "non";
  Q3?: "oui" | "non";
}

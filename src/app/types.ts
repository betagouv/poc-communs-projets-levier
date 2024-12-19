export interface LeviersResult {
  projet: string;
  classification: string;
  leviers: Record<string, number>[];
  raisonnement: string;
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


export enum Difficulty {
  BEGINNER = 'Beginner',
  INTERMEDIATE = 'Intermediate',
  ADVANCED = 'Advanced'
}

export enum GrammarPoint {
  NON_FINITE = 'Non-finite Verbs',
  RELATIVE_CLAUSE = 'Relative Clauses',
  ADVERBIAL_CLAUSE = 'Adverbial Clauses',
  INVERSION = 'Inversion',
  SUBJUNCTIVE = 'Subjunctive Mood',
  CONJUNCTIONS = 'Conjunctions'
}

export interface Question {
  id: string;
  sentenceBefore: string;
  sentenceAfter: string;
  options: string[];
  correctAnswer: string;
  difficulty: Difficulty;
  category: GrammarPoint;
  explanation: {
    rule: string;
    examples: string[];
    commonErrors: string;
  };
}

export interface UserAnswer {
  questionId: string;
  selectedOption: string;
  isCorrect: boolean;
  timestamp: number;
}

export interface SelectQuestion {
  type: 'select';
  phraseId: string;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface TypeQuestion {
  type: 'type';
  phraseId: string;
  question: string;
  exampleTranslation: string;
  correctAnswer: string;
}

export type QuizQuestion = SelectQuestion | TypeQuestion;

export interface QuizResult {
  phraseId: string;
  question: string;
  correct: boolean;
}

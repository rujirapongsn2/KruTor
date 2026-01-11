export enum AppScreen {
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  SUMMARY = 'SUMMARY',
  QUIZ = 'QUIZ',
  RESULT = 'RESULT'
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface SummaryData {
  originalTopic: string;
  summaryContent: string;
  keyPoints: string[];
}

export interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  score: number;
  selectedOption: number | null;
  showExplanation: boolean;
}

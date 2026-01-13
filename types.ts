export enum AppScreen {
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  SUMMARY = 'SUMMARY',
  QUIZ = 'QUIZ',
  RESULT = 'RESULT',
  REVIEW = 'REVIEW'
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  hint?: string;
}

export interface ContentSection {
  title: string;
  content: string;
}

export interface SummaryData {
  originalTopic: string;
  introduction: string;
  sections: ContentSection[];
  examples: string[];
  keyPoints: string[];
  infographicSvg?: string;
}

export interface QuizState {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  score: number;
  selectedOption: number | null;
  showExplanation: boolean;
  attempts: number;
  userAnswers: (number | null)[]; // Index of selected option for each question
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface FileData {
  base64: string;
  mimeType: string;
  fileName: string;
}

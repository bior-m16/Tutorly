export interface Step {
  stepNumber: number;
  title: string;
  explanation: string;
  formula?: string;
  /** A nudge toward this step that doesn't give it away (used by hint-first mode). */
  hint?: string;
}

export interface PracticeProblem {
  question: string;
  answer: string;
}

export interface QuizQuestion {
  question: string;
  choices: string[];
  answerIndex: number;
  explanation?: string;
}

export interface Quiz {
  title: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface Deck {
  id: string;
  title: string;
  cards: Flashcard[];
  createdAt: string;
}

export type WriteMode = 'general' | 'outline' | 'essay' | 'modify';

export interface WriteOptions {
  format?: string;
  tone?: string;
  type?: string;
  level?: string;
  paragraphs?: string;
  length?: string;
  change?: string;
}

export interface WritingPiece {
  id: string;
  mode: WriteMode;
  prompt: string;
  options: WriteOptions;
  output: string;
  createdAt: string;
}

export type StudyKind = 'quiz' | 'flashcards';

export interface ChatTurn {
  role: 'user' | 'assistant';
  text: string;
}

export type Subject =
  | 'Math'
  | 'Physics'
  | 'Chemistry'
  | 'Biology'
  | 'History'
  | 'Literature'
  | 'Geography'
  | 'Computer Science'
  | 'Other';

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface HomeworkResult {
  id: string;
  subject: Subject;
  question: string;
  answer: string;
  steps: Step[];
  imageUri: string;
  timestamp: string;
  difficulty: Difficulty;
  practice?: PracticeProblem[];
}

export type RootStackParamList = {
  Main: undefined;
  Scan: undefined;
  Result: { result: HomeworkResult };
  Ask: { result: HomeworkResult; stepNumber?: number };
  TypeQuestion: { initial?: string } | undefined;
  Calculator: undefined;
  Writing: undefined;
  WritingResult: { piece: WritingPiece };
  StudySetup: { kind: StudyKind };
  Quiz: { quiz: Quiz };
  Flashcards: { deck: Deck };
};

export type BottomTabParamList = {
  Home: undefined;
  History: undefined;
};

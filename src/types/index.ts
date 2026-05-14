export interface Step {
  stepNumber: number;
  title: string;
  explanation: string;
  formula?: string;
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
}

export type RootStackParamList = {
  Main: undefined;
  Scan: undefined;
  Result: { result: HomeworkResult };
};

export type BottomTabParamList = {
  Home: undefined;
  History: undefined;
};

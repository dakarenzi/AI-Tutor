export interface Message {
  role: 'user' | 'model';
  content: string;
  image?: string; // base64 data URL for display
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  timestamp: number;
}

export interface Exercise {
  questionType: 'MCQ' | 'FILL_IN_THE_BLANK' | 'SHORT_ANSWER';
  questionText: string;
  options?: string[];
  answer: string;
}

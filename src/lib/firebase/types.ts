import type { Timestamp, FieldValue } from 'firebase/firestore';

// Enums for type safety
export type SubjectType = 'math' | 'science' | 'english' | 'history' | 'geography' | 'computer' | 'physics' | 'chemistry' | 'biology';
export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';
export type CurriculumLevel = 'beginner' | 'intermediate' | 'advanced';
export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer' | 'long-answer';
export type UserRole = 'student' | 'teacher' | 'parent' | 'admin';
export type ProgressStatus = 'not-started' | 'attempted' | 'completed' | 'mastered';
export type SessionType = 'practice' | 'quiz' | 'exam' | 'revision';
export type SessionStatus = 'in-progress' | 'completed' | 'abandoned';
export type SubscriptionPlan = 'free' | 'premium' | 'enterprise';
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing';

// 1. Curriculum Collection
export interface Curriculum {
  id?: string;
  year: number;
  grade: number;
  subject: SubjectType;
  chapterId: string;
  chapterName: string;
  curriculumDetails: {
    topics: string[];
    learningObjectives: string[];
    prerequisites: string[];
    estimatedHours: number;
    orderIndex: number;
  };
  level: CurriculumLevel;
  isActive: boolean;
  metadata: {
    region: string;
    board: string;
    language: string;
  };
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// 2. Questions Collection
export interface QuestionOption {
  text: string;
  imageUrl?: string;
  latex?: string;
}

export interface Question {
  id?: string;
  curriculumId: string;
  year: number;
  grade: number;
  subject: SubjectType;
  chapterId: string;
  questionSetId?: string; // New field for question sets
  type: QuestionType;
  question: {
    text: string;
    imageUrl?: string;
    audioUrl?: string;
    latex?: string;
  };
  options: {
    a: QuestionOption;
    b: QuestionOption;
    c: QuestionOption;
    d: QuestionOption;
    e?: QuestionOption;
  };
  correctAnswerHash?: string; // Only on server
  explanation: string;
  hints: string[];
  difficulty: DifficultyLevel;
  points: number;
  tags: string[];
  estimatedTime: number;
  statistics: {
    attemptCount: number;
    correctCount: number;
    averageTime: number;
  };
  isActive?: boolean; // New field for soft delete
  createdBy?: string; // New field for tracking creator
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// Question Set interface
export interface QuestionSet {
  id?: string;
  name: string;
  curriculumId: string;
  maxQuestions: number;
  description?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// Client-safe version without answer
export interface ClientQuestion extends Omit<Question, 'correctAnswerHash'> {
  id: string;
}

// 3. User Progress Collection
export interface AttemptData {
  attemptNumber: number;
  selectedAnswer: string;
  isCorrect: boolean;
  timeSpent: number;
  hintsUsed: number;
  timestamp: Timestamp | FieldValue;
}

export interface UserProgress {
  id?: string;
  userId: string;
  questionId: string;
  curriculumId: string;
  attemptData: AttemptData[];
  bestAttempt: {
    isCorrect: boolean;
    timeSpent: number;
    score: number;
  };
  status: ProgressStatus;
  lastAttemptAt: Timestamp | FieldValue;
  createdAt: Timestamp | FieldValue;
}

// 4. Users Collection
export interface UserProfile {
  id?: string; // Firebase Auth UID
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  profile: {
    grade: number;
    age?: number;
    school?: string;
    preferredSubjects: SubjectType[];
    learningStyle: LearningStyle;
    timezone: string;
    language: string;
  };
  settings: {
    notifications: boolean;
    darkMode: boolean;
    fontSize: 'small' | 'medium' | 'large';
    soundEffects: boolean;
  };
  subscription: {
    plan: SubscriptionPlan;
    startDate: Timestamp | FieldValue;
    endDate: Timestamp | FieldValue;
    features: string[];
  };
  stats: {
    totalPoints: number;
    totalQuestionsAnswered: number;
    totalCorrectAnswers: number;
    streak: number;
    lastActiveDate: Timestamp | FieldValue;
    totalTimeSpent: number;
  };
  achievements: string[];
  createdAt: Timestamp | FieldValue;
  updatedAt: Timestamp | FieldValue;
}

// 5. Learning Sessions Collection
export interface SessionResponse {
  questionId: string;
  answer: string;
  timeSpent: number;
  isCorrect: boolean;
}

export interface LearningSession {
  id?: string;
  userId: string;
  curriculumId: string;
  chapterId: string;
  sessionType: SessionType;
  questions: string[];
  responses: SessionResponse[];
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeLimit?: number;
  actualTime: number;
  status: SessionStatus;
  startedAt: Timestamp | FieldValue;
  completedAt?: Timestamp | FieldValue;
}

// 6. Achievements Collection
export interface Achievement {
  id?: string;
  name: string;
  description: string;
  iconUrl: string;
  category: 'streak' | 'mastery' | 'speed' | 'accuracy' | 'special';
  criteria: {
    type: string;
    value: number;
    subject?: SubjectType;
  };
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  createdAt: Timestamp | FieldValue;
}

// 7. Analytics Collection
export interface Analytics {
  id?: string;
  userId: string;
  date: Timestamp | FieldValue;
  metrics: {
    questionsAttempted: number;
    correctAnswers: number;
    timeSpent: number;
    subjectBreakdown: {
      [key in SubjectType]?: {
        attempted: number;
        correct: number;
        timeSpent: number;
      };
    };
    difficultyBreakdown: {
      easy: { attempted: number; correct: number };
      medium: { attempted: number; correct: number };
      hard: { attempted: number; correct: number };
    };
    peakHours: number[];
  };
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: Timestamp | FieldValue;
  };
}

// 8. Leaderboard Collection
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  photoURL?: string;
  score: number;
  questionsAnswered: number;
  accuracy: number;
  rank: number;
}

export interface Leaderboard {
  id?: string;
  period: 'daily' | 'weekly' | 'monthly' | 'all-time';
  scope: 'global' | 'grade' | 'school' | 'friends';
  date: Timestamp | FieldValue;
  entries: LeaderboardEntry[];
  updatedAt: Timestamp | FieldValue;
}

// 9. Feedback Collection
export interface Feedback {
  id?: string;
  userId: string;
  questionId?: string;
  sessionId?: string;
  type: 'bug' | 'suggestion' | 'content-error' | 'difficulty';
  message: string;
  status: 'pending' | 'reviewed' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  adminNotes?: string;
  createdAt: Timestamp | FieldValue;
  resolvedAt?: Timestamp | FieldValue;
}

// 10. AI Interactions Collection
export interface AIInteraction {
  id?: string;
  userId: string;
  sessionId?: string;
  questionId?: string;
  type: 'hint' | 'explanation' | 'tutoring' | 'chat';
  userMessage: string;
  aiResponse: string;
  context: {
    subject?: SubjectType;
    topic?: string;
    difficulty?: DifficultyLevel;
  };
  tokens: number;
  helpful?: boolean;
  createdAt: Timestamp | FieldValue;
}

// Collection names constants
export const COLLECTIONS = {
  CURRICULUMS: 'curriculums',
  QUESTIONS: 'questions',
  USER_PROGRESS: 'user_progress',
  USERS: 'users',
  LEARNING_SESSIONS: 'learning_sessions',
  ACHIEVEMENTS: 'achievements',
  ANALYTICS: 'analytics',
  LEADERBOARDS: 'leaderboards',
  FEEDBACK: 'feedback',
  AI_INTERACTIONS: 'ai_interactions'
} as const;

// Helper types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
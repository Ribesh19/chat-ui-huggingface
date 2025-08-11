# Firebase Collections Schema for AI Tutoring Platform

## Core Collections

### 1. curriculums
```typescript
{
  id: string (auto-generated)
  year: number (e.g., 2024)
  grade: number (1-12)
  subject: string (math, science, english, etc.)
  chapterId: string
  chapterName: string
  curriculumDetails: {
    topics: string[]
    learningObjectives: string[]
    prerequisites: string[]
    estimatedHours: number
    orderIndex: number
  }
  level: 'beginner' | 'intermediate' | 'advanced'
  isActive: boolean
  createdAt: timestamp
  updatedAt: timestamp
  metadata: {
    region: string (US, UK, etc.)
    board: string (CBSE, ICSE, Common Core, etc.)
    language: string
  }
}
```

### 2. questions
```typescript
{
  id: string (auto-generated)
  curriculumId: string (reference to curriculums)
  year: number
  grade: number
  subject: string
  chapterId: string
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'short-answer' | 'long-answer'
  question: {
    text: string
    imageUrl?: string
    audioUrl?: string
    latex?: string
  }
  options: {
    a: { text: string, imageUrl?: string }
    b: { text: string, imageUrl?: string }
    c: { text: string, imageUrl?: string }
    d: { text: string, imageUrl?: string }
    e?: { text: string, imageUrl?: string }
  }
  correctAnswer: string (stored as hash on server)
  explanation: string
  hints: string[]
  difficulty: 'easy' | 'medium' | 'hard' | 'expert'
  points: number
  tags: string[]
  estimatedTime: number (in seconds)
  createdAt: timestamp
  updatedAt: timestamp
  statistics: {
    attemptCount: number
    correctCount: number
    averageTime: number
  }
}
```

### 3. user_progress
```typescript
{
  id: string (auto-generated)
  userId: string
  questionId: string
  curriculumId: string
  attemptData: {
    attemptNumber: number
    selectedAnswer: string
    isCorrect: boolean
    timeSpent: number (seconds)
    hintsUsed: number
    timestamp: timestamp
  }[]
  bestAttempt: {
    isCorrect: boolean
    timeSpent: number
    score: number
  }
  status: 'not-started' | 'attempted' | 'completed' | 'mastered'
  lastAttemptAt: timestamp
  createdAt: timestamp
}
```

### 4. users
```typescript
{
  id: string (Firebase Auth UID)
  email: string
  displayName: string
  photoURL?: string
  role: 'student' | 'teacher' | 'parent' | 'admin'
  profile: {
    grade: number
    age?: number
    school?: string
    preferredSubjects: string[]
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading-writing'
    timezone: string
    language: string
  }
  settings: {
    notifications: boolean
    darkMode: boolean
    fontSize: 'small' | 'medium' | 'large'
    soundEffects: boolean
  }
  subscription: {
    plan: 'free' | 'premium' | 'enterprise'
    startDate: timestamp
    endDate: timestamp
    features: string[]
  }
  stats: {
    totalPoints: number
    totalQuestionsAnswered: number
    totalCorrectAnswers: number
    streak: number
    lastActiveDate: timestamp
    totalTimeSpent: number (minutes)
  }
  achievements: string[] (achievement IDs)
  createdAt: timestamp
  updatedAt: timestamp
}
```

### 5. learning_sessions
```typescript
{
  id: string
  userId: string
  curriculumId: string
  chapterId: string
  sessionType: 'practice' | 'quiz' | 'exam' | 'revision'
  questions: string[] (question IDs)
  responses: {
    questionId: string
    answer: string
    timeSpent: number
    isCorrect: boolean
  }[]
  score: number
  totalQuestions: number
  correctAnswers: number
  timeLimit?: number
  actualTime: number
  status: 'in-progress' | 'completed' | 'abandoned'
  startedAt: timestamp
  completedAt?: timestamp
}
```

### 6. achievements
```typescript
{
  id: string
  name: string
  description: string
  iconUrl: string
  category: 'streak' | 'mastery' | 'speed' | 'accuracy' | 'special'
  criteria: {
    type: string
    value: number
    subject?: string
  }
  points: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  createdAt: timestamp
}
```

### 7. analytics
```typescript
{
  id: string
  userId: string
  date: timestamp
  metrics: {
    questionsAttempted: number
    correctAnswers: number
    timeSpent: number
    subjectBreakdown: {
      [subject: string]: {
        attempted: number
        correct: number
        timeSpent: number
      }
    }
    difficultyBreakdown: {
      easy: { attempted: number, correct: number }
      medium: { attempted: number, correct: number }
      hard: { attempted: number, correct: number }
    }
    peakHours: number[] (24-hour format)
  }
  streakData: {
    currentStreak: number
    longestStreak: number
    lastActiveDate: timestamp
  }
}
```

### 8. leaderboards
```typescript
{
  id: string
  period: 'daily' | 'weekly' | 'monthly' | 'all-time'
  scope: 'global' | 'grade' | 'school' | 'friends'
  date: timestamp
  entries: {
    userId: string
    displayName: string
    photoURL?: string
    score: number
    questionsAnswered: number
    accuracy: number
    rank: number
  }[]
  updatedAt: timestamp
}
```

### 9. feedback
```typescript
{
  id: string
  userId: string
  questionId?: string
  sessionId?: string
  type: 'bug' | 'suggestion' | 'content-error' | 'difficulty'
  message: string
  status: 'pending' | 'reviewed' | 'resolved'
  priority: 'low' | 'medium' | 'high'
  createdAt: timestamp
  resolvedAt?: timestamp
  adminNotes?: string
}
```

### 10. ai_interactions
```typescript
{
  id: string
  userId: string
  sessionId?: string
  questionId?: string
  type: 'hint' | 'explanation' | 'tutoring' | 'chat'
  userMessage: string
  aiResponse: string
  context: {
    subject?: string
    topic?: string
    difficulty?: string
  }
  tokens: number
  helpful: boolean?
  createdAt: timestamp
}
```

## Security Rules Considerations

1. **Answers Protection**: Store correct answers as hashed values, validate on server-side only
2. **User Data**: Users can only read/write their own data
3. **Progress Tracking**: Write-only from authenticated users, read own progress only
4. **Questions**: Read-only for authenticated users, no answer field exposed
5. **Analytics**: Aggregated data only, no PII exposed

## Indexes Required

1. `questions`: (curriculumId, difficulty, subject)
2. `user_progress`: (userId, curriculumId, status)
3. `learning_sessions`: (userId, status, createdAt)
4. `analytics`: (userId, date)
5. `leaderboards`: (period, scope, date)

## Data Migration Considerations

- Use batch operations for bulk imports
- Implement versioning for schema changes
- Create backup collections before major updates
- Use Cloud Functions for data consistency
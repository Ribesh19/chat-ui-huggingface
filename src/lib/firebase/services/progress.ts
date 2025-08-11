import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  updateDoc,
  addDoc,
  serverTimestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '$lib/firebase/client';
import type { 
  UserProgress, 
  ProgressStatus,
  SubjectType,
  DifficultyLevel
} from '$lib/firebase/types';
import { COLLECTIONS } from '$lib/firebase/types';

/**
 * Get user progress for a specific question
 */
export async function getUserQuestionProgress(
  userId: string, 
  questionId: string
): Promise<UserProgress | null> {
  try {
    const q = query(
      collection(db, COLLECTIONS.USER_PROGRESS),
      where('userId', '==', userId),
      where('questionId', '==', questionId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data()
    } as UserProgress;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    throw error;
  }
}

/**
 * Get user progress for a curriculum/chapter
 */
export async function getUserChapterProgress(
  userId: string,
  curriculumId: string
): Promise<{
  totalQuestions: number;
  attempted: number;
  completed: number;
  mastered: number;
  averageScore: number;
  progress: UserProgress[];
}> {
  try {
    const q = query(
      collection(db, COLLECTIONS.USER_PROGRESS),
      where('userId', '==', userId),
      where('curriculumId', '==', curriculumId)
    );
    
    const querySnapshot = await getDocs(q);
    const progress: UserProgress[] = [];
    
    let totalScore = 0;
    let attempted = 0;
    let completed = 0;
    let mastered = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as UserProgress;
      progress.push({
        id: doc.id,
        ...data
      });
      
      if (data.status === 'attempted') attempted++;
      if (data.status === 'completed') completed++;
      if (data.status === 'mastered') mastered++;
      
      if (data.bestAttempt?.score) {
        totalScore += data.bestAttempt.score;
      }
    });
    
    // Get total questions in this curriculum
    const questionsQuery = query(
      collection(db, COLLECTIONS.QUESTIONS),
      where('curriculumId', '==', curriculumId)
    );
    const questionsSnapshot = await getDocs(questionsQuery);
    const totalQuestions = questionsSnapshot.size;
    
    return {
      totalQuestions,
      attempted,
      completed,
      mastered,
      averageScore: progress.length > 0 ? Math.round(totalScore / progress.length) : 0,
      progress
    };
  } catch (error) {
    console.error('Error fetching chapter progress:', error);
    throw error;
  }
}

/**
 * Get user's overall progress summary
 */
export async function getUserProgressSummary(userId: string): Promise<{
  bySubject: Record<string, {
    total: number;
    attempted: number;
    completed: number;
    mastered: number;
  }>;
  byDifficulty: Record<DifficultyLevel, {
    attempted: number;
    successRate: number;
  }>;
  recentActivity: UserProgress[];
  recommendations: string[];
}> {
  try {
    // Get all user progress
    const progressQuery = query(
      collection(db, COLLECTIONS.USER_PROGRESS),
      where('userId', '==', userId),
      orderBy('lastAttemptAt', 'desc')
    );
    
    const progressSnapshot = await getDocs(progressQuery);
    
    const bySubject: Record<string, any> = {};
    const byDifficulty: Record<string, any> = {
      easy: { attempted: 0, correct: 0 },
      medium: { attempted: 0, correct: 0 },
      hard: { attempted: 0, correct: 0 },
      expert: { attempted: 0, correct: 0 }
    };
    
    const recentActivity: UserProgress[] = [];
    const questionIds = new Set<string>();
    
    progressSnapshot.forEach((doc, index) => {
      const data = doc.data() as UserProgress;
      questionIds.add(data.questionId);
      
      // Add to recent activity (limit to 10)
      if (index < 10) {
        recentActivity.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    // Fetch question details for analysis
    if (questionIds.size > 0) {
      // Note: Firestore doesn't support 'in' queries with more than 10 items
      // You might need to batch these queries
      const questionPromises = Array.from(questionIds).map(id => 
        getDoc(doc(db, COLLECTIONS.QUESTIONS, id))
      );
      
      const questionDocs = await Promise.all(questionPromises);
      
      questionDocs.forEach((qDoc) => {
        if (qDoc.exists()) {
          const question = qDoc.data();
          const subject = question.subject;
          const difficulty = question.difficulty;
          
          // Initialize subject if not exists
          if (!bySubject[subject]) {
            bySubject[subject] = {
              total: 0,
              attempted: 0,
              completed: 0,
              mastered: 0
            };
          }
          
          // Count by subject
          bySubject[subject].total++;
          
          // Find corresponding progress
          progressSnapshot.forEach((pDoc) => {
            const progress = pDoc.data() as UserProgress;
            if (progress.questionId === qDoc.id) {
              if (progress.status === 'attempted') bySubject[subject].attempted++;
              if (progress.status === 'completed') bySubject[subject].completed++;
              if (progress.status === 'mastered') bySubject[subject].mastered++;
              
              // Count by difficulty
              byDifficulty[difficulty].attempted += progress.attemptData.length;
              byDifficulty[difficulty].correct += progress.attemptData.filter(a => a.isCorrect).length;
            }
          });
        }
      });
    }
    
    // Calculate success rates
    Object.keys(byDifficulty).forEach(level => {
      const data = byDifficulty[level];
      data.successRate = data.attempted > 0 
        ? Math.round((data.correct / data.attempted) * 100)
        : 0;
    });
    
    // Generate recommendations
    const recommendations = generateRecommendations(bySubject, byDifficulty);
    
    return {
      bySubject,
      byDifficulty: byDifficulty as Record<DifficultyLevel, any>,
      recentActivity,
      recommendations
    };
  } catch (error) {
    console.error('Error fetching user progress summary:', error);
    throw error;
  }
}

/**
 * Get learning streaks
 */
export async function getUserStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  todayCompleted: boolean;
  streakDates: Date[];
}> {
  try {
    // This would analyze daily activity to calculate streaks
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const q = query(
      collection(db, COLLECTIONS.USER_PROGRESS),
      where('userId', '==', userId),
      where('lastAttemptAt', '>=', thirtyDaysAgo),
      orderBy('lastAttemptAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const dates = new Set<string>();
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as UserProgress;
      if (data.lastAttemptAt) {
        const date = new Date(data.lastAttemptAt.seconds * 1000);
        dates.add(date.toISOString().split('T')[0]);
      }
    });
    
    // Calculate streaks from unique dates
    const sortedDates = Array.from(dates).sort();
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = dates.has(today);
    
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        const currDate = new Date(sortedDates[i]);
        const dayDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      
      longestStreak = Math.max(longestStreak, tempStreak);
      
      // Check if current date is part of current streak
      if (sortedDates[i] === today || 
          (i === sortedDates.length - 1 && 
           new Date(sortedDates[i]).toISOString().split('T')[0] === 
           new Date(Date.now() - 86400000).toISOString().split('T')[0])) {
        currentStreak = tempStreak;
      }
    }
    
    return {
      currentStreak,
      longestStreak,
      todayCompleted,
      streakDates: sortedDates.map(d => new Date(d))
    };
  } catch (error) {
    console.error('Error calculating streak:', error);
    throw error;
  }
}

/**
 * Generate personalized recommendations
 */
function generateRecommendations(
  bySubject: Record<string, any>,
  byDifficulty: Record<string, any>
): string[] {
  const recommendations: string[] = [];
  
  // Analyze subject performance
  Object.entries(bySubject).forEach(([subject, data]) => {
    const completionRate = data.total > 0 ? (data.completed / data.total) * 100 : 0;
    
    if (completionRate < 50) {
      recommendations.push(`Focus more on ${subject} - you've completed only ${Math.round(completionRate)}% of questions`);
    }
    
    if (data.mastered > 5) {
      recommendations.push(`Great progress in ${subject}! Try harder difficulty levels`);
    }
  });
  
  // Analyze difficulty performance
  if (byDifficulty.easy.successRate > 90 && byDifficulty.medium.attempted < 10) {
    recommendations.push('You\'re doing great with easy questions! Time to challenge yourself with medium difficulty');
  }
  
  if (byDifficulty.hard.successRate < 40 && byDifficulty.hard.attempted > 5) {
    recommendations.push('Hard questions are challenging. Review fundamentals and try more medium questions first');
  }
  
  // Limit recommendations
  return recommendations.slice(0, 3);
}
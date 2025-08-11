import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  QueryConstraint,
  DocumentData,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '$lib/firebase/client';
import type { 
  Question, 
  ClientQuestion, 
  DifficultyLevel, 
  SubjectType 
} from '$lib/firebase/types';
import { COLLECTIONS } from '$lib/firebase/types';

/**
 * Get a question by ID (client-safe, no answer)
 */
export async function getQuestion(questionId: string): Promise<ClientQuestion | null> {
  try {
    const docRef = doc(db, COLLECTIONS.QUESTIONS, questionId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data() as Question;
    // Remove answer hash before sending to client
    const { correctAnswerHash, ...clientData } = data;
    
    return {
      ...clientData,
      id: docSnap.id
    } as ClientQuestion;
  } catch (error) {
    console.error('Error fetching question:', error);
    throw error;
  }
}

/**
 * Get questions for a specific curriculum and chapter
 */
export async function getQuestionsByChapter(
  curriculumId: string,
  chapterId: string,
  difficulty?: DifficultyLevel,
  limitCount: number = 10
): Promise<ClientQuestion[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('curriculumId', '==', curriculumId),
      where('chapterId', '==', chapterId)
    ];
    
    if (difficulty) {
      constraints.push(where('difficulty', '==', difficulty));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(limitCount));
    
    const q = query(collection(db, COLLECTIONS.QUESTIONS), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const questions: ClientQuestion[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Question;
      const { correctAnswerHash, ...clientData } = data;
      questions.push({
        ...clientData,
        id: doc.id
      } as ClientQuestion);
    });
    
    return questions;
  } catch (error) {
    console.error('Error fetching questions by chapter:', error);
    throw error;
  }
}

/**
 * Get random questions for practice
 */
export async function getRandomQuestions(
  subject: SubjectType,
  grade: number,
  difficulty?: DifficultyLevel,
  count: number = 10
): Promise<ClientQuestion[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('subject', '==', subject),
      where('grade', '==', grade)
    ];
    
    if (difficulty) {
      constraints.push(where('difficulty', '==', difficulty));
    }
    
    // Get more questions than needed to randomize
    constraints.push(limit(count * 3));
    
    const q = query(collection(db, COLLECTIONS.QUESTIONS), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const allQuestions: ClientQuestion[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Question;
      const { correctAnswerHash, ...clientData } = data;
      allQuestions.push({
        ...clientData,
        id: doc.id
      } as ClientQuestion);
    });
    
    // Randomize and return requested count
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  } catch (error) {
    console.error('Error fetching random questions:', error);
    throw error;
  }
}

/**
 * Get questions by difficulty for adaptive learning
 */
export async function getAdaptiveQuestions(
  userId: string,
  subject: SubjectType,
  currentLevel: DifficultyLevel
): Promise<ClientQuestion[]> {
  try {
    // Logic to determine next difficulty based on user performance
    // This would check user_progress collection to determine success rate
    
    const nextDifficulty = await determineNextDifficulty(userId, subject, currentLevel);
    
    const q = query(
      collection(db, COLLECTIONS.QUESTIONS),
      where('subject', '==', subject),
      where('difficulty', '==', nextDifficulty),
      orderBy('statistics.attemptCount', 'asc'), // Prioritize less attempted questions
      limit(5)
    );
    
    const querySnapshot = await getDocs(q);
    const questions: ClientQuestion[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Question;
      const { correctAnswerHash, ...clientData } = data;
      questions.push({
        ...clientData,
        id: doc.id
      } as ClientQuestion);
    });
    
    return questions;
  } catch (error) {
    console.error('Error fetching adaptive questions:', error);
    throw error;
  }
}

/**
 * Helper function to determine next difficulty level
 */
async function determineNextDifficulty(
  userId: string,
  subject: SubjectType,
  currentLevel: DifficultyLevel
): Promise<DifficultyLevel> {
  // This would analyze user's recent performance
  // For now, return current level
  return currentLevel;
}

/**
 * Search questions by tags or keywords
 */
export async function searchQuestions(
  searchTerm: string,
  filters?: {
    subject?: SubjectType;
    grade?: number;
    difficulty?: DifficultyLevel;
  }
): Promise<ClientQuestion[]> {
  try {
    const constraints: QueryConstraint[] = [];
    
    if (filters?.subject) {
      constraints.push(where('subject', '==', filters.subject));
    }
    if (filters?.grade) {
      constraints.push(where('grade', '==', filters.grade));
    }
    if (filters?.difficulty) {
      constraints.push(where('difficulty', '==', filters.difficulty));
    }
    
    // For full-text search, you might want to use Algolia or ElasticSearch
    // This is a simple tag-based search
    constraints.push(where('tags', 'array-contains', searchTerm.toLowerCase()));
    constraints.push(limit(20));
    
    const q = query(collection(db, COLLECTIONS.QUESTIONS), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const questions: ClientQuestion[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Question;
      const { correctAnswerHash, ...clientData } = data;
      questions.push({
        ...clientData,
        id: doc.id
      } as ClientQuestion);
    });
    
    return questions;
  } catch (error) {
    console.error('Error searching questions:', error);
    throw error;
  }
}
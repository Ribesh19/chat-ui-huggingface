import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '$lib/firebase/client';
import type { 
  Curriculum,
  SubjectType,
  CurriculumLevel
} from '$lib/firebase/types';
import { COLLECTIONS } from '$lib/firebase/types';

/**
 * Get all curriculums for a grade and subject
 */
export async function getCurriculums(
  grade: number,
  subject?: SubjectType
): Promise<Curriculum[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('grade', '==', grade),
      where('isActive', '==', true)
    ];
    
    if (subject) {
      constraints.push(where('subject', '==', subject));
    }
    
    constraints.push(orderBy('curriculumDetails.orderIndex', 'asc'));
    
    const q = query(collection(db, COLLECTIONS.CURRICULUMS), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const curriculums: Curriculum[] = [];
    querySnapshot.forEach((doc) => {
      curriculums.push({
        id: doc.id,
        ...doc.data()
      } as Curriculum);
    });
    
    return curriculums;
  } catch (error) {
    console.error('Error fetching curriculums:', error);
    throw error;
  }
}

/**
 * Get a specific curriculum by ID
 */
export async function getCurriculum(curriculumId: string): Promise<Curriculum | null> {
  try {
    const docRef = doc(db, COLLECTIONS.CURRICULUMS, curriculumId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Curriculum;
  } catch (error) {
    console.error('Error fetching curriculum:', error);
    throw error;
  }
}

/**
 * Get curriculum chapters for a subject
 */
export async function getCurriculumChapters(
  grade: number,
  subject: SubjectType,
  level?: CurriculumLevel
): Promise<{
  chapters: Array<{
    id: string;
    name: string;
    topics: string[];
    estimatedHours: number;
    orderIndex: number;
  }>;
  totalHours: number;
}> {
  try {
    const constraints: QueryConstraint[] = [
      where('grade', '==', grade),
      where('subject', '==', subject),
      where('isActive', '==', true)
    ];
    
    if (level) {
      constraints.push(where('level', '==', level));
    }
    
    constraints.push(orderBy('curriculumDetails.orderIndex', 'asc'));
    
    const q = query(collection(db, COLLECTIONS.CURRICULUMS), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const chapters: Array<{
      id: string;
      name: string;
      topics: string[];
      estimatedHours: number;
      orderIndex: number;
    }> = [];
    
    let totalHours = 0;
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Curriculum;
      chapters.push({
        id: data.chapterId,
        name: data.chapterName,
        topics: data.curriculumDetails.topics,
        estimatedHours: data.curriculumDetails.estimatedHours,
        orderIndex: data.curriculumDetails.orderIndex
      });
      totalHours += data.curriculumDetails.estimatedHours;
    });
    
    return {
      chapters,
      totalHours
    };
  } catch (error) {
    console.error('Error fetching curriculum chapters:', error);
    throw error;
  }
}

/**
 * Get recommended curriculum based on user profile
 */
export async function getRecommendedCurriculum(
  grade: number,
  preferredSubjects: SubjectType[],
  region?: string
): Promise<Curriculum[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('grade', '==', grade),
      where('isActive', '==', true)
    ];
    
    if (preferredSubjects.length > 0) {
      // Firestore doesn't support 'in' with arrays directly for multiple subjects
      // We'll filter client-side for now
    }
    
    if (region) {
      constraints.push(where('metadata.region', '==', region));
    }
    
    constraints.push(orderBy('curriculumDetails.orderIndex', 'asc'));
    
    const q = query(collection(db, COLLECTIONS.CURRICULUMS), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const curriculums: Curriculum[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as Curriculum;
      // Filter by preferred subjects
      if (preferredSubjects.length === 0 || preferredSubjects.includes(data.subject)) {
        curriculums.push({
          id: doc.id,
          ...data
        });
      }
    });
    
    // Sort by relevance (preferred subjects first)
    curriculums.sort((a, b) => {
      const aPreferred = preferredSubjects.indexOf(a.subject);
      const bPreferred = preferredSubjects.indexOf(b.subject);
      
      if (aPreferred !== -1 && bPreferred === -1) return -1;
      if (aPreferred === -1 && bPreferred !== -1) return 1;
      if (aPreferred !== -1 && bPreferred !== -1) {
        return aPreferred - bPreferred;
      }
      
      return a.curriculumDetails.orderIndex - b.curriculumDetails.orderIndex;
    });
    
    return curriculums;
  } catch (error) {
    console.error('Error fetching recommended curriculum:', error);
    throw error;
  }
}

/**
 * Get curriculum learning path
 */
export async function getLearningPath(
  userId: string,
  subject: SubjectType,
  grade: number
): Promise<{
  completed: string[];
  inProgress: string[];
  upcoming: string[];
  nextRecommended: Curriculum | null;
}> {
  try {
    // Get all curriculums for the subject
    const curriculums = await getCurriculums(grade, subject);
    
    // Get user progress
    const progressQuery = query(
      collection(db, COLLECTIONS.USER_PROGRESS),
      where('userId', '==', userId)
    );
    const progressSnapshot = await getDocs(progressQuery);
    
    const curriculumProgress: Map<string, number> = new Map();
    
    progressSnapshot.forEach((doc) => {
      const data = doc.data();
      const curriculumId = data.curriculumId;
      const current = curriculumProgress.get(curriculumId) || 0;
      
      if (data.status === 'completed' || data.status === 'mastered') {
        curriculumProgress.set(curriculumId, current + 1);
      }
    });
    
    const completed: string[] = [];
    const inProgress: string[] = [];
    const upcoming: string[] = [];
    let nextRecommended: Curriculum | null = null;
    
    for (const curriculum of curriculums) {
      const progress = curriculumProgress.get(curriculum.id!) || 0;
      
      // Get total questions in curriculum
      const questionsQuery = query(
        collection(db, COLLECTIONS.QUESTIONS),
        where('curriculumId', '==', curriculum.id)
      );
      const questionsSnapshot = await getDocs(questionsQuery);
      const totalQuestions = questionsSnapshot.size;
      
      if (totalQuestions === 0) {
        upcoming.push(curriculum.id!);
      } else if (progress >= totalQuestions * 0.8) {
        completed.push(curriculum.id!);
      } else if (progress > 0) {
        inProgress.push(curriculum.id!);
        if (!nextRecommended) {
          nextRecommended = curriculum;
        }
      } else {
        upcoming.push(curriculum.id!);
        if (!nextRecommended) {
          nextRecommended = curriculum;
        }
      }
    }
    
    return {
      completed,
      inProgress,
      upcoming,
      nextRecommended
    };
  } catch (error) {
    console.error('Error getting learning path:', error);
    throw error;
  }
}
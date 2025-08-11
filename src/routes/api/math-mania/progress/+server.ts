import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { adminDb } from '$lib/firebase/admin';
import { getAuth } from 'firebase-admin/auth';

// GET - Get user's progress for a specific curriculum or all curriculums
export const GET: RequestHandler = async ({ request, url }) => {
  try {
    // Get user ID from Firebase Auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      return json({ 
        success: false, 
        error: 'Invalid authentication token' 
      }, { status: 401 });
    }

    const curriculumId = url.searchParams.get('curriculum');
    const grade = url.searchParams.get('grade');
    const subject = url.searchParams.get('subject');

    console.log('📊 Progress GET request:', { userId, curriculumId, grade, subject });

    // First, get ALL progress for this user to see what's in the database
    const allUserProgress = await adminDb
      .collection('userProgress')
      .where('userId', '==', userId)
      .get();
    
    console.log('📊 ALL user progress records:', allUserProgress.size);
    if (allUserProgress.size > 0) {
      console.log('📊 Sample record:', allUserProgress.docs[0].data());
    }

    // Now do the filtered query
    let progressQuery = adminDb
      .collection('userProgress')
      .where('userId', '==', userId);

    if (curriculumId) {
      progressQuery = progressQuery.where('curriculumId', '==', curriculumId);
    }

    // Temporarily skip grade/subject filtering to avoid composite index issues
    // We'll filter in memory instead
    const progressSnapshot = await progressQuery.get();
    console.log('📊 Progress records after curriculumId filter:', progressSnapshot.size);
    
    let progress = progressSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      lastUpdated: doc.data().lastUpdated?.toDate() || null
    }));

    // Filter by grade and subject in memory if needed
    if (grade && subject) {
      // Handle grade as string or number
      const gradeValue = isNaN(Number(grade)) ? grade : parseInt(grade);
      console.log('📊 Filtering in memory by:', { grade: gradeValue, subject });
      progress = progress.filter(p => {
        // Compare both as strings for consistency
        return String(p.grade) === String(gradeValue) && p.subject === subject;
      });
      console.log('📊 Progress records after in-memory filter:', progress.length);
    }

    // Calculate mastery levels based on accuracy
    const progressWithMastery = progress.map(p => ({
      ...p,
      masteryLevel: calculateMasteryLevel(p.accuracy),
      masteryColor: getMasteryColor(p.accuracy)
    }));

    return json({
      success: true,
      data: progressWithMastery
    });

  } catch (error) {
    console.error('Error fetching user progress:', error);
    return json({ 
      success: false, 
      error: 'Failed to fetch progress',
      details: error.message
    }, { status: 500 });
  }
};

// POST - Save or update user progress
export const POST: RequestHandler = async ({ request }) => {
  try {
    // Get user ID from Firebase Auth token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let userId: string;
    
    try {
      const decodedToken = await getAuth().verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      return json({ 
        success: false, 
        error: 'Invalid authentication token' 
      }, { status: 401 });
    }

    const {
      curriculumId,
      grade,
      subject,
      questionSetId,
      questionsAttempted,
      questionsCorrect,
      totalQuestions,
      accuracy,
      timeSpent,
      completedAt
    } = await request.json();

    // Check if progress already exists for this curriculum and question set
    const existingQuery = await adminDb
      .collection('userProgress')
      .where('userId', '==', userId)
      .where('curriculumId', '==', curriculumId)
      .where('questionSetId', '==', questionSetId)
      .limit(1)
      .get();

    let progressDoc;
    const progressData = {
      userId,
      curriculumId,
      grade,
      subject,
      questionSetId,
      questionsAttempted,
      questionsCorrect,
      totalQuestions,
      accuracy,
      timeSpent,
      completedAt: completedAt ? new Date(completedAt) : new Date(),
      lastUpdated: new Date()
    };

    if (!existingQuery.empty) {
      // Update existing progress
      progressDoc = existingQuery.docs[0];
      await progressDoc.ref.update(progressData);
    } else {
      // Create new progress record
      const newProgressRef = await adminDb
        .collection('userProgress')
        .add({
          ...progressData,
          createdAt: new Date()
        });
      progressDoc = await newProgressRef.get();
    }

    return json({
      success: true,
      data: {
        id: progressDoc.id,
        ...progressData,
        masteryLevel: calculateMasteryLevel(accuracy),
        masteryColor: getMasteryColor(accuracy)
      }
    });

  } catch (error) {
    console.error('Error saving user progress:', error);
    return json({ 
      success: false, 
      error: 'Failed to save progress',
      details: error.message
    }, { status: 500 });
  }
};

// Helper functions
function calculateMasteryLevel(accuracy: number): string {
  if (accuracy >= 90) return 'mastered';
  if (accuracy >= 70) return 'proficient';
  if (accuracy >= 50) return 'familiar';
  if (accuracy > 0) return 'attempted';
  return 'not-started';
}

function getMasteryColor(accuracy: number): { bg: string; border: string } {
  if (accuracy >= 90) return { bg: 'bg-purple-200', border: 'border-purple-400' };
  if (accuracy >= 70) return { bg: 'bg-green-100', border: 'border-green-300' };
  if (accuracy >= 50) return { bg: 'bg-amber-100', border: 'border-amber-300' };
  if (accuracy > 0) return { bg: 'bg-orange-100', border: 'border-orange-300' };
  return { bg: 'bg-white', border: 'border-gray-300' };
}